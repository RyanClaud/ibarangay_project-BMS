import { NextRequest, NextResponse } from 'next/server';

interface IPRateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  lockoutUntil: number;
}

// In-memory sliding log for server-side brute-force prevention
const ipRateLimits = new Map<string, IPRateLimitRecord>();
const emailRateLimits = new Map<string, IPRateLimitRecord>();

const SERVER_CONFIG = {
  MAX_EMAIL_ATTEMPTS: 5,
  EMAIL_LOCKOUT_MS: 60 * 1000, // 1 minute
  EXTENDED_EMAIL_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes for 8+ attempts
  
  MAX_IP_ATTEMPTS: 15,
  IP_LOCKOUT_MS: 10 * 60 * 1000, // 10 minutes for hammering IPs
  
  WINDOW_MS: 15 * 60 * 1000,
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email } = body;
    const ip = getClientIp(req);
    const normalizedEmail = (email || '').trim().toLowerCase();
    const now = Date.now();

    // Clean up stale entries every 100 calls
    if (Math.random() < 0.05) {
      for (const [key, record] of ipRateLimits.entries()) {
        if (now - record.lastAttempt > SERVER_CONFIG.WINDOW_MS && record.lockoutUntil < now) {
          ipRateLimits.delete(key);
        }
      }
      for (const [key, record] of emailRateLimits.entries()) {
        if (now - record.lastAttempt > SERVER_CONFIG.WINDOW_MS && record.lockoutUntil < now) {
          emailRateLimits.delete(key);
        }
      }
    }

    // 1. Check IP lockout
    const ipRecord = ipRateLimits.get(ip);
    if (ipRecord && ipRecord.lockoutUntil > now) {
      const retryAfter = Math.ceil((ipRecord.lockoutUntil - now) / 1000);
      return NextResponse.json(
        {
          allowed: false,
          isLocked: true,
          retryAfter,
          message: `Too many requests from this IP address. Please retry in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(SERVER_CONFIG.MAX_IP_ATTEMPTS),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Check Email lockout if email provided
    if (normalizedEmail) {
      const emailRecord = emailRateLimits.get(normalizedEmail);
      if (emailRecord && emailRecord.lockoutUntil > now) {
        const retryAfter = Math.ceil((emailRecord.lockoutUntil - now) / 1000);
        return NextResponse.json(
          {
            allowed: false,
            isLocked: true,
            retryAfter,
            message: `Account authentication is temporarily locked due to repeated incorrect password attempts. Please wait ${retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(SERVER_CONFIG.MAX_EMAIL_ATTEMPTS),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }

    // Handle Actions
    if (action === 'check') {
      const currentAttempts = normalizedEmail ? emailRateLimits.get(normalizedEmail)?.attempts || 0 : 0;
      const remaining = Math.max(0, SERVER_CONFIG.MAX_EMAIL_ATTEMPTS - currentAttempts);

      return NextResponse.json({
        allowed: true,
        isLocked: false,
        remainingAttempts: remaining,
      });
    }

    if (action === 'record_fail') {
      // Record failure for IP
      let curIp = ipRateLimits.get(ip);
      if (!curIp || now - curIp.lastAttempt > SERVER_CONFIG.WINDOW_MS) {
        curIp = { attempts: 1, firstAttempt: now, lastAttempt: now, lockoutUntil: 0 };
      } else {
        curIp.attempts += 1;
        curIp.lastAttempt = now;
      }
      if (curIp.attempts >= SERVER_CONFIG.MAX_IP_ATTEMPTS) {
        curIp.lockoutUntil = now + SERVER_CONFIG.IP_LOCKOUT_MS;
      }
      ipRateLimits.set(ip, curIp);

      // Record failure for Email
      if (normalizedEmail) {
        let curEmail = emailRateLimits.get(normalizedEmail);
        if (!curEmail || now - curEmail.lastAttempt > SERVER_CONFIG.WINDOW_MS) {
          curEmail = { attempts: 1, firstAttempt: now, lastAttempt: now, lockoutUntil: 0 };
        } else {
          curEmail.attempts += 1;
          curEmail.lastAttempt = now;
        }

        if (curEmail.attempts >= 8) {
          curEmail.lockoutUntil = now + SERVER_CONFIG.EXTENDED_EMAIL_LOCKOUT_MS;
        } else if (curEmail.attempts >= SERVER_CONFIG.MAX_EMAIL_ATTEMPTS) {
          curEmail.lockoutUntil = now + SERVER_CONFIG.EMAIL_LOCKOUT_MS;
        }
        emailRateLimits.set(normalizedEmail, curEmail);

        if (curEmail.lockoutUntil > now) {
          const retryAfter = Math.ceil((curEmail.lockoutUntil - now) / 1000);
          return NextResponse.json(
            {
              allowed: false,
              isLocked: true,
              retryAfter,
              message: `Too many failed login attempts. Account paused for ${retryAfter}s.`,
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(retryAfter),
              },
            }
          );
        }

        return NextResponse.json({
          allowed: true,
          isLocked: false,
          remainingAttempts: Math.max(0, SERVER_CONFIG.MAX_EMAIL_ATTEMPTS - curEmail.attempts),
          totalAttempts: curEmail.attempts,
        });
      }

      return NextResponse.json({ allowed: true, isLocked: false });
    }

    if (action === 'reset' && normalizedEmail) {
      emailRateLimits.delete(normalizedEmail);
      if (ipRecord) {
        ipRecord.attempts = Math.max(0, ipRecord.attempts - 1);
        ipRateLimits.set(ip, ipRecord);
      }
      return NextResponse.json({ success: true, message: 'Rate limit counter reset.' });
    }

    return NextResponse.json({ allowed: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
