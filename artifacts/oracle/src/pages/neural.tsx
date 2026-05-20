import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTrainingStatus, 
  useRunTrainingCycle, 
  useGetTrainingHistory,
  useRecordInteraction 
} from "@workspace/api-client-react";
import { CognitiveMesh } from "@/components/canvas/CognitiveMesh";
import { NeuralWeightMatrix } from "@/components/canvas/NeuralWeightMatrix";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Neural() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const { data: status, isLoading: loadingStatus } = useGetTrainingStatus();
  const { data: history, isLoading: loadingHistory } = useGetTrainingHistory();
  const runCycle = useRunTrainingCycle();

  const handleRunCycle = () => {
    recordInteraction.mutate({
      data: { type: "click", target: "training_cycle" }
    });
    runCycle.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/training/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/training/history"] });
      }
    });
  };

  const isTraining = status?.isTraining || runCycle.isPending;

  // Fake chart data from history or generated
  const chartData = history?.length 
    ? history.slice().reverse().map((h, i) => ({ val: Math.max(0, 0.8 - h.lossImprovement * i) }))
    : Array.from({length: 20}).map((_, i) => ({ val: 0.9 - Math.log(i + 1) * 0.1 }));

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="h-[30vh] md:h-[40vh] shrink-0 grid grid-cols-2 border-b border-border bg-black/90">
        <div className="relative border-r border-border">
          <CognitiveMesh isTraining={isTraining} />
          <div className="absolute top-4 left-4 text-xs bg-black/60 px-2 py-1 border border-primary/20 pointer-events-none text-primary">
            COGNITIVE_MESH_TOPOLOGY
          </div>
        </div>
        <div className="relative">
          <NeuralWeightMatrix isTraining={isTraining} />
          <div className="absolute top-4 left-4 text-xs bg-black/60 px-2 py-1 border border-primary/20 pointer-events-none text-primary">
            WEIGHT_MATRIX_HEATMAP
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 border border-border bg-card/50 p-6 space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                TRAINING_STATUS
              </h2>
              <Button 
                onClick={handleRunCycle} 
                disabled={isTraining}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-8 text-xs font-bold"
              >
                {isTraining ? "COMPUTING..." : <><Play className="h-3 w-3 mr-2" /> FORCE CYCLE</>}
              </Button>
            </div>

            {status && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">STATE</div>
                  <div className={`text-xl font-bold ${isTraining ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}>
                    {isTraining ? 'ACTIVE' : 'IDLE'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">EPOCH</div>
                  <div className="text-xl font-bold data-val">{status.currentEpoch} / {status.totalEpochs}</div>
                  <div className="w-full bg-secondary h-1 mt-2">
                    <div className="h-full bg-primary" style={{width: `${(status.currentEpoch / status.totalEpochs) * 100}%`}} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">LOSS</div>
                  <div className="text-xl font-bold data-val text-green-400">{status.loss.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ACCURACY</div>
                  <div className="text-xl font-bold data-val">{(status.accuracy * 100).toFixed(2)}%</div>
                </div>
                
                <div className="col-span-2 md:col-span-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground">LEARNING_RATE</div>
                    <div className="text-sm data-val">{status.learningRate.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">MOMENTUM</div>
                    <div className="text-sm data-val">{status.momentum.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">CALIBRATION</div>
                    <div className="text-sm data-val">{(status.systemCalibration * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-32 mt-4 pt-4 border-t border-border/50 relative">
              <div className="absolute top-4 left-0 text-xs text-muted-foreground z-10">LOSS_CURVE</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Line type="monotone" dataKey="val" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-border bg-card/50 p-6 h-full">
              <h2 className="text-xl font-bold mb-6">CYCLE_HISTORY</h2>
              <div className="space-y-3">
                {history?.slice(0, 8).map(h => (
                  <div key={h.cycleId} className="p-3 border border-border bg-background/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground data-val">{h.cycleId.substring(0,8)}</span>
                      <span className={`text-[10px] px-1 border ${h.status === 'completed' ? 'border-primary text-primary' : 'border-destructive text-destructive'}`}>
                        {h.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EPOCHS: <span className="data-val">{h.epochsRun}</span></span>
                      <span className="text-green-400">-{h.lossImprovement.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
