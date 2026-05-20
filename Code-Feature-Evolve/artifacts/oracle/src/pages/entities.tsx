import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListEntities, 
  useCreateEntity, 
  useListRelationships,
  useRecordInteraction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Link as LinkIcon, Box } from "lucide-react";
import { motion } from "framer-motion";

export default function Entities() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: entities, isLoading: loadingEnts } = useListEntities(
    typeFilter !== "all" ? { type: typeFilter } : {}
  );
  const { data: relationships } = useListRelationships();
  
  const createMut = useCreateEntity();
  
  const [name, setName] = useState("");
  const [type, setType] = useState("state");
  const [influence, setInfluence] = useState([50]);
  const [stability, setStability] = useState([50]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    createMut.mutate({
      data: {
        name,
        type,
        influence: influence[0] / 100,
        stability: stability[0] / 100
      }
    }, {
      onSuccess: () => {
        setName("");
        setInfluence([50]);
        setStability([50]);
        queryClient.invalidateQueries({ queryKey: ["/api/entities"] });
      }
    });
  };

  const handleEntityClick = (id: number) => {
    recordInteraction.mutate({ data: { type: "click", target: "entity_view" } });
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-80 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold flex items-center gap-2 text-primary mb-6">
            <Globe className="h-5 w-5" /> ADD_ENTITY
          </h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">DESIGNATION</label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background border-border rounded-none h-8" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">CLASSIFICATION</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background border-border rounded-none h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">STATE_ACTOR</SelectItem>
                  <SelectItem value="organization">ORGANIZATION</SelectItem>
                  <SelectItem value="actor">INDIVIDUAL_ACTOR</SelectItem>
                  <SelectItem value="system">INFRA_SYSTEM</SelectItem>
                  <SelectItem value="movement">SOCIAL_MOVEMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">INFLUENCE</span>
                <span className="data-val text-primary">{influence[0]}%</span>
              </div>
              <Slider value={influence} onValueChange={setInfluence} max={100} step={1} />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">STABILITY</span>
                <span className="data-val text-primary">{stability[0]}%</span>
              </div>
              <Slider value={stability} onValueChange={setStability} max={100} step={1} />
            </div>
            
            <Button 
              type="submit" 
              disabled={createMut.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" /> ADD TO GRAPH
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground mb-2">KNOWN_CONNECTIONS</h3>
          {relationships?.slice(0, 20).map(rel => (
            <div key={rel.id} className="text-xs flex items-center gap-2 border-b border-border/50 pb-2">
              <LinkIcon className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="truncate flex-1">
                <span className="text-primary">{rel.sourceId}</span>
                <span className="text-muted-foreground mx-1">→</span>
                <span className="text-primary">{rel.targetId}</span>
              </div>
              <span className="data-val text-muted-foreground">{rel.strength.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
          <h1 className="text-xl font-bold">ENTITY_GRAPH</h1>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-8 rounded-none border-border">
              <SelectValue placeholder="FILTER TYPE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL CLASSES</SelectItem>
              <SelectItem value="state">STATE_ACTORS</SelectItem>
              <SelectItem value="organization">ORGANIZATIONS</SelectItem>
              <SelectItem value="actor">INDIVIDUALS</SelectItem>
              <SelectItem value="system">SYSTEMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loadingEnts ? (
            <div className="text-primary animate-pulse">QUERYING ENTITY DATABASE...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {entities?.map((ent) => (
                <div 
                  key={ent.id} 
                  onClick={() => handleEntityClick(ent.id)}
                  className="border border-border bg-card/30 p-4 hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold truncate text-foreground text-lg">{ent.name}</h3>
                    <span className="text-[10px] border border-border px-1.5 py-0.5 text-muted-foreground shrink-0">
                      {ent.type}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">INFLUENCE</span>
                        <span className="text-primary data-val">{(ent.influence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-secondary w-full">
                        <div className="h-full bg-primary" style={{width: `${ent.influence * 100}%`}} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">STABILITY</span>
                        <span className={`data-val ${ent.stability < 0.3 ? 'text-destructive' : 'text-primary'}`}>
                          {(ent.stability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1 bg-secondary w-full">
                        <div className={`h-full ${ent.stability < 0.3 ? 'bg-destructive' : 'bg-primary/60'}`} style={{width: `${ent.stability * 100}%`}} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
