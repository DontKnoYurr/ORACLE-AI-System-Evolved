import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  MessageSquare, 
  Waves, 
  Magnet, 
  Clock, 
  BrainCircuit,
  Menu,
  X,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/brain", label: "PROPRIETARY_BRAIN", icon: Brain },
  { href: "/signals", label: "SIGNALS_CORE", icon: Activity },
  { href: "/entities", label: "ENTITY_MAP", icon: Users },
  { href: "/predictions", label: "PREDICT_ENGINE", icon: TrendingUp },
  { href: "/anomalies", label: "ANOMALY_DET", icon: AlertTriangle },
  { href: "/agents", label: "AGENT_SWARM", icon: Cpu },
  { href: "/simulations", label: "SIM_MATRIX", icon: Terminal },
  { href: "/oracle", label: "ORACLE_INT", icon: MessageSquare },
  { href: "/seismic", label: "SEISMIC_INT", icon: Waves },
  { href: "/quantum", label: "QUANTUM_FLD", icon: Magnet },
  { href: "/temporal", label: "TEMP_AXIS", icon: Clock },
  { href: "/neural", label: "NEURAL_ADAPT", icon: BrainCircuit },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar z-20 shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="h-6 w-6 rounded-none bg-primary animate-pulse flex items-center justify-center">
            <div className="h-2 w-2 bg-background" />
          </div>
          <h1 className="text-xl font-bold tracking-widest">ORACLE</h1>
        </div>
        <div className="p-2 flex-1 overflow-y-auto overflow-x-hidden space-y-1">
          <div className="text-xs text-muted-foreground mb-4 mt-2 px-2">SYSTEM_MODULES</div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={`flex items-center gap-3 px-3 py-2 text-sm border-l-2 transition-all duration-200 cursor-pointer ${
                  location === item.href
                    ? "border-primary bg-accent text-primary"
                    : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>SYS_STAT:</span>
            <span className="text-primary">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span>UPLINK:</span>
            <span className="text-primary animate-pulse">ESTABLISHED</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden absolute top-0 left-0 right-0 h-14 border-b border-border bg-sidebar z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-primary animate-pulse" />
          <span className="font-bold">ORACLE</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-foreground p-2"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute inset-0 top-14 bg-background z-20 overflow-y-auto"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 border border-border ${
                      location === item.href
                        ? "bg-accent border-primary text-primary"
                        : "bg-card text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative pt-14 md:pt-0">
        <div className="absolute inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
        
        {/* Subtle scanline effect */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-30 h-[200%] animate-[scan_10s_linear_infinite]" 
          style={{ backgroundSize: '100% 50%' }}
        />

        <div className="h-full overflow-auto relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
