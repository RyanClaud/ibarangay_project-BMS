'use client';

import { useEffect, useRef } from 'react';

interface CivicMotionBackgroundProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
}

export function CivicMotionBackground({
  className = '',
  particleCount = 42,
  interactive = true,
}: CivicMotionBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
      alpha: number;
      color: string;
      pulseSpeed: number;
      angle: number;
    }

    const colors = [
      '#60A5FA', // Azure blue
      '#38BDF8', // Cyan light
      '#34D399', // Emerald
      '#FBBF24', // Amber gold
      '#FFFFFF', // White star
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.3,
        alpha: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: 0.02 + Math.random() * 0.03,
        angle: Math.random() * Math.PI * 2,
      });
    }

    // Expanding concentric wave ripples
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      speed: number;
    }

    const ripples: Ripple[] = [];
    let rippleTimer = 0;

    // Mouse / Touch interaction
    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    if (interactive && canvas.parentElement) {
      canvas.parentElement.addEventListener('mousemove', onPointerMove);
      canvas.parentElement.addEventListener('mouseleave', onPointerLeave);
      canvas.parentElement.addEventListener('touchmove', onPointerMove, { passive: true });
      canvas.parentElement.addEventListener('touchend', onPointerLeave);
    }

    // Animation render loop
    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw periodic expanding wave ripples
      rippleTimer++;
      if (rippleTimer % 120 === 0) {
        ripples.push({
          x: width * (0.2 + Math.random() * 0.6),
          y: height * (0.3 + Math.random() * 0.4),
          radius: 5,
          maxRadius: Math.min(width, height) * 0.75,
          alpha: 0.35,
          speed: 0.9,
        });
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha -= 0.003;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, r.alpha * 0.4)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw connecting mesh filaments between nearby particles
      const maxDist = 75;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Update & Draw individual particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse alpha
        p.angle += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.angle) * 0.25;

        // Pointer influence
        if (pointer.active) {
          const pdx = p.x - pointer.x;
          const pdy = p.y - pointer.y;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pDist < 80 && pDist > 0) {
            const force = (80 - pDist) / 80;
            p.x += (pdx / pDist) * force * 1.5;
            p.y += (pdy / pDist) * force * 1.5;
          }
        }

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce gently off boundaries
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Draw particle glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', onPointerMove);
        canvas.parentElement.removeEventListener('mouseleave', onPointerLeave);
        canvas.parentElement.removeEventListener('touchmove', onPointerMove);
        canvas.parentElement.removeEventListener('touchend', onPointerLeave);
      }
    };
  }, [particleCount, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full opacity-85 ${className}`}
      aria-hidden="true"
    />
  );
}

