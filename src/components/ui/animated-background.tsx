'use client';

import { useEffect, useRef, useState } from 'react';

interface Blob {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  targetRadius: number;
  color: string;
  speed: number;
  angle: number;
  angleSpeed: number;
}

interface AnimatedBackgroundProps {
  enabled?: boolean;
}

export function AnimatedBackground({ enabled = true }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRefRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Initialize from media query on mount
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const blobs = useRef<Blob[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);

  // Check for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Don't run animation if disabled
    if (!enabled) return;

    const canvas = canvasRef.current;
    const colorRef = colorRefRef.current;
    if (!canvas || !colorRef) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Get semantic colors from Tailwind classes
    const getColor = (className: string): string => {
      const div = document.createElement('div');
      div.className = className;
      document.body.appendChild(div);
      const color = window.getComputedStyle(div).backgroundColor;
      document.body.removeChild(div);
      return color || '#000000'; // Fallback color
    };

    const backgroundColor = getColor('bg-background');
    const pinkColor = getColor('bg-pink-400'); // #D456AA
    const tealColor = getColor('bg-teal-300'); // #36A6B7
    const purpleColor = getColor('bg-purple-700'); // #553172
    const yellowColor = getColor('bg-primary'); // Golden yellow accent

    // Resize canvas to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize blobs
    const initBlobs = () => {
      const colors = [pinkColor, tealColor, purpleColor, yellowColor];
      const blobCount = prefersReducedMotion ? 3 : 6;

      blobs.current = Array.from({ length: blobCount }, (_, i) => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        return {
          x,
          y,
          targetX: x,
          targetY: y,
          radius: (200 + Math.random() * 250) * 1.25, // 25% bigger
          targetRadius: (200 + Math.random() * 250) * 1.25, // 25% bigger
          color: colors[i % colors.length] || '#000000', // Ensure color is defined
          speed: prefersReducedMotion ? 0.18 : (0.5 + Math.random() * 0.5) * 0.6, // 40% slower
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.005 * 0.6, // 40% slower rotation
        };
      });
    };
    initBlobs();

    // Animation loop
    const animate = () => {
      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw blobs
      blobs.current.forEach((blob) => {
        // Update position toward target
        blob.x += (blob.targetX - blob.x) * 0.01 * blob.speed;
        blob.y += (blob.targetY - blob.y) * 0.01 * blob.speed;
        blob.radius += (blob.targetRadius - blob.radius) * 0.01 * blob.speed;

        // Update angle for organic movement
        if (!prefersReducedMotion) {
          blob.angle += blob.angleSpeed;
        }

        // Set new random target occasionally (40% slower rate)
        if (Math.random() < 0.002 * 0.6) {
          blob.targetX = Math.random() * canvas.width;
          blob.targetY = Math.random() * canvas.height;
          blob.targetRadius = (100 + Math.random() * 150) * 1.25; // 25% bigger
        }

        // Add organic wobble using angle
        const wobbleX = Math.cos(blob.angle) * 30;
        const wobbleY = Math.sin(blob.angle) * 30;

        // Draw blob with gradient
        const gradient = ctx.createRadialGradient(
          blob.x + wobbleX,
          blob.y + wobbleY,
          0,
          blob.x + wobbleX,
          blob.y + wobbleY,
          blob.radius
        );

        // Extract RGB from color string and create gradient with alpha
        const rgbMatch = blob.color.match(/\d+/g);
        if (rgbMatch) {
          const [r, g, b] = rgbMatch;
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.216)`); // 10% more transparent (0.24 * 0.9)
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.108)`); // 10% more transparent (0.12 * 0.9)
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x + wobbleX, blob.y + wobbleY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [prefersReducedMotion, enabled]);

  // Don't render canvas if animation is disabled
  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Hidden div for color reference - ensures semantic tokens are loaded */}
      <div ref={colorRefRef} className="hidden">
        <div className="bg-background" />
        <div className="bg-pink-400" />
        <div className="bg-teal-300" />
        <div className="bg-purple-700" />
        <div className="bg-primary" />
      </div>

      <canvas ref={canvasRef} className="fixed inset-0 -z-10" aria-hidden="true" />
    </>
  );
}
