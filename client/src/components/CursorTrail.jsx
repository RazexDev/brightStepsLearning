import { useEffect } from 'react';

/**
 * CursorTrail — mounts globally, adds:
 *   1. Sparkle / emoji trail following the mouse
 *   2. Confetti burst on click
 * No DOM or state leaks — fully cleaned up on unmount.
 */

const TRAIL_EMOJIS = ['✨','⭐','💫','🌟','💛','🎉'];
const BURST_EMOJIS = ['🎊','⭐','✨','🌟','💛','🎈','💫','🎉','🍀','🌈'];

function spawnParticle(x, y, emoji, vx, vy, size, lifetime) {
  const el = document.createElement('span');
  el.textContent = emoji;
  el.style.cssText = `
    position: fixed;
    left: ${x}px; top: ${y}px;
    font-size: ${size}px;
    pointer-events: none;
    z-index: 99990;
    transform: translate(-50%, -50%);
    user-select: none;
    will-change: transform, opacity;
  `;
  document.body.appendChild(el);

  let start = null;
  let curX = x, curY = y;

  const animate = (ts) => {
    if (!start) start = ts;
    const progress = (ts - start) / lifetime; // 0 → 1
    if (progress >= 1) { el.remove(); return; }

    curX += vx;
    curY += vy;
    vy   += 0.15; // gravity

    const scale   = 1 - progress * 0.4;
    const opacity = 1 - progress;

    el.style.left    = `${curX}px`;
    el.style.top     = `${curY}px`;
    el.style.opacity = opacity;
    el.style.transform = `translate(-50%,-50%) scale(${scale}) rotate(${progress * 360}deg)`;
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

export default function CursorTrail() {
  useEffect(() => {
    let lastX = -999, lastY = -999;
    let trailThrottle = 0;

    // ── Trail on mousemove ──────────────────────────────────────────────────
    const onMove = (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      trailThrottle++;
      if (dist < 12 || trailThrottle % 3 !== 0) return;

      lastX = e.clientX;
      lastY = e.clientY;

      const emoji = TRAIL_EMOJIS[Math.floor(Math.random() * TRAIL_EMOJIS.length)];
      const vx    = (Math.random() - 0.5) * 1.5;
      const vy    = -Math.random() * 2 - 1;
      const size  = 12 + Math.random() * 10;
      spawnParticle(e.clientX, e.clientY, emoji, vx, vy, size, 700);
    };

    // ── Burst on click ──────────────────────────────────────────────────────
    const onClick = (e) => {
      const count = 14 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const emoji   = BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)];
        const angle   = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed   = 3 + Math.random() * 5;
        const vx      = Math.cos(angle) * speed;
        const vy      = Math.sin(angle) * speed - 4;
        const size    = 14 + Math.random() * 14;
        const life    = 800 + Math.random() * 400;
        spawnParticle(e.clientX, e.clientY, emoji, vx, vy, size, life);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return null; // no DOM output — everything is imperatively created
}