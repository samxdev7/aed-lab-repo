import { useState, useEffect } from 'react';

export function useMouseParallax(intensity = 15) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    let running = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const step = () => {
      // Lerp suave
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setOffset({ x: currentX, y: currentY });

      // Si ya llegó al destino, detenemos el bucle (ahorra rendimiento)
      if (Math.abs(targetX - currentX) < 0.01 && Math.abs(targetY - currentY) < 0.01) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * intensity;
      targetY = (e.clientY / window.innerHeight - 0.5) * intensity;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, [intensity]);

  return offset;
}