import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSimulations, 
  useCreateSimulation, 
  useRunSimulation,
  useRecordInteraction,
  Simulation
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Box, Play, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Simulations() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const { data: simulations, isLoading } = useListSimulations();
  const createMut = useCreateSimulation();
  const runMut = useRunSimulation();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [paramsStr, setParamsStr] = useState("{\n  \"iterations\": 1000,\n  \"timeHorizon\": \"1y\"\n}");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    
    let parameters = undefined;
    try {
      if (paramsStr.trim()) {
        parameters = JSON.parse(paramsStr);
      }
    } catch(e) {
      alert("Invalid JSON in parameters");
      return;
    }

    createMut.mutate({
      data: { name, description, parameters }
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      }
    });
  };

  const handleRun = (id: number) => {
    recordInteraction.mutate({ data: { type: "click", target: "simulation_run" } });
    runMut.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      }
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-80 lg:w-96 border-r border-border bg-sidebar flex flex-col shrink-0 p-6 overflow-y-auto">
        <h2 className="font-bold flex items-center gap-2 text-primary mb-6">
          <Box className="h-5 w-5" /> CREATE_SIMULATION
        </h2>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">SCENARIO_NAME</label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background border-border rounded-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">HYPOTHESIS</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              className="bg-background min-h-[80px] border-border rounded-none resize-none" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">PARAMETERS (JSON)</label>
            <Textarea 
              value={paramsStr} 
              onChange={e => setParamsStr(e.target.value)} 
              className="bg-background min-h-[120px] font-mono text-[10px] border-border rounded-none resize-none text-muted-foreground" 
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={createMut.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none mt-4"
          >
            {createMut.isPending ? "INITIALIZING..." : "INITIATE SCENARIO"}
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
        <h1 className="text-2xl font-bold mb-8">SIMULATION_ENVIRONMENT</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="text-primary animate-pulse col-span-full">LOADING SIMULATIONS...</div>
          ) : simulations?.map((sim) => (
            <div key={sim.id} className="border border-border bg-card/20 flex flex-col">
              <div className="p-5 border-b border-border flex justify-between items-start bg-card/40">
                <div>
                  <h3 className="font-bold text-lg">{sim.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1">{sim.description}</div>
                </div>
                <div className={`text-[10px] px-2 py-1 border flex items-center gap-1 ${
                  sim.status === 'completed' ? 'border-primary text-primary bg-primary/10' :
                  sim.status === 'running' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10 animate-pulse' :
                  'border-muted text-muted-foreground'
                }`}>
                  {sim.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : 
                   sim.status === 'running' ? <Activity className="h-3 w-3" /> : 
                   <Clock className="h-3 w-3" />}
                  {sim.status.toUpperCase()}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                {sim.status === 'pending' ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-8">
                    <div className="text-sm text-muted-foreground mb-4">SCENARIO CONFIGURED. READY FOR COMPUTE.</div>
                    <Button 
                      onClick={() => handleRun(sim.id)}
                      disabled={runMut.isPending && runMut.variables?.id === sim.id}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/20 rounded-none w-48"
                    >
                      {runMut.isPending && runMut.variables?.id === sim.id ? "COMPUTING..." : <><Play className="h-4 w-4 mr-2" /> RUN</>}
                    </Button>
                  </div>
                ) : runMut.isPending && runMut.variables?.id === sim.id ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-12 text-primary">
                    <Box className="h-8 w-8 animate-spin mb-4" />
                    <div className="animate-pulse tracking-widest text-sm">COMPUTING PROBABILITY SPACE...</div>
                  </div>
                ) : sim.outcomes ? (
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-bold text-primary mb-2 flex justify-between">
                        <span>PRIMARY_OUTCOME</span>
                        {sim.outcomes.probability && <span className="data-val">{(sim.outcomes.probability * 100).toFixed(1)}% LIKELY</span>}
                      </div>
                      <div className="p-3 border border-primary/30 bg-primary/5 text-sm text-foreground">
                        {sim.outcomes.primary}
                      </div>
                    </div>
                    
                    {sim.outcomes.alternatives && sim.outcomes.alternatives.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-muted-foreground mb-2">LATERAL_BRANCHES</div>
                        <div className="space-y-2">
                          {sim.outcomes.alternatives.map((alt, i) => (
                            <div key={i} className="flex gap-3 text-sm items-start">
                              <span className="text-muted-foreground mt-0.5">├─</span>
                              <span className="text-muted-foreground flex-1">{alt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Just importing Activity here since it was missing
import { Activity } from "lucide-react";
