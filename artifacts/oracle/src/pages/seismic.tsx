import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSeismicEvents, 
  useRecordSeismicEvent, 
  useGetResonanceState, 
  useComputePropagation, 
  useRecordInteraction,
  SeismicEventResonanceType
} from "@workspace/api-client-react";
import { SeismicWaveform } from "@/components/canvas/SeismicWaveform";
import { PropagationRing } from "@/components/canvas/PropagationRing";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Seismic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const recordInteraction = useRecordInteraction();
  
  const { data: events, isLoading: loadingEvents } = useListSeismicEvents();
  const { data: resonance, isLoading: loadingResonance } = useGetResonanceState();
  
  const recordEvent = useRecordSeismicEvent();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("unknown");
  const [region, setRegion] = useState("");
  const [intensity, setIntensity] = useState([5]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !region) return;
    
    recordEvent.mutate({
      data: {
        title,
        description,
        resonanceType: type,
        epicenterRegion: region,
        intensity: intensity[0]
      }
    }, {
      onSuccess: () => {
        toast({ title: "EVENT RECORDED", description: "Seismic pulse tracked." });
        setTitle("");
        setDescription("");
        setRegion("");
        queryClient.invalidateQueries({ queryKey: ["/api/seismic"] });
        queryClient.invalidateQueries({ queryKey: ["/api/seismic/resonance"] });
      }
    });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="h-64 md:h-96 shrink-0 relative border-b border-border">
        {resonance && (
          <SeismicWaveform 
            emotionalValence={resonance.globalValence}
            activeFrequencies={resonance.activeFrequencies}
            pulseRate={resonance.pulseRate}
          />
        )}
        <div className="absolute top-4 left-4 text-xs bg-black/60 px-2 py-1 border border-primary/20 pointer-events-none text-primary">
          SEISMIC_WAVEFORM_MONITOR [CLICK TO INDUCE PULSE]
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold">RESONANCE STATE</h2>
            
            {loadingResonance ? (
              <div className="animate-pulse text-primary">CALIBRATING SENSORS...</div>
            ) : resonance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border border-border bg-card/50">
                  <div className="text-xs text-muted-foreground">GLOBAL_VALENCE</div>
                  <div className={`text-2xl font-bold data-val ${resonance.globalValence < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {resonance.globalValence.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 border border-border bg-card/50">
                  <div className="text-xs text-muted-foreground">DOMINANT_TYPE</div>
                  <div className="text-lg font-bold data-val text-primary truncate">
                    {resonance.dominantResonance}
                  </div>
                </div>
                <div className="p-4 border border-border bg-card/50">
                  <div className="text-xs text-muted-foreground">PULSE_RATE</div>
                  <div className="text-2xl font-bold data-val text-primary">
                    {resonance.pulseRate} bpm
                  </div>
                </div>
                <div className="p-4 border border-border bg-card/50">
                  <div className="text-xs text-muted-foreground">FREQUENCIES</div>
                  <div className="text-lg font-bold data-val text-primary truncate">
                    {resonance.activeFrequencies.join(", ")}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-4 p-4 border border-border bg-primary/5">
                  <div className="text-xs text-muted-foreground mb-2">SYNTHESIS</div>
                  <div className="text-sm data-val italic">"{resonance.groundTruth}"</div>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold mt-8">RECENT EVENTS</h2>
            <div className="space-y-4">
              {events?.map((ev, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={ev.id} 
                  className="p-4 border border-border bg-card/30 flex gap-4 overflow-hidden relative"
                >
                  <div className="w-16 h-16 shrink-0 relative flex items-center justify-center opacity-50">
                    <PropagationRing intensity={ev.intensity} emotionalValence={ev.emotionalValence} />
                    <div className="absolute text-xs data-val">{ev.intensity}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold truncate">{ev.title}</h3>
                      <span className="text-xs border border-primary/30 px-2 py-0.5 text-primary">
                        {ev.resonanceType}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate mb-2">{ev.description}</div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-primary/70">EPICENTER: <span className="data-val">{ev.epicenterRegion}</span></span>
                      <span className="text-primary/70">RANGE: <span className="data-val">{ev.propagationRange}km</span></span>
                      <span className="text-primary/70">VALENCE: <span className="data-val">{ev.emotionalValence.toFixed(2)}</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card/50 p-6 flex flex-col h-fit">
            <h2 className="text-xl font-bold mb-6 text-primary">RECORD EVENT</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">TITLE</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">DESCRIPTION</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-background border-border min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">TYPE</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SeismicEventResonanceType).map(t => (
                        <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">REGION</label>
                  <Input value={region} onChange={e => setRegion(e.target.value)} required className="bg-background border-border" />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-muted-foreground">INTENSITY</label>
                  <span className="text-primary data-val">{intensity[0]}</span>
                </div>
                <Slider 
                  value={intensity} 
                  onValueChange={setIntensity} 
                  min={1} max={10} step={1}
                />
              </div>
              <Button type="submit" disabled={recordEvent.isPending} className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                {recordEvent.isPending ? "RECORDING..." : "INJECT PULSE"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
