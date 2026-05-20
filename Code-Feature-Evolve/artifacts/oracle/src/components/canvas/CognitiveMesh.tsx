import { useEffect, useRef } from "react";

interface Props {
  isTraining: boolean;
}

export function CognitiveMesh({ isTraining }: Props) {
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

    // Node colors by model
    const colors = [
      "175, 80%, 50%", // seismic cyan
      "280, 80%, 60%", // quantum purple
      "30, 90%, 55%",  // temporal orange
      "0, 80%, 55%",   // anomaly red
      "120, 80%, 50%", // pattern green
    ];

    const nodes = Array.from({ length: 30 }).map((_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[i % colors.length],
      radius: Math.random() * 3 + 2
    }));

    const particles: any[] = [];

    const draw = () => {
      time += isTraining ? 0.2 : 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update nodes
      nodes.forEach(node => {
        node.x += node.vx * (isTraining ? 3 : 1);
        node.y += node.vy * (isTraining ? 3 : 1);
        
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      // Draw connections
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 150) {
            const alpha = (1 - dist / 150) * (isTraining ? 0.5 : 0.1);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(170, 204, 204, ${alpha})`;
            ctx.stroke();

            // Spawn particles along edges if training
            if (isTraining && Math.random() < 0.05) {
              particles.push({
                x: nodes[i].x, y: nodes[i].y,
                tx: nodes[j].x, ty: nodes[j].y,
                color: nodes[i].color,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03
              });
            }
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        const pulse = isTraining ? Math.sin(time + node.x) * 2 : 0;
        ctx.arc(node.x, node.y, Math.max(1, node.radius + pulse), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.color}, ${isTraining ? 0.8 : 0.4})`;
        ctx.fill();
      });

      // Draw particles
      if (isTraining) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.progress += p.speed;
          if (p.progress >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const px = p.x + (p.tx - p.x) * p.progress;
          const py = p.y + (p.ty - p.y) * p.progress;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.color}, 1)`;
          ctx.fill();
        }
      } else {
        particles.length = 0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTraining]);

  return <canvas ref={canvasRef} className="w-full h-full bg-black/40" />;
}
