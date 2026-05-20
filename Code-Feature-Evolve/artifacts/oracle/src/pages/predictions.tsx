import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPredictions, 
  useGeneratePredictions, 
  useExpandPrediction,
  useRecordInteraction,
  Prediction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Predictions() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const [horizon, setHorizon] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data: predictions, isLoading } = useListPredictions(
    horizon !== "all" ? { horizon } : {}
  );
  
  const generateMut = useGeneratePredictions();
  const expandMut = useExpandPrediction();

  const handleGenerate = () => {
    generateMut.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      }
    });
  };

  const handleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(id);
    recordInteraction.mutate({ data: { type: "expand", target: "prediction" } });
    
    // Check if we need to fetch expansion data
    // The API might return expanded data directly or we might need to store it
    // For simplicity, we'll just fire the mutation and let React Query cache handle it if needed
    expandMut.mutate({ id });
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Eye className="h-8 w-8" />
            PREDICTIVE_MODELS
          </h1>
          <p className="text-muted-foreground mt-2">AI-generated probability vectors based on current world state</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={horizon} onValueChange={setHorizon}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="HORIZON" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL HORIZONS</SelectItem>
              <SelectItem value="short">SHORT_TERM</SelectItem>
              <SelectItem value="medium">MEDIUM_TERM</SelectItem>
              <SelectItem value="long">LONG_TERM</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerate}
            disabled={generateMut.isPending}
            className="bg-primary text-primary-foreground rounded-none"
          >
            <Zap className="h-4 w-4 mr-2" />
            {generateMut.isPending ? "GENERATING..." : "RUN PREDICTIONS"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-10">
        {isLoading ? (
          <div className="text-primary animate-pulse">LOADING PREDICTION VECTORS...</div>
        ) : predictions?.length === 0 ? (
          <div className="text-muted-foreground border border-border border-dashed p-8 text-center">
            NO PREDICTIONS FOUND IN SPECIFIED HORIZON
          </div>
        ) : (
          predictions?.map((pred, i) => (
            <PredictionCard 
              key={pred.id} 
              prediction={pred} 
              index={i}
              isExpanded={expandedId === pred.id}
              onToggle={() => handleExpand(pred.id)}
              expansionData={expandMut.isSuccess && expandMut.variables?.id === pred.id ? expandMut.data : undefined}
              isExpanding={expandMut.isPending && expandMut.variables?.id === pred.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PredictionCard({ 
  prediction: p, 
  index, 
  isExpanded, 
  onToggle,
  expansionData,
  isExpanding
}: { 
  prediction: Prediction; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  expansionData?: any;
  isExpanding: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border transition-colors ${isExpanded ? 'border-primary bg-card/50' : 'border-border bg-card/20 hover:border-primary/50'}`}
    >
      <div 
        className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs px-2 py-0.5 border border-primary/30 text-primary">{p.domain}</span>
            <span className="text-xs text-muted-foreground data-val">{p.horizon}</span>
            <span className={`text-[10px] px-1.5 py-0.5 ${
              p.impact === 'CRITICAL' ? 'bg-destructive/20 text-destructive border border-destructive/50' : 
              p.impact === 'HIGH' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' : 
              'bg-muted text-muted-foreground border border-border'
            }`}>
              IMPACT: {p.impact}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground truncate">{p.title}</h3>
        </div>
        
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">PROBABILITY</span>
            <span className="text-primary data-val font-bold">{(p.probability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-background border border-border overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${p.probability * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true }}
              className="absolute inset-y-0 left-0 bg-primary"
            />
          </div>
        </div>
        
        <div className="shrink-0 pl-2 hidden md:block">
          {isExpanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-5 bg-background/50 space-y-6">
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </div>

              {isExpanding ? (
                <div className="py-8 text-center text-primary animate-pulse border border-primary/20 bg-primary/5">
                  EXECUTING DEEP ANALYSIS...
                </div>
              ) : expansionData ? (
                <div className="space-y-6 border-l-2 border-primary pl-4">
                  <div>
                    <h4 className="text-xs font-bold text-primary mb-2">FULL_ANALYSIS</h4>
                    <p className="text-sm leading-relaxed">{expansionData.fullAnalysis}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-primary mb-3">SCENARIOS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {expansionData.scenarios.map((s: any, idx: number) => (
                        <div key={idx} className="border border-border p-3 bg-card">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-sm text-foreground">{s.name}</span>
                            <span className="text-xs text-primary data-val">{(s.probability * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-primary mb-2">KEY_FACTORS</h4>
                    <div className="flex flex-wrap gap-2">
                      {expansionData.keyFactors.map((f: string, idx: number) => (
                        <span key={idx} className="text-xs border border-border bg-card px-2 py-1">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={(e) => { e.stopPropagation(); expandMut.mutate({ id: p.id }); }}
                  variant="outline" 
                  className="border-primary/50 text-primary w-full"
                >
                  DEEP ANALYSIS REQUIRED
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
