import { useEffect, useRef } from "react";

interface Props {
  isTraining: boolean;
}

export function NeuralWeightMatrix({ isTraining }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    
    const rows = 16;
    const cols = 32;
    const weights = Array(rows * cols).fill(0).map(() => Math.random());

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          
          if (isTraining && Math.random() < 0.1) {
            weights[idx] = Math.min(1, Math.max(0, weights[idx] + (Math.random() - 0.5) * 0.2));
          }

          const w = weights[idx];
          // map to a color scale: dark blue -> cyan -> white
          const hue = 175;
          const sat = 80;
          const lum = w * 60; // 0 to 60%
          
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
          ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
        }
      }

      if (isTraining) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        // Just draw once if not training, or slow update
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(draw);
        }, 500);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTraining]);

  return <canvas ref={canvasRef} className="w-full h-full bg-black/40" />;
}
