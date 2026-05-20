import { useEffect, useRef } from "react";
import { QuantumNode, QuantumFieldFieldLinesItem } from "@workspace/api-client-react";
import { useCollapseWaveFunction, useRecordInteraction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Props {
  nodes: QuantumNode[];
  fieldLines: QuantumFieldFieldLinesItem[];
}

export function QuantumFieldCanvas({ nodes, fieldLines }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const collapseMutation = useCollapseWaveFunction();
  const recordInteraction = useRecordInteraction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

    const draw = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw field lines
      fieldLines.forEach(line => {
        ctx.beginPath();
        const startX = line.startX * canvas.width;
        const startY = line.startY * canvas.height;
        const endX = line.endX * canvas.width;
        const endY = line.endY * canvas.height;
        
        ctx.moveTo(startX, startY);
        
        // Arc
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const cpX = midX + Math.sin(time) * 50;
        const cpY = midY + Math.cos(time) * 50;
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        const isNorth = line.polarity === "north";
        ctx.strokeStyle = isNorth ? `hsla(175, 80%, 50%, ${line.strength * 0.5})` : `hsla(280, 80%, 60%, ${line.strength * 0.5})`;
        ctx.lineWidth = line.strength * 2;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const x = node.x * canvas.width;
        const y = node.y * canvas.height;
        const pulse = Math.sin(time * 2 + i) * 0.5 + 0.5;
        const radius = 5 + (node.probability * 15) * pulse;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        const isAttractor = node.type === "attractor";
        const color = isAttractor ? "175, 80%, 50%" : "0, 80%, 55%";
        
        ctx.fillStyle = `hsla(${color}, ${0.5 + node.probability * 0.5})`;
        ctx.fill();
        
        // Halo
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${color}, ${0.2 * pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Label
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "10px monospace";
        ctx.fillText(node.label, x + 15, y + 4);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleClick = (e: MouseEvent) => {
      if (collapseMutation.isPending) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvas.width;
      const y = (e.clientY - rect.top) / canvas.height;
      
      recordInteraction.mutate({
        data: {
          type: "quantum_collapse",
          target: "field_canvas",
          value: x
        }
      });
      
      collapseMutation.mutate({
        data: { x, y, observerIntent: "observe" }
      }, {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ["/api/quantum/field"] });
          queryClient.invalidateQueries({ queryKey: ["/api/quantum/nodes"] });
          queryClient.invalidateQueries({ queryKey: ["/api/quantum/superposition"] });
          toast({
            title: "WAVEFUNCTION COLLAPSED",
            description: result.implication,
          });
        }
      });
    };
    
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, fieldLines, collapseMutation.isPending]);

  return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair bg-black/40" />;
}
