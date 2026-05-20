import { useEffect, useRef } from "react";
import { useRecordInteraction, useRecordSeismicEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  emotionalValence: number; // -1 to 1
  activeFrequencies: number[];
  pulseRate: number;
}

export function SeismicWaveform({ emotionalValence, activeFrequencies, pulseRate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordEvent = useRecordSeismicEvent();
  const recordInteraction = useRecordInteraction();
  const queryClient = useQueryClient();

  // Animation logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    // Pulses generated from clicks
    const pulses: { x: number, y: number, time: number, maxRadius: number, intensity: number }[] = [];

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    window.addEventListener("resize", resize);
    resize();

    // Determine base color from valence
    const isNegative = emotionalValence < -0.2;
    const isPositive = emotionalValence > 0.2;
    const colorHsl = isNegative ? "0, 80%, 55%" : isPositive ? "120, 80%, 50%" : "175, 80%, 50%";

    const draw = () => {
      time += 0.05 * (pulseRate / 60 || 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const midY = canvas.height / 2;
      
      // Draw waveforms
      const freqs = activeFrequencies.length ? activeFrequencies : [1, 2, 0.5];
      
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";

      freqs.forEach((freq, idx) => {
        ctx.beginPath();
        const amplitude = 50 + Math.abs(emotionalValence) * 100 + (idx * 20);
        
        for (let x = 0; x < canvas.width; x += 5) {
          const normalizedX = x / canvas.width;
          const y = midY + Math.sin(normalizedX * freq * 10 + time + idx) * amplitude * Math.sin(normalizedX * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = `hsla(${colorHsl}, ${0.3 + (idx * 0.2)})`;
        ctx.stroke();
      });

      // Draw active pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.time += 2;
        if (p.time > p.maxRadius) {
          pulses.splice(i, 1);
          continue;
        }

        const alpha = 1 - (p.time / p.maxRadius);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.time, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${colorHsl}, ${alpha})`;
        ctx.lineWidth = p.intensity * 2;
        ctx.stroke();
        
        // inner ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.time * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${colorHsl}, ${alpha * 0.5})`;
        ctx.lineWidth = p.intensity;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Click handler to create pulse
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      pulses.push({ x, y, time: 0, maxRadius: Math.max(canvas.width, canvas.height), intensity: 5 });
      
      recordInteraction.mutate({
        data: {
          type: "seismic_pulse",
          target: "canvas",
          value: 5
        }
      });
      
      recordEvent.mutate({
        data: {
          title: "Manual Canvas Pulse",
          description: "Operator induced seismic resonance",
          resonanceType: "unknown",
          epicenterRegion: `LOC_${Math.floor(x)}_${Math.floor(y)}`,
          intensity: 5
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/seismic"] });
          queryClient.invalidateQueries({ queryKey: ["/api/seismic/resonance"] });
        }
      });
    };
    
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [emotionalValence, activeFrequencies, pulseRate]);

  return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />;
}
