import { useEffect, useRef } from "react";
import { useGetDashboardSummary, useGetTrainingStatus, useGetWorldState } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, ShieldAlert, Cpu, Orbit } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: training, isLoading: loadingTraining } = useGetTrainingStatus();
  const { data: worldState, isLoading: loadingWorld } = useGetWorldState();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background lines
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
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const lines = 10;
      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        const y = (canvas.height / lines) * i;
        ctx.moveTo(0, y);
        
        for (let x = 0; x < canvas.width; x += 20) {
          const noise = Math.sin(x * 0.01 + time + i) * 20;
          ctx.lineTo(x, y + noise);
        }
        
        ctx.strokeStyle = `hsla(175, 80%, 50%, ${0.05 + Math.sin(time + i) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (loadingSummary || loadingTraining || loadingWorld) {
    return <div className="p-8 flex items-center justify-center h-full text-primary animate-pulse">INITIATING_SYSTEM...</div>;
  }

  return (
    <div className="relative min-h-full p-4 md:p-8 flex flex-col gap-6">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-[-1]"
      />
      
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl border-b border-primary/30 pb-4 inline-block pr-12">
          SYSTEM_DASHBOARD
          <span className="block text-sm font-normal text-muted-foreground mt-2 data-val">
            status: online | resonance: nominal
          </span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<AlertTriangle className="text-destructive" />}
          title="CRITICAL_ANOMALIES"
          value={summary?.criticalAnomalies || 0}
          trend="+2 last hour"
          color="destructive"
        />
        <StatCard 
          icon={<ShieldAlert className="text-chart-4" />}
          title="IMMEDIATE_THREATS"
          value={summary?.immediateThreats || 0}
          trend="tracking"
          color="chart-4"
        />
        <StatCard 
          icon={<Activity className="text-primary" />}
          title="ACTIVE_SIGNALS"
          value={summary?.activeSignals || 0}
          trend="+423 today"
          color="primary"
        />
        <StatCard 
          icon={<Orbit className="text-chart-3" />}
          title="GLOBAL_INSTABILITY"
          value={`${(summary?.globalInstability || 0).toFixed(1)}%`}
          trend="escalating"
          color="chart-3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 border border-border bg-card/50 p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="text-xl mb-6 flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            WORLD_STATE_MATRIX
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <MetricBar label="GEOPOLITICAL" value={worldState?.geopoliticalTension || 0} />
            <MetricBar label="ECONOMIC" value={worldState?.economicVolatility || 0} />
            <MetricBar label="INFO_WARFARE" value={worldState?.informationWarfare || 0} />
            <MetricBar label="CLIMATE_STRESS" value={worldState?.climateStress || 0} />
            <MetricBar label="TECH_DISRUPT" value={worldState?.techDisruption || 0} />
          </div>
          
          {worldState?.regions && (
            <div className="mt-8">
              <h3 className="text-sm text-muted-foreground mb-4">REGIONAL_INSTABILITY</h3>
              <div className="space-y-3">
                {worldState.regions.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                    <span className="w-32 truncate">{r.name}</span>
                    <span className="text-xs text-muted-foreground flex-1 text-right pr-4 truncate data-val">{r.primaryThreat}</span>
                    <span className={`w-12 text-right ${r.instability > 0.7 ? 'text-destructive' : 'text-primary'}`}>
                      {(r.instability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border border-border bg-card/50 p-6 backdrop-blur-sm flex flex-col">
          <h2 className="text-xl mb-6">NEURAL_TRAINING</h2>
          
          <div className="flex-1 space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">TRAINING_STATUS</div>
              <div className="text-lg font-bold">
                {training?.isTraining ? (
                  <span className="text-primary animate-pulse">ACTIVE_LEARNING</span>
                ) : (
                  <span className="text-muted-foreground">IDLE</span>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground mb-1">CURRENT_EPOCH</div>
              <div className="text-3xl text-primary font-bold data-val">
                {training?.currentEpoch || 0} / {training?.totalEpochs || 0}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground mb-1">SYSTEM_ACCURACY</div>
              <div className="w-full bg-secondary h-2 mt-2 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(training?.accuracy || 0) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-primary"
                />
              </div>
              <div className="text-right mt-1 text-xs data-val">
                {((training?.accuracy || 0) * 100).toFixed(2)}%
              </div>
            </div>
            
            <div className="pt-4 mt-auto">
              <div className="text-xs text-muted-foreground mb-2">RECENT_ACTIVITY</div>
              <ul className="space-y-2 text-xs">
                {summary?.recentActivity?.slice(0, 4).map((act, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span className="text-primary">&gt;</span>
                    <span className="truncate data-val">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, color }: { icon: React.ReactNode, title: string, value: string | number, trend: string, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-card/50 p-4 relative overflow-hidden group hover:border-primary/50 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div>{icon}</div>
      </div>
      <div className={`text-3xl font-bold mb-1 data-val text-${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground data-val">{trend}</div>
      <div className={`absolute bottom-0 left-0 h-1 bg-${color} transition-all duration-500 ease-out`} style={{ width: '10%' }} />
    </motion.div>
  );
}

function MetricBar({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span>{label}</span>
        <span className="data-val">{value.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-secondary h-1.5 relative overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`absolute inset-y-0 left-0 ${value > 70 ? 'bg-destructive' : value > 40 ? 'bg-chart-4' : 'bg-primary'}`}
        />
      </div>
    </div>
  );
}
