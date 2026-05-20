import { useEffect, useRef, useState } from "react";
import { TemporalThreat } from "@workspace/api-client-react";

interface Props {
  threats: TemporalThreat[];
  onSelectThreat: (threat: TemporalThreat) => void;
  selectedId?: number;
}

export function TemporalAxis({ threats, onSelectThreat, selectedId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panX, setPanX] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  
  // Log scale min/max in seconds
  const MIN_S = 30;
  const MAX_S = 30 * 365 * 24 * 60 * 60; // 30 years

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

    const getXForSeconds = (seconds: number) => {
      const logMin = Math.log(MIN_S);
      const logMax = Math.log(MAX_S);
      const logSec = Math.log(Math.max(MIN_S, Math.min(MAX_S, seconds)));
      const pct = (logSec - logMin) / (logMax - logMin);
      // applying pan
      return (pct * canvas.width * 2) + panX;
    };

    const draw = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const midY = canvas.height / 2;
      
      // Draw axis
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(canvas.width, midY);
      ctx.strokeStyle = "rgba(175, 204, 204, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw markers
      const markers = [
        { s: 30, label: "30s" },
        { s: 5*60, label: "5m" },
        { s: 60*60, label: "1h" },
        { s: 24*60*60, label: "24h" },
        { s: 7*24*60*60, label: "1w" },
        { s: 30*24*60*60, label: "1m" },
        { s: 180*24*60*60, label: "6m" },
        { s: 365*24*60*60, label: "1y" },
        { s: 5*365*24*60*60, label: "5y" },
        { s: 10*365*24*60*60, label: "10y" },
        { s: 30*365*24*60*60, label: "30y" }
      ];

      ctx.fillStyle = "rgba(170, 204, 204, 0.5)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      
      markers.forEach(m => {
        const x = getXForSeconds(m.s);
        if (x > -50 && x < canvas.width + 50) {
          ctx.beginPath();
          ctx.moveTo(x, midY - 5);
          ctx.lineTo(x, midY + 5);
          ctx.stroke();
          ctx.fillText(m.label, x, midY + 20);
        }
      });

      // Draw threats
      threats.forEach((threat, i) => {
        const x = getXForSeconds(threat.horizonSeconds);
        if (x < -50 || x > canvas.width + 50) return;
        
        const isSelected = threat.id === selectedId;
        const severityColors = {
          critical: "0, 80%, 55%",
          high: "30, 90%, 55%",
          medium: "50, 90%, 50%",
          low: "120, 80%, 50%",
          informational: "175, 80%, 50%"
        };
        const color = severityColors[threat.severity] || severityColors.informational;
        
        const yOffset = ((i % 3) - 1) * 30; // Stagger vertically
        const y = midY - 30 + yOffset;
        
        // Node
        ctx.beginPath();
        const baseRadius = 5 + threat.probability * 15;
        const radius = isSelected ? baseRadius + Math.sin(time * 5) * 2 : baseRadius;
        
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${color}, ${isSelected ? 0.8 : 0.4})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${color}, 1)`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
        
        // Connect to axis
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, midY);
        ctx.strokeStyle = `hsla(${color}, 0.2)`;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Interaction handlers
    const getThreatAtPos = (x: number, y: number) => {
      const midY = canvas.height / 2;
      return threats.find((t, i) => {
        const tx = getXForSeconds(t.horizonSeconds);
        const yOffset = ((i % 3) - 1) * 30;
        const ty = midY - 30 + yOffset;
        const radius = 5 + t.probability * 15;
        
        const dist = Math.hypot(x - tx, y - ty);
        return dist <= radius + 5;
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastX.current;
        setPanX(prev => Math.min(0, Math.max(-canvas.width, prev + dx)));
        lastX.current = e.clientX;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (isDragging.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const t = getThreatAtPos(x, y);
      if (t) onSelectThreat(t);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [threats, panX, selectedId]);

  return <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-black/40" />;
}
