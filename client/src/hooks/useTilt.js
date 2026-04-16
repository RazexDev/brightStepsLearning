import { useRef, useCallback } from 'react';

/**
 * useTilt — returns { ref, handlers } to add 3D perspective tilt to any element.
 * Works purely via inline style — no CSS classes needed.
 *
 * Usage:
 *   const { ref, handlers } = useTilt({ max: 14, scale: 1.04 });
 *   <div ref={ref} {...handlers} style={ref.current?.style}> … </div>
 */
export function useTilt({ max = 14, scale = 1.04, glare = true } = {}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;  // -1 → 1
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;  // -1 → 1

    const rotY =  x * max;
    const rotX = -y * max;

    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale},${scale},${scale})`;
    el.style.transition = 'transform 0.08s ease-out';

    // Glare overlay
    if (glare) {
      let glareEl = el.querySelector('.tilt-glare');
      if (!glareEl) {
        glareEl = document.createElement('div');
        glareEl.className = 'tilt-glare';
        glareEl.style.cssText = `
          position:absolute; inset:0; border-radius:inherit;
          pointer-events:none; z-index:10; overflow:hidden;
        `;
        el.style.position = el.style.position || 'relative';
        el.appendChild(glareEl);
      }
      const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      const intensity = Math.sqrt(x*x + y*y) * 0.25;
      glareEl.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${intensity}) 0%, rgba(255,255,255,0) 70%)`;
    }
  }, [max, scale, glare]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
    const glareEl = el.querySelector('.tilt-glare');
    if (glareEl) glareEl.style.background = 'none';
  }, []);

  return { ref, handlers: { onMouseMove, onMouseLeave } };
}