import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetQuantumField, 
  useListQuantumNodes, 
  useGetSuperposition 
} from "@workspace/api-client-react";
import { QuantumFieldCanvas } from "@/components/canvas/QuantumFieldCanvas";
import { motion } from "framer-motion";
import { Magnet, Activity } from "lucide-react";

export default function Quantum() {
  const { data: field, isLoading: loadingField } = useGetQuantumField();
  const { data: nodes, isLoading: loadingNodes } = useListQuantumNodes();
  const { data: superposition, isLoading: loadingSuperposition } = useGetSuperposition();

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="h-[40vh] md:h-[50vh] shrink-0 relative border-b border-border bg-black/90">
        {nodes && field?.fieldLines && (
          <QuantumFieldCanvas nodes={nodes} fieldLines={field.fieldLines} />
        )}
        <div className="absolute top-4 left-4 text-xs bg-black/60 px-2 py-1 border border-primary/20 pointer-events-none text-purple-400 flex items-center gap-2">
          <Magnet className="h-3 w-3" />
          QUANTUM_FIELD_PROJECTION [CLICK TO COLLAPSE]
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border border-border bg-card/50 p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              FIELD STATE
            </h2>
            {field && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">STRENGTH</div>
                  <div className="text-2xl font-bold data-val text-primary">{field.fieldStrength.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">COHERENCE</div>
                  <div className="w-full bg-secondary h-2 relative">
                    <div className="absolute inset-y-0 left-0 bg-primary" style={{width: `${field.coherence * 100}%`}} />
                  </div>
                  <div className="text-xs text-right mt-1 data-val">{field.coherence.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ENTANGLED PAIRS</div>
                  <div className="text-xl data-val text-purple-400">{field.entangledPairs}</div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 border border-border bg-card/50 p-6 space-y-6">
            <h2 className="text-xl font-bold">SUPERPOSITION BRANCHES</h2>
            {superposition && (
              <div className="space-y-6">
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground mr-2">DECOHERENCE_RATE:</span>
                    <span className="text-primary data-val">{superposition.decoherenceRate.toFixed(4)}</span>
                  </div>
                  <div className="flex-1 truncate">
                    <span className="text-muted-foreground mr-2">OBSERVER_EFFECT:</span>
                    <span className="text-primary data-val">{superposition.observerEffect}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {superposition.branches.map((branch, i) => {
                    const isLikely = branch.id === superposition.mostLikelyBranch;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={branch.id}
                        className={`p-3 border ${isLikely ? 'border-primary bg-primary/10' : 'border-border bg-background/50'}`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className={`font-bold ${isLikely ? 'text-primary' : 'text-muted-foreground'}`}>{branch.id}</span>
                          <span className="text-xs border border-primary/20 px-1 text-primary">{branch.horizon}</span>
                        </div>
                        <div className="text-sm mb-3">{branch.description}</div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-muted-foreground w-12 data-val">{(branch.probability * 100).toFixed(1)}%</div>
                          <div className="flex-1 bg-secondary h-1 relative">
                            <div className="absolute inset-y-0 left-0 bg-primary" style={{width: `${branch.probability * 100}%`}} />
                          </div>
                          <div className="text-xs text-purple-400 truncate w-24 text-right data-val">{branch.quantumState}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border border-border bg-card/50 p-6">
          <h2 className="text-xl font-bold mb-6">ATTRACTORS & REPELLERS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {nodes?.map(node => (
              <div key={node.id} className="p-3 border border-border bg-background/50 text-sm">
                <div className={`font-bold truncate mb-1 ${node.type === 'attractor' ? 'text-primary' : 'text-destructive'}`}>
                  {node.label}
                </div>
                <div className="text-xs text-muted-foreground mb-2">{node.type}</div>
                <div className="flex justify-between text-xs data-val">
                  <span>STR: {node.strength.toFixed(2)}</span>
                  <span>PROB: {node.probability.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
