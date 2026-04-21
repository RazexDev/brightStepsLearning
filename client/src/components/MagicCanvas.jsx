import React, { useEffect, useRef } from 'react';

/**
 * MagicCanvas — pure canvas 3D scene
 * No npm dependencies. Uses requestAnimationFrame + manual perspective projection.
 * Renders: orbiting 3D stars, floating planets, spinning wireframe cubes, particle dust.
 */
export default function MagicCanvas({ style = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let W, H;

    // ── helpers ─────────────────────────────────────────────────────────────
    const rand  = (a, b) => a + Math.random() * (b - a);
    const TAU   = Math.PI * 2;

    // 3-D perspective projection
    const project = (x3, y3, z3, fov = 320) => {
      const scale = fov / (fov + z3);
      return { x: W / 2 + x3 * scale, y: H / 2 + y3 * scale, scale };
    };

    // ── resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── OBJECTS ──────────────────────────────────────────────────────────────

    // 1. Star field (simple 2D but with twinkle depth illusion)
    const STARS = Array.from({ length: 80 }, () => ({
      x: rand(-W / 2, W / 2),
      y: rand(-H / 2, H / 2),
      z: rand(0, 400),
      r: rand(1, 3),
      phase: rand(0, TAU),
      speed: rand(0.005, 0.02),
    }));

    // 2. Floating 3-D orbiting planets (sphere illusion via radial gradient)
    const PLANETS = [
      { ox: -220, oy: -100, oz: 0, orbitR: 60, orbitSpeed: 0.008, angle: 0,    radius: 22, colors: ['#FDEAE6','#E85C45'], shadowC: '#C0422F' },
      { ox:  180, oy:  80,  oz: 0, orbitR: 45, orbitSpeed: 0.012, angle: 2.1,  radius: 16, colors: ['#FEF4CC','#F2B53A'], shadowC: '#C8881A' },
      { ox:  0,   oy:  160, oz: 0, orbitR: 35, orbitSpeed: 0.015, angle: 4.2,  radius: 12, colors: ['#E0F7F3','#3DB5A0'], shadowC: '#1E8C78' },
      { ox: -160, oy:  120, oz: 0, orbitR: 28, orbitSpeed: 0.01,  angle: 1.0,  radius: 10, colors: ['#EDEAFA','#9C80D2'], shadowC: '#6B52B0' },
      { ox:  240, oy: -140, oz: 0, orbitR: 50, orbitSpeed: 0.007, angle: 3.5,  radius: 18, colors: ['#E2F6E7','#5EAD6E'], shadowC: '#3D8450' },
    ];

    // 3. Wireframe spinning cubes
    const makeCube = (cx, cy, cz, size) => {
      const h = size / 2;
      const verts = [
        [-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],
        [-h,-h, h],[h,-h, h],[h,h, h],[-h,h, h],
      ].map(([x,y,z]) => ({ x: cx+x, y: cy+y, z: cz+z }));
      const edges = [
        [0,1],[1,2],[2,3],[3,0], // back
        [4,5],[5,6],[6,7],[7,4], // front
        [0,4],[1,5],[2,6],[3,7], // sides
      ];
      return { verts, edges, rx: rand(0, TAU), ry: rand(0, TAU), rz: rand(0, TAU),
               dRx: rand(-0.008, 0.008), dRy: rand(0.006, 0.016), dRz: rand(-0.005, 0.005),
               cx, cy, cz };
    };
    const CUBES = [
      makeCube(-260, -80,  -80,  60),
      makeCube( 260,  120, -60,  45),
      makeCube(-80,   200, -100, 38),
      makeCube( 80,  -200, -50,  30),
    ];

    // 4. Floating emoji particles
    const EMOJIS_LIST = ['⭐','🌟','✨','💛','🎈','🌈','🦋','💫','🍀','🎵'];
    const EMOJIS = Array.from({ length: 14 }, () => ({
      emoji: EMOJIS_LIST[Math.floor(rand(0, EMOJIS_LIST.length))],
      x: rand(0, W), y: rand(0, H),
      vx: rand(-0.3, 0.3), vy: rand(-0.5, -0.15),
      size: rand(18, 32),
      opacity: rand(0.25, 0.55),
      phase: rand(0, TAU),
    }));

    // ── ROTATION MATH ─────────────────────────────────────────────────────────
    const rotateX = (v, a) => ({ x: v.x, y: v.y*Math.cos(a)-v.z*Math.sin(a), z: v.y*Math.sin(a)+v.z*Math.cos(a) });
    const rotateY = (v, a) => ({ x: v.x*Math.cos(a)+v.z*Math.sin(a), y: v.y, z: -v.x*Math.sin(a)+v.z*Math.cos(a) });
    const rotateZ = (v, a) => ({ x: v.x*Math.cos(a)-v.y*Math.sin(a), y: v.x*Math.sin(a)+v.y*Math.cos(a), z: v.z });

    // ── DRAW FUNCTIONS ────────────────────────────────────────────────────────

    const drawStar = (ctx, cx, cy, r, points, fill, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.42;
        i === 0 ? ctx.moveTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
                : ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawPlanet = (ctx, x, y, r, colors, shadowC) => {
      // Main sphere with radial gradient
      const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grd.addColorStop(0, colors[0]);
      grd.addColorStop(1, colors[1]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = grd;
      ctx.fill();
      // Highlight
      const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x - r * 0.35, y - r * 0.35, r * 0.6);
      hl.addColorStop(0, 'rgba(255,255,255,0.55)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = hl;
      ctx.fill();
      // Ring (for larger planets)
      if (r > 18) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = shadowC;
        ctx.lineWidth = r * 0.22;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.7, r * 0.35, -0.4, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawCube = (ctx, cube, t) => {
      const { verts, edges, rx, ry, rz, cx, cy, cz } = cube;
      const rotated = verts.map(v => {
        let r = { x: v.x - cx, y: v.y - cy, z: v.z - cz };
        r = rotateX(r, rx + cube.dRx * t);
        r = rotateY(r, ry + cube.dRy * t);
        r = rotateZ(r, rz + cube.dRz * t);
        return { x: r.x + cx, y: r.y + cy, z: r.z + cz };
      });
      const projected = rotated.map(v => project(v.x, v.y, v.z, 300));

      ctx.save();
      ctx.strokeStyle = 'rgba(242,181,58,0.35)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(242,181,58,0.5)';
      ctx.shadowBlur = 6;
      edges.forEach(([a, b]) => {
        const pa = projected[a], pb = projected[b];
        const avgZ = (rotated[a].z + rotated[b].z) / 2;
        ctx.globalAlpha = Math.max(0.05, 0.4 - avgZ / 600);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
      ctx.restore();
    };

    // ── MAIN LOOP ─────────────────────────────────────────────────────────────
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t++;

      // --- background stars ---
      STARS.forEach(s => {
        s.z = (s.z - 0.5 + 400) % 400;
        const p = project(s.x, s.y, s.z, 320);
        const twinkle = 0.3 + 0.3 * Math.sin(s.phase + t * s.speed);
        ctx.save();
        ctx.globalAlpha = twinkle * p.scale;
        ctx.fillStyle = '#F2B53A';
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.r * p.scale, 0, TAU);
        ctx.fill();
        ctx.restore();
      });

      // --- wireframe cubes ---
      CUBES.forEach(cube => drawCube(ctx, cube, t));

      // --- planets ---
      PLANETS.forEach(p => {
        p.angle += p.orbitSpeed;
        const px = p.ox + Math.cos(p.angle) * p.orbitR;
        const py = p.oy + Math.sin(p.angle) * p.orbitR * 0.4;
        const screen = project(px, py, p.oz, 400);
        ctx.save();
        ctx.globalAlpha = 0.75;
        drawPlanet(ctx, screen.x, screen.y, p.radius * screen.scale, p.colors, p.shadowC);
        ctx.restore();
      });

      // --- 3D star shapes ---
      STARS.slice(0, 12).forEach((s, i) => {
        const phase = t * 0.01 + i * 0.8;
        const px = W * 0.1 + (i % 4) * (W * 0.27) + Math.sin(phase) * 20;
        const py = H * 0.15 + Math.floor(i / 4) * (H * 0.35) + Math.cos(phase * 0.7) * 15;
        const alpha = 0.12 + 0.08 * Math.sin(phase * 1.3);
        const size  = 10 + 6 * Math.sin(phase * 0.9);
        drawStar(ctx, px, py, size, 5, '#F2B53A', alpha);
      });

      // --- floating emojis ---
      EMOJIS.forEach(e => {
        e.x += e.vx + Math.sin(t * 0.01 + e.phase) * 0.4;
        e.y += e.vy;
        if (e.y < -50) { e.y = H + 40; e.x = rand(0, W); }
        ctx.save();
        ctx.globalAlpha = e.opacity * (0.7 + 0.3 * Math.sin(t * 0.02 + e.phase));
        ctx.font = `${e.size}px serif`;
        ctx.fillText(e.emoji, e.x, e.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        ...style,
      }}
    />
  );
}