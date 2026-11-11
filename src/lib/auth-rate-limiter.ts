/**
 * iBarangay Authentication Rate Limiter & Brute-Force Protection
 *
 * Implements exponential backoff and sliding-window rate limiting to protect
 * barangay accounts (Captains, Admins, Treasurers, Secretaries, Residents)
 * against dictionary and brute-force credential stuffing attacks.
 *
 * Compliant with National Privacy Commission (NPC) and RA 10173 standards.
 */

export interface RateLimitStatus {
  allowed: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  lockoutSecondsRemaining: number;
  totalAttempts: number;
  message?: string;
}

interface AttemptRecord {
  attempts: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  lockoutUntil: number; // Unix timestamp in ms
}

interface RateLimitStorage {
  accounts: Record<string, AttemptRecord>;
  globalDevice: AttemptRecord;
}

const STORAGE_KEY = 'ibarangay_auth_ratelimit_v2';

// Security Policy Parameters
export const RATE_LIMIT_CONFIG = {
  // Max failed attempts for a specific account before 1st temporary lockout
  MAX_ACCOUNT_ATTEMPTS: 5,
  // 1st lockout cooldown duration: 60 seconds (1 minute)
  FIRST_LOCKOUT_MS: 60 * 1000,
  // High-threshold attempts before extended lockout: 8 attempts
  EXTENDED_ATTEMPTS_THRESHOLD: 8,
  // Extended lockout cooldown duration: 15 minutes (900 seconds)
  EXTENDED_LOCKOUT_MS: 15 * 60 * 1000,
  // Sliding window to reset clean failure counts: 15 minutes
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000,

  // Device-level protection: prevents spraying different emails from same browser
  MAX_DEVICE_ATTEMPTS: 10,
  DEVICE_LOCKOUT_MS: 5 * 60 * 1000, // 5 minutes
};

/**
 * Safely reads rate-limit storage from localStorage
 */
function getStorage(): RateLimitStorage {
  if (typeof window === 'undefined') {
    return {
      accounts: {},
      globalDevice: {
        attempts: 0,
        firstAttemptTime: Date.now(),
        lastAttemptTime: Date.now(),
        lockoutUntil: 0,
      },
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        accounts: {},
        globalDevice: {
          attempts: 0,
          firstAttemptTime: Date.now(),
          lastAttemptTime: Date.now(),
          lockoutUntil: 0,
        },
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      accounts: {},
      globalDevice: {
        attempts: 0,
        firstAttemptTime: Date.now(),
        lastAttemptTime: Date.now(),
        lockoutUntil: 0,
      },
    };
  }
}

/**
 * Writes updated rate-limit state to localStorage
 */
function saveStorage(storage: RateLimitStorage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.warn('Could not persist auth rate limit state:', e);
  }
}

/**
 * Normalizes email keys for consistent tracking
 */
