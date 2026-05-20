import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useGetConversationMessages,
  useRecordInteraction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Plus, Zap, Brain, Activity } from "lucide-react";

interface AgentVote {
  name: string;
  role: string;
  stance: string;
  confidence: number;
  reasoning?: string;
}

interface LocalMessage {
  id: string;
  role: "user" | "oracle";
  content: string;
  streaming?: boolean;
  confidence?: number;
  agentVotes?: AgentVote[];
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function OraclePage() {
  const queryClient = useQueryClient();
  const recordInteraction = useRecordInteraction();

  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [expandedVote, setExpandedVote] = useState<string | null>(null);

  const { data: conversations } = useListConversations();
  const { data: dbMessages } = useGetConversationMessages(selectedId || 0, {
    query: { enabled: !!selectedId && !isStreaming }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync DB messages into local state when a conversation is selected
  useEffect(() => {
    if (!selectedId) return;
    if (dbMessages && !isStreaming) {
      setLocalMessages(
        dbMessages.map((m: any) => ({
          id: String(m.id),
          role: m.role === "user" ? "user" : "oracle",
          content: m.content,
          confidence: m.metadata?.confidence,
          agentVotes: m.metadata?.agentVotes,
        }))
      );
    }
  }, [dbMessages, selectedId, isStreaming]);

  // Clear local messages when switching to new thread
  useEffect(() => {
    if (!selectedId) setLocalMessages([]);
  }, [selectedId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, streamingText]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const text = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    setLocalMessages(prev => [...prev, { id: userMsgId, role: "user", content: text }]);

    recordInteraction.mutate({ data: { type: "query", target: "oracle" } });

    try {
      abortRef.current = new AbortController();
      const resp = await fetch(`${BASE}/api/oracle/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, conversationId: selectedId }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let newConvId: number | undefined;
      let finalConfidence = 0.85;
      let finalVotes: AgentVote[] = [];

      // Add streaming oracle message placeholder
      const oracleMsgId = `oracle-${Date.now()}`;
      setLocalMessages(prev => [...prev, { id: oracleMsgId, role: "oracle", content: "", streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "meta") {
              newConvId = payload.conversationId;
              if (!selectedId && newConvId) {
                setSelectedId(newConvId);
                queryClient.invalidateQueries({ queryKey: ["/api/oracle/conversations"] });
              }
            } else if (payload.type === "token") {
              accumulated += payload.token;
              setStreamingText(accumulated);
              // Update streaming message content live
              setLocalMessages(prev => prev.map(m =>
                m.id === oracleMsgId ? { ...m, content: accumulated } : m
              ));
            } else if (payload.type === "done") {
              finalConfidence = payload.confidence;
              finalVotes = payload.agentVotes ?? [];
              // Finalize the message
              setLocalMessages(prev => prev.map(m =>
                m.id === oracleMsgId
                  ? { ...m, content: accumulated, streaming: false, confidence: finalConfidence, agentVotes: finalVotes }
                  : m
              ));
              if (newConvId || selectedId) {
                queryClient.invalidateQueries({
                  queryKey: ["/api/oracle/conversations", String(newConvId || selectedId), "messages"]
                });
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setLocalMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: "oracle",
          content: "INTELLIGENCE_SYNTHESIS_ERROR — Check sensor arrays and retry.",
        }]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [input, isStreaming, selectedId, recordInteraction, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectConversation = (id: number) => {
    setSelectedId(id);
    setLocalMessages([]);
    setStreamingText("");
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 lg:w-72 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            THREADS
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSelectedId(undefined); setLocalMessages([]); }}
            className="h-8 w-8 hover:bg-primary/20 text-primary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Engine status */}
        <div className="px-3 py-2 border-b border-border space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Brain className="h-3 w-3 text-primary" />
            <span className="text-primary">PROPRIETARY_ENGINE</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-green-500">●</span> BAYESIAN_INFERENCE: ACTIVE
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-green-500">●</span> SEISMIC_LAYER: ACTIVE
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-green-500">●</span> QUANTUM_FIELD: ACTIVE
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-green-500">●</span> WEB_HARVESTER: ACTIVE
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-yellow-500">◈</span> EXTERNAL_AI: NONE
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div
            onClick={() => { setSelectedId(undefined); setLocalMessages([]); }}
            className={`p-3 text-xs cursor-pointer border transition-colors ${!selectedId ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-card'}`}
          >
            [NEW_UPLINK]
          </div>
          {conversations?.map((c: any) => (
            <div
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`p-3 text-xs cursor-pointer border truncate transition-colors ${selectedId === c.id ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-card'}`}
            >
              {c.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="p-3 border-b border-border bg-card/50 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-primary text-sm">ORACLE_INTERFACE</h2>
            <div className="text-[10px] text-muted-foreground">
              {isStreaming ? (
                <span className="text-primary animate-pulse flex items-center gap-1">
                  <Activity className="h-2 w-2" /> SYNTHESIZING_INTELLIGENCE...
                </span>
              ) : "PROPRIETARY SYNTHESIS ENGINE — NO EXTERNAL AI"}
            </div>
          </div>
          {isStreaming && (
            <div className="flex gap-1">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1 bg-primary animate-pulse" style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 100}ms`
                }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {localMessages.length === 0 && !isStreaming && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-4 opacity-40">
              <Brain className="h-16 w-16" />
              <div className="text-center">
                <div>ORACLE INTELLIGENCE ENGINE</div>
                <div className="text-xs mt-1">Bayesian · Seismic · Quantum · Temporal</div>
                <div className="text-xs">100% Proprietary — No External AI</div>
              </div>
            </div>
          )}

          {localMessages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] md:max-w-[75%] p-4 border ${
                m.role === "user"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold opacity-60">{m.role.toUpperCase()}</span>
                  {m.role === "oracle" && m.confidence && !m.streaming && (
                    <span className="text-[10px] text-primary/70 font-mono">
                      {(m.confidence * 100).toFixed(1)}% CONF
                    </span>
                  )}
                  {m.streaming && (
                    <span className="text-[10px] text-primary animate-pulse flex items-center gap-1">
                      <Zap className="h-2 w-2" /> STREAMING
                    </span>
                  )}
                </div>

                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {m.content}
                  {m.streaming && (
                    <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
                  )}
                </div>

                {/* Agent votes */}
                {m.role === "oracle" && !m.streaming && m.agentVotes && m.agentVotes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/40">
                    <div className="text-[10px] text-muted-foreground mb-2 font-bold">AGENT COUNCIL</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.agentVotes.map((vote, i) => (
                        <button
                          key={i}
                          onClick={() => setExpandedVote(expandedVote === `${m.id}-${i}` ? null : `${m.id}-${i}`)}
                          className={`text-[10px] px-2 py-1 border transition-colors text-left ${
                            vote.stance === "STRONGLY_AGREES" ? "border-primary/70 bg-primary/15 text-primary" :
                            vote.stance === "AGREES" ? "border-primary/40 bg-primary/8 text-primary/80" :
                            vote.stance === "DISSENTS" ? "border-red-500/50 bg-red-500/10 text-red-400" :
                            "border-yellow-500/40 bg-yellow-500/10 text-yellow-500/80"
                          }`}
                        >
                          <span className="font-bold">{vote.name}</span>
                          <span className="ml-1 opacity-70">{(vote.confidence * 100).toFixed(0)}%</span>
                        </button>
                      ))}
                    </div>
                    {/* Expanded reasoning */}
                    {m.agentVotes.map((vote, i) => (
                      expandedVote === `${m.id}-${i}` && vote.reasoning && (
                        <div key={i} className="mt-2 p-2 bg-background border border-border text-[10px] text-muted-foreground">
                          <span className="text-primary font-bold">{vote.name} ({vote.role}): </span>
                          {vote.reasoning}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-card/30 shrink-0">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="INPUT_QUERY — ORACLE WILL SYNTHESIZE FROM SEISMIC, QUANTUM, TEMPORAL & LIVE WEB INTELLIGENCE..."
              className="min-h-[60px] max-h-[200px] bg-background border-primary/40 focus-visible:ring-primary/50 resize-none text-sm"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="h-auto px-5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {isStreaming ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <div className="text-center text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-3">
            <span>[ENTER] TRANSMIT</span>
            <span className="text-primary">●</span>
            <span>PROPRIETARY ENGINE — BAYESIAN + SEISMIC + QUANTUM + TEMPORAL</span>
            <span className="text-primary">●</span>
            <span>LIVE WEB INTELLIGENCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
