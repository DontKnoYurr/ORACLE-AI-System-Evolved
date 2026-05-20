import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListAnomalies, 
  useExplainAnomaly,
  useRecordInteraction,
  Anomaly
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search, ServerCrash, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Anomalies() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data: anomalies, isLoading } = useListAnomalies(
    severityFilter !== "all" ? { severity: severityFilter } : {}
  );
  
  const explainMut = useExplainAnomaly();
  const recordInteraction = useRecordInteraction();

  const handleExplain = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(id);
    recordInteraction.mutate({ data: { type: "anomaly_flag", target: id.toString() } });
    explainMut.mutate({ id });
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return { border: 'border-destructive', text: 'text-destructive', bg: 'bg-destructive/10', pulse: true, icon: ServerCrash };
      case 'high': return { border: 'border-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10', pulse: false, icon: ShieldAlert };
      case 'medium': return { border: 'border-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10', pulse: false, icon: AlertTriangle };
      case 'low': return { border: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500/10', pulse: false, icon: Cpu };
      default: return { border: 'border-primary', text: 'text-primary', bg: 'bg-primary/10', pulse: false, icon: AlertTriangle };
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-destructive flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            SYSTEM_ANOMALIES
          </h1>
          <p className="text-muted-foreground mt-2">Deviations from predicted world-state baselines</p>
        </div>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[200px] bg-background border-border">
            <SelectValue placeholder="FILTER SEVERITY" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL SEVERITIES</SelectItem>
            <SelectItem value="critical">CRITICAL</SelectItem>
            <SelectItem value="high">HIGH</SelectItem>
            <SelectItem value="medium">MEDIUM</SelectItem>
            <SelectItem value="low">LOW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-4">
        {isLoading ? (
          <div className="text-destructive animate-pulse text-center p-8 border border-destructive/30">SCANNING FOR DEVIATIONS...</div>
        ) : anomalies?.length === 0 ? (
          <div className="text-green-500 border border-green-500/30 bg-green-500/5 p-8 text-center">
            SYSTEM NOMINAL. NO ANOMALIES DETECTED IN SELECTED RANGE.
          </div>
        ) : (
          anomalies?.map((anomaly, i) => {
            const isExpanded = expandedId === anomaly.id;
            const explanation = explainMut.isSuccess && explainMut.variables?.id === anomaly.id ? explainMut.data : null;
            const isExplaining = explainMut.isPending && explainMut.variables?.id === anomaly.id;
            const styles = getSeverityStyles(anomaly.severity);
            const Icon = styles.icon;
            
            return (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={anomaly.id} 
                className={`border ${styles.border} bg-background overflow-hidden relative`}
              >
                {styles.pulse && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-destructive animate-pulse" />
                )}
                
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center relative z-10">
                  <div className={`p-3 border ${styles.border} ${styles.bg} shrink-0`}>
                    <Icon className={`h-6 w-6 ${styles.text} ${styles.pulse ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs px-2 py-0.5 border ${styles.border} ${styles.text}`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-xs text-muted-foreground border border-border px-2 py-0.5">{anomaly.category}</span>
                      <span className="text-xs text-muted-foreground data-val ml-auto">{new Date(anomaly.detectedAt).toISOString().replace('T', ' ').substring(0, 19)}</span>
                    </div>
                    <h3 className="text-lg font-bold truncate">{anomaly.title}</h3>
                  </div>
                  
                  <Button 
                    onClick={() => handleExplain(anomaly.id)}
                    variant="outline"
                    className={`shrink-0 ${isExpanded ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/50 text-primary hover:bg-primary/20'} rounded-none`}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isExpanded ? 'CLOSE' : 'EXPLAIN'}
                  </Button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-card/30"
                    >
                      <div className="p-6 space-y-6">
                        <p className="text-sm text-foreground">{anomaly.description}</p>
                        
                        {isExplaining ? (
                          <div className="p-4 border border-primary/30 text-primary text-center animate-pulse bg-primary/5">
                            DECRYPTING ROOT CAUSES...
                          </div>
                        ) : explanation ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                            <div>
                              <h4 className="text-xs font-bold text-primary mb-3">ROOT_CAUSES</h4>
                              <ul className="space-y-2">
                                {explanation.rootCauses.map((cause: string, idx: number) => (
                                  <li key={idx} className="text-sm border-l-2 border-destructive pl-3 text-muted-foreground">
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-primary mb-3">IMPACT_ASSESSMENT</h4>
                                <div className="text-sm p-3 border border-border bg-background">{explanation.impact}</div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-bold text-primary mb-3">RECOMMENDATIONS</h4>
                                <ul className="space-y-2">
                                  {explanation.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="text-sm border-l-2 border-primary pl-3 text-muted-foreground">
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