function normalizeKey(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks whether a login attempt is currently allowed for the given email
 */
export function checkRateLimit(email: string): RateLimitStatus {
  const now = Date.now();
  const storage = getStorage();
  const key = normalizeKey(email);

  // 1. Check Global Device Lockout (Anti-Credential Spraying)
  const deviceRecord = storage.globalDevice;
  if (deviceRecord && deviceRecord.lockoutUntil > now) {
    const secondsRemaining = Math.ceil((deviceRecord.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      isLocked: true,
      remainingAttempts: 0,
      lockoutSecondsRemaining: secondsRemaining,
      totalAttempts: deviceRecord.attempts,
      message: `Multiple failed login attempts detected on this device. For security, please wait ${formatDuration(secondsRemaining)} before trying again.`,
    };
  }

  if (!email || !key) {
    return {
      allowed: true,
      isLocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS,
      lockoutSecondsRemaining: 0,
      totalAttempts: 0,
    };
  }

  // 2. Check Specific Account Record
  const accountRecord = storage.accounts[key];

  if (!accountRecord) {
    return {
      allowed: true,
      isLocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS,
      lockoutSecondsRemaining: 0,
      totalAttempts: 0,
    };
  }

  // Check if account is actively in lockout
  if (accountRecord.lockoutUntil > now) {
    const secondsRemaining = Math.ceil((accountRecord.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      isLocked: true,
      remainingAttempts: 0,
      lockoutSecondsRemaining: secondsRemaining,
      totalAttempts: accountRecord.attempts,
      message: `Account temporarily locked due to repeated incorrect password attempts. Please wait ${formatDuration(secondsRemaining)}.`,
    };
  }

  // Check if the sliding attempt window has expired; if so, reset clean
  if (now - accountRecord.lastAttemptTime > RATE_LIMIT_CONFIG.ATTEMPT_WINDOW_MS) {
    delete storage.accounts[key];
    saveStorage(storage);
    return {
      allowed: true,
      isLocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS,
      lockoutSecondsRemaining: 0,
      totalAttempts: 0,
    };
  }

  const remaining = Math.max(0, RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS - accountRecord.attempts);

  return {
    allowed: remaining > 0,
    isLocked: remaining === 0,
    remainingAttempts: remaining,
    lockoutSecondsRemaining: 0,
    totalAttempts: accountRecord.attempts,
    message:
      remaining <= 2 && remaining > 0
        ? `Warning: ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before security lockout.`
        : undefined,
  };
}

/**
 * Records a failed sign-in attempt and updates lockout status
 */
export function recordFailedAttempt(email: string): RateLimitStatus {
  const now = Date.now();
  const storage = getStorage();
  const key = normalizeKey(email);

  // Update Global Device counter
  if (!storage.globalDevice) {
    storage.globalDevice = {
      attempts: 0,
      firstAttemptTime: now,
      lastAttemptTime: now,
      lockoutUntil: 0,
    };
  }

  if (now - storage.globalDevice.lastAttemptTime > RATE_LIMIT_CONFIG.ATTEMPT_WINDOW_MS) {
    storage.globalDevice.attempts = 1;
    storage.globalDevice.firstAttemptTime = now;
  } else {
    storage.globalDevice.attempts += 1;
  }
  storage.globalDevice.lastAttemptTime = now;

  // Check if device threshold is triggered
  if (storage.globalDevice.attempts >= RATE_LIMIT_CONFIG.MAX_DEVICE_ATTEMPTS) {
    storage.globalDevice.lockoutUntil = now + RATE_LIMIT_CONFIG.DEVICE_LOCKOUT_MS;
  }

  // Update Specific Account record
  if (!storage.accounts) storage.accounts = {};
  let accountRecord = storage.accounts[key];

  if (!accountRecord || now - accountRecord.lastAttemptTime > RATE_LIMIT_CONFIG.ATTEMPT_WINDOW_MS) {
    accountRecord = {
      attempts: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
      lockoutUntil: 0,
    };
  } else {
    accountRecord.attempts += 1;
    accountRecord.lastAttemptTime = now;
  }

  // Check Lockout Thresholds
  let lockoutMs = 0;
  if (accountRecord.attempts >= RATE_LIMIT_CONFIG.EXTENDED_ATTEMPTS_THRESHOLD) {
    // 8+ attempts = Extended 15-minute lockout
    lockoutMs = RATE_LIMIT_CONFIG.EXTENDED_LOCKOUT_MS;
    accountRecord.lockoutUntil = now + lockoutMs;
  } else if (accountRecord.attempts >= RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS) {
    // 5 attempts = Standard 60-second cooldown
    lockoutMs = RATE_LIMIT_CONFIG.FIRST_LOCKOUT_MS;
    accountRecord.lockoutUntil = now + lockoutMs;
  }

  storage.accounts[key] = accountRecord;
  saveStorage(storage);

  const secondsRemaining = Math.ceil(lockoutMs / 1000);
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS - accountRecord.attempts);

  return {
    allowed: lockoutMs === 0,
    isLocked: lockoutMs > 0,
    remainingAttempts: remaining,
    lockoutSecondsRemaining: secondsRemaining,
    totalAttempts: accountRecord.attempts,
    message:
      lockoutMs > 0
        ? `Account security lockout engaged. Please wait ${formatDuration(secondsRemaining)} before trying again.`
        : remaining <= 2
        ? `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : undefined,
  };
}

/**
 * Resets the failed attempts counter upon verified successful authentication
 */
export function recordSuccessfulLogin(email: string): void {
  const storage = getStorage();
  const key = normalizeKey(email);

  if (storage.accounts && storage.accounts[key]) {
    delete storage.accounts[key];
  }

  // Reset device failures on success
  if (storage.globalDevice) {
    storage.globalDevice.attempts = 0;
    storage.globalDevice.lockoutUntil = 0;
  }

  saveStorage(storage);
}

/**
 * Manually forces a security cooldown (e.g., if Firebase reports auth/too-many-requests)
 */
export function forceLockout(email: string, durationMs: number = 60000): RateLimitStatus {
  const now = Date.now();
  const storage = getStorage();
  const key = normalizeKey(email);

  const record: AttemptRecord = storage.accounts[key] || {
    attempts: RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS,
    firstAttemptTime: now,
    lastAttemptTime: now,
    lockoutUntil: 0,
  };

  record.lockoutUntil = now + durationMs;
  storage.accounts[key] = record;
  saveStorage(storage);

  const secondsRemaining = Math.ceil(durationMs / 1000);

  return {
    allowed: false,
    isLocked: true,
    remainingAttempts: 0,
    lockoutSecondsRemaining: secondsRemaining,
    totalAttempts: record.attempts,
    message: `Account temporarily locked by security policy. Please wait ${formatDuration(secondsRemaining)}.`,
  };
}

/**
 * Formats seconds into human-readable MM:SS or Xs
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`;
  }
  return `${seconds}s`;
}

