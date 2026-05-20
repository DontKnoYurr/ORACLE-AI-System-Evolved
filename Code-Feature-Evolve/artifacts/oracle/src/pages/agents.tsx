import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListAgentSessions, 
  useRunAgentCouncil, 
  useRunSelfReflection,
  useRecordInteraction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Brain, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Agents() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const { data: sessions } = useListAgentSessions();
  const runCouncil = useRunAgentCouncil();
  const runReflection = useRunSelfReflection();
  
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [reflectionData, setReflectionData] = useState<any>(null);

  const handleConvene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    runCouncil.mutate({
      data: { topic, context }
    }, {
      onSuccess: () => {
        setTopic("");
        setContext("");
        queryClient.invalidateQueries({ queryKey: ["/api/agents/sessions"] });
        recordInteraction.mutate({ data: { type: "query", target: "agent_council" } });
      }
    });
  };

  const handleReflect = () => {
    runReflection.mutate(undefined, {
      onSuccess: (data) => {
        setReflectionData(data);
      }
    });
  };

  const getStanceColor = (stance: string) => {
    if (stance.includes("STRONGLY_AGREES")) return "text-primary border-primary bg-primary/10";
    if (stance.includes("AGREES")) return "text-cyan-400 border-cyan-400/50 bg-cyan-400/10";
    if (stance.includes("DISSENT")) return "text-destructive border-destructive bg-destructive/10";
    if (stance.includes("CAUTIOUS")) return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-muted-foreground border-border bg-card";
  };

  const activeSession = sessions?.[0]; // Assuming newest is first

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0 bg-sidebar">
        <div className="p-6 border-b border-border space-y-6">
          <h2 className="font-bold flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            CONVENE_COUNCIL
          </h2>
          <form onSubmit={handleConvene} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">DELIBERATION_TOPIC</label>
              <Input 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                className="bg-background border-border" 
                placeholder="Subject for debate..."
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">ADDITIONAL_CONTEXT</label>
              <Textarea 
                value={context} 
                onChange={e => setContext(e.target.value)} 
                className="bg-background border-border resize-none" 
                placeholder="Optional background data..."
                rows={4}
              />
            </div>
            <Button 
              type="submit" 
              disabled={runCouncil.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              {runCouncil.isPending ? "DELIBERATING..." : "INITIATE PROTOCOL"}
            </Button>
          </form>
        </div>

        <div className="p-6 border-b border-border bg-card/30">
          <Button 
            onClick={handleReflect} 
            disabled={runReflection.isPending}
            variant="outline"
            className="w-full border-primary/50 text-primary hover:bg-primary/20 rounded-none flex gap-2"
          >
            <Brain className="h-4 w-4" />
            {runReflection.isPending ? "REFLECTING..." : "RUN SELF-REFLECTION"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground mb-4">COUNCIL_ARCHIVE</h3>
          {sessions?.slice(1).map(s => (
            <div key={s.id} className="p-3 border border-border bg-background text-sm">
              <div className="font-bold truncate text-primary">{s.topic}</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground data-val">{s.consensus}</span>
                <span className="text-xs data-val">{s.consensusScore ? (s.consensusScore * 100).toFixed(0) + '%' : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
        <AnimatePresence mode="wait">
          {runCouncil.isPending ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <Activity className="h-16 w-16 text-primary animate-pulse mb-4" />
              <h2 className="text-xl font-bold text-primary tracking-[0.2em] animate-pulse">AGENTS DELIBERATING</h2>
              <div className="text-muted-foreground text-sm mt-2">SYNTHESIZING PERSPECTIVES...</div>
            </motion.div>
          ) : reflectionData ? (
            <motion.div 
              key="reflection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="border border-primary bg-primary/5 p-6">
                <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                  <Brain className="h-6 w-6" /> SYSTEM_REFLECTION_REPORT
                </h2>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-background border border-border">
                    <div className="text-xs text-muted-foreground mb-1">CALIBRATION_SCORE</div>
                    <div className="text-3xl font-bold text-primary data-val">
                      {(reflectionData.calibration * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 bg-background border border-border">
                    <div className="text-xs text-muted-foreground mb-1">TIMESTAMP</div>
                    <div className="text-sm data-val">{new Date(reflectionData.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-destructive mb-2">IDENTIFIED_BLINDSPOTS</h3>
                    <ul className="space-y-2">
                      {reflectionData.blindspots.map((b: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm border-l-2 border-destructive pl-3 py-1 bg-destructive/5">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary mb-2">RECOMMENDATIONS</h3>
                    <ul className="space-y-2">
                      {reflectionData.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm border-l-2 border-primary pl-3 py-1 bg-primary/5">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-background border border-border mt-4">
                    <h3 className="text-sm font-bold text-muted-foreground mb-2">OVERALL_ASSESSMENT</h3>
                    <p className="text-sm">{reflectionData.overallAssessment}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setReflectionData(null)}
                  variant="outline" 
                  className="mt-8 border-primary/50 text-primary w-full"
                >
                  DISMISS REPORT
                </Button>
              </div>
            </motion.div>
          ) : activeSession ? (
            <motion.div 
              key="session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="border border-border bg-card/30 p-6">
                <div className="text-xs text-muted-foreground mb-2">ACTIVE_RESOLUTION</div>
                <h2 className="text-2xl font-bold text-foreground mb-6">{activeSession.topic}</h2>
                
                <div className="flex items-center gap-6 p-4 bg-background border border-border">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">CONSENSUS</div>
                    <div className="text-lg font-bold text-primary">{activeSession.consensus}</div>
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="text-xs text-muted-foreground mb-1">CONFIDENCE</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary h-2 relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary" 
                          style={{ width: `${(activeSession.consensusScore || 0) * 100}%` }} 
                        />
                      </div>
                      <span className="text-sm data-val font-bold">
                        {((activeSession.consensusScore || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSession.agents.map((agent, i) => {
                  const style = getStanceColor(agent.stance);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className={`p-5 border ${style}`}
                    >
                      <div className="flex justify-between items-start mb-4 border-b border-inherit pb-4">
                        <div>
                          <div className="font-bold text-lg">{agent.name}</div>
                          <div className="text-xs opacity-70">{agent.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold mb-1">{agent.stance}</div>
                          <div className="text-xs opacity-70 data-val">CONF: {(agent.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className="text-sm leading-relaxed opacity-90">
                        {agent.reasoning}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              AWAITING COUNCIL INITIATION
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
