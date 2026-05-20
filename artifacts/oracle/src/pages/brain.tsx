import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Database, Search, RefreshCw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BrainPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    try {
      const res = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      toast({ title: "Brain Error", description: "Failed to get response from ORACLE Brain", variant: "destructive" });
    } finally {
      setIsAsking(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/intelligence/sync", { method: "POST" });
      const data = await res.json();
      toast({ title: "Memory Synced", description: `Successfully indexed ${data.count} knowledge nodes.` });
    } catch (error) {
      toast({ title: "Sync Error", description: "Failed to sync knowledge vault", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PROPRIETARY_BRAIN</h1>
            <p className="text-sm text-muted-foreground">LOCAL_FIRST_REASONING_ENGINE</p>
          </div>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2">
          {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          SYNC_VAULT
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              DIRECT_INFERENCE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="ENTER_QUERY_FOR_PROPRIETARY_ANALYSIS..."
              className="min-h-[120px] bg-background/50 border-primary/30 font-mono text-sm"
            />
            <Button onClick={handleAsk} disabled={isAsking || !question.trim()} className="w-full gap-2">
              {isAsking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              EXECUTE_REASONING
            </Button>
            {response && (
              <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-sm">
                <div className="text-[10px] font-bold text-primary mb-2">ORACLE_RESPONSE</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{response}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/30">
          <CardHeader>
            <CardTitle className="text-sm font-mono">SYSTEM_STATUS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">ENGINE_STATUS</span>
                <span className="text-primary font-bold">ACTIVE</span>
              </div>
              <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[100%] animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">MEMORY_LOAD</span>
                <span className="text-primary font-bold">OPTIMIZED</span>
              </div>
              <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[45%]" />
              </div>
            </div>
            <div className="pt-4 border-t border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground mb-2">CONNECTED_NODES</div>
              <div className="space-y-1">
                {["OLLAMA_LOCAL", "CHROMADB_VECTOR", "OBSIDIAN_VAULT"].map((node) => (
                  <div key={node} className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {node}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
}
