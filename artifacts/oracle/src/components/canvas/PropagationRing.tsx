import { useEffect, useRef } from "react";

interface Props {
  intensity: number;
  emotionalValence: number;
}

export function PropagationRing({ intensity, emotionalValence }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    window.addEventListener("resize", resize);
    resize();

    const isNegative = emotionalValence < -0.2;
    const isPositive = emotionalValence > 0.2;
    const colorHsl = isNegative ? "0, 80%, 55%" : isPositive ? "120, 80%, 50%" : "175, 80%, 50%";

    const draw = () => {
      time += 0.5;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.min(cx, cy) - 2;

      for (let i = 0; i < 3; i++) {
        const offset = i * (maxRadius / 3);
        const radius = ((time + offset) % maxRadius);
        const alpha = 1 - (radius / maxRadius);
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${colorHsl}, ${alpha * (intensity / 10)})`;
        ctx.lineWidth = 1 + (intensity / 5);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, emotionalValence]);

  return <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />;
}
