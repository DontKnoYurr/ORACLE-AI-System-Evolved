import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListTemporalThreats, 
  useGetImmediateThreats, 
  useRunTemporalScan,
  useRecordInteraction,
  TemporalThreat
} from "@workspace/api-client-react";
import { TemporalAxis } from "@/components/canvas/TemporalAxis";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Play, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Temporal() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  const [selectedThreatId, setSelectedThreatId] = useState<number | undefined>();
  
  const { data: threats, isLoading: loadingThreats } = useListTemporalThreats();
  const { data: immediate, isLoading: loadingImmediate } = useGetImmediateThreats();
  const runScan = useRunTemporalScan();

  const handleScan = () => {
    runScan.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/temporal/threats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/temporal/immediate"] });
      }
    });
  };

  const handleSelect = (t: TemporalThreat) => {
    setSelectedThreatId(t.id);
    recordInteraction.mutate({
      data: { type: "temporal_observe", target: t.id.toString() }
    });
  };

  const selectedThreat = threats?.find(t => t.id === selectedThreatId);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="h-[35vh] shrink-0 relative border-b border-border bg-black/90 flex flex-col">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
          <div className="text-xs bg-black/60 px-2 py-1 border border-primary/20 text-orange-400 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            TEMPORAL_AXIS [DRAG TO PAN]
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Button 
            onClick={handleScan} 
            disabled={runScan.isPending}
            variant="outline" 
            className="border-primary/50 text-primary hover:bg-primary/20 h-8 text-xs rounded-none"
          >
            {runScan.isPending ? "SCANNING..." : <><Play className="h-3 w-3 mr-2" /> RUN TEMPORAL SCAN</>}
          </Button>
        </div>
        
        <div className="flex-1 relative">
          {threats && (
            <TemporalAxis 
              threats={threats} 
              onSelectThreat={handleSelect}
              selectedId={selectedThreatId}
            />
          )}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-8">
        {immediate && immediate.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              IMMINENT_THREATS (≤ 1 HOUR)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {immediate.map(t => (
                <div key={t.id} className="p-4 border border-destructive bg-destructive/10 animate-pulse cursor-pointer" onClick={() => handleSelect(t)}>
                  <div className="font-bold text-destructive truncate">{t.title}</div>
                  <div className="text-sm mt-1 text-destructive/80 data-val">T-MINUS: {t.horizonLabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">EVENT HORIZON</h2>
            <div className="space-y-2">
              {threats?.sort((a,b) => a.horizonSeconds - b.horizonSeconds).map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleSelect(t)}
                  className={`p-3 border flex items-center gap-4 cursor-pointer transition-colors ${
                    selectedThreatId === t.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-card/30'
                  }`}
                >
                  <div className="w-16 shrink-0 text-xs font-bold data-val text-muted-foreground">{t.horizonLabel}</div>
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className={`text-xs px-1.5 py-0.5 border ${
                      t.severity === 'critical' ? 'border-destructive text-destructive' :
                      t.severity === 'high' ? 'border-orange-500 text-orange-500' :
                      t.severity === 'medium' ? 'border-yellow-500 text-yellow-500' :
                      'border-green-500 text-green-500'
                    }`}>
                      {t.severity.substring(0,4)}
                    </span>
                    <span className="font-bold truncate">{t.title}</span>
                  </div>
                  <div className="w-24 shrink-0 flex items-center gap-2">
                    <div className="flex-1 bg-secondary h-1">
                      <div className="h-full bg-primary" style={{width:`${t.probability*100}%`}}/>
                    </div>
                    <span className="text-xs data-val">{(t.probability*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold">DETAIL_VIEW</h2>
            {selectedThreat ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={selectedThreat.id}
                className="border border-border bg-card/50 p-6 space-y-6"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight">{selectedThreat.title}</h3>
                    <span className="text-xs border border-primary/30 px-2 py-0.5 text-primary">{selectedThreat.domain}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedThreat.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-border/50 py-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">HORIZON</div>
                    <div className="text-xl data-val text-primary font-bold">{selectedThreat.horizonLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">VELOCITY</div>
                    <div className="flex items-center gap-2">
                      <FastForward className={`h-4 w-4 ${selectedThreat.velocity > 0.7 ? 'text-destructive' : 'text-primary'}`} />
                      <span className="text-xl data-val">{selectedThreat.velocity.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary mb-2">INDICATORS</h4>
                  <ul className="space-y-1">
                    {selectedThreat.indicators.map((ind, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground">-</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary mb-2">MITIGATIONS</h4>
                  <ul className="space-y-1">
                    {selectedThreat.mitigations.map((mit, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground">&gt;</span>
                        <span>{mit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="border border-border bg-card/20 p-6 text-center text-muted-foreground text-sm h-64 flex items-center justify-center">
                SELECT A NODE ON THE AXIS TO VIEW TEMPORAL DETAILS
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
