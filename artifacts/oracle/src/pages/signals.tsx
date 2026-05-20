import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSignals, 
  useIngestSignal, 
  useExpandSignal,
  useRecordInteraction,
  Signal
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Signals() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();
  
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data: signals, isLoading } = useListSignals({
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
    ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
  });
  
  const ingestMut = useIngestSignal();
  const expandMut = useExpandSignal();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("geopolitical");
  const [priority, setPriority] = useState("medium");
  const [source, setSource] = useState("");

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    ingestMut.mutate({
      data: { title, content, category, priority, source }
    }, {
      onSuccess: () => {
        setTitle("");
        setContent("");
        setSource("");
        queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      }
    });
  };

  const handleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    recordInteraction.mutate({ data: { type: "signal_rate", target: id.toString() } });
    expandMut.mutate({ id });
  };

  const getPriorityColor = (prio: string) => {
    switch(prio.toLowerCase()) {
      case 'critical': return 'text-destructive border-destructive';
      case 'high': return 'text-orange-500 border-orange-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      default: return 'text-primary border-primary';
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-80 lg:w-96 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold flex items-center gap-2 text-primary mb-6">
            <Wifi className="h-5 w-5" /> INGEST_SIGNAL
          </h2>
          <form onSubmit={handleIngest} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground">TITLE</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-background h-8 rounded-none border-border" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">CATEGORY</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background h-8 rounded-none border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geopolitical">GEOPOLITICAL</SelectItem>
                    <SelectItem value="economic">ECONOMIC</SelectItem>
                    <SelectItem value="cyber">CYBER</SelectItem>
                    <SelectItem value="physical">PHYSICAL</SelectItem>
                    <SelectItem value="biological">BIOLOGICAL</SelectItem>
                    <SelectItem value="information">INFORMATION</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">PRIORITY</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-background h-8 rounded-none border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">LOW</SelectItem>
                    <SelectItem value="medium">MEDIUM</SelectItem>
                    <SelectItem value="high">HIGH</SelectItem>
                    <SelectItem value="critical">CRITICAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground">SOURCE (OPTIONAL)</label>
              <Input value={source} onChange={e => setSource(e.target.value)} className="bg-background h-8 rounded-none border-border data-val" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground">RAW_CONTENT</label>
              <Textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                required 
                className="bg-background min-h-[100px] resize-none rounded-none border-border font-mono text-sm" 
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={ingestMut.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              {ingestMut.isPending ? "INGESTING..." : <><Plus className="h-4 w-4 mr-2" /> SUBMIT TO DB</>}
            </Button>
          </form>
        </div>

        <div className="p-4 bg-card flex flex-col gap-2">
          <div className="text-[10px] text-muted-foreground mb-1">FEED_FILTERS</div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 rounded-none bg-background border-border text-xs">
              <SelectValue placeholder="CATEGORY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL CATEGORIES</SelectItem>
              <SelectItem value="geopolitical">GEOPOLITICAL</SelectItem>
              <SelectItem value="economic">ECONOMIC</SelectItem>
              <SelectItem value="cyber">CYBER</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 rounded-none bg-background border-border text-xs">
              <SelectValue placeholder="PRIORITY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL PRIORITIES</SelectItem>
              <SelectItem value="high">HIGH+</SelectItem>
              <SelectItem value="critical">CRITICAL ONLY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
        <h1 className="text-2xl font-bold mb-6">SIGNAL_STREAM</h1>
        
        <div className="space-y-4 max-w-4xl">
          {isLoading ? (
            <div className="text-primary animate-pulse">ESTABLISHING STREAM...</div>
          ) : signals?.map((signal) => {
            const isExpanded = expandedId === signal.id;
            const expData = expandMut.isSuccess && expandMut.variables?.id === signal.id ? expandMut.data : null;
            const isExpanding = expandMut.isPending && expandMut.variables?.id === signal.id;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={signal.id} 
                className={`border ${isExpanded ? 'border-primary bg-card/40' : 'border-border bg-card/10'}`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-card/30 transition-colors flex gap-4"
                  onClick={() => handleExpand(signal.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 border ${getPriorityColor(signal.priority)}`}>
                        {signal.priority}
                      </span>
                      <span className="text-[10px] border border-border px-1.5 py-0.5 text-muted-foreground">{signal.category}</span>
                      <span className="text-[10px] text-muted-foreground data-val ml-auto">{new Date(signal.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1 truncate">{signal.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{signal.content}</p>
                  </div>
                  <div className="shrink-0 pt-2 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border bg-background/50"
                    >
                      <div className="p-4 md:p-6 space-y-6">
                        <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground bg-card p-4 border border-border">
                          {signal.content}
                        </div>
                        
                        {isExpanding ? (
                          <div className="p-4 text-center text-primary animate-pulse border border-primary/20 bg-primary/5 text-sm">
                            PROCESSING SIGNAL EXPANSION...
                          </div>
                        ) : expData ? (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-xs font-bold text-primary mb-2 flex justify-between">
                                <span>DEEP_ANALYSIS</span>
                                <span className="data-val">CONF: {(expData.confidence * 100).toFixed(0)}%</span>
                              </h4>
                              <p className="text-sm text-foreground">{expData.deepAnalysis}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-bold text-primary mb-2">IMPLICATIONS</h4>
                                <ul className="space-y-1">
                                  {expData.implications.map((imp: string, i: number) => (
                                    <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                                      <span className="text-primary">&gt;</span> {imp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-primary mb-2">RELATED_ENTITIES</h4>
                                <div className="flex flex-wrap gap-2">
                                  {expData.relatedEntities.map((ent: string, i: number) => (
                                    <span key={i} className="text-xs border border-border bg-card px-2 py-1 data-val">
                                      {ent}
                                    </span>
                                  ))}
                                </div>
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
          })}
        </div>
      </div>
    </div>
  );
}
