import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
// Pages
import Dashboard from "@/pages/dashboard";
import Signals from "@/pages/signals";
import Entities from "@/pages/entities";
import Predictions from "@/pages/predictions";
import Anomalies from "@/pages/anomalies";
import Agents from "@/pages/agents";
import Simulations from "@/pages/simulations";
import OraclePage from "@/pages/oracle";
import Seismic from "@/pages/seismic";
import Quantum from "@/pages/quantum";
import Temporal from "@/pages/temporal";
import Neural from "@/pages/neural";
import BrainPage from "@/pages/brain";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/signals" component={Signals} />
        <Route path="/entities" component={Entities} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/anomalies" component={Anomalies} />
        <Route path="/agents" component={Agents} />
        <Route path="/simulations" component={Simulations} />
        <Route path="/oracle" component={OraclePage} />
        <Route path="/seismic" component={Seismic} />
        <Route path="/quantum" component={Quantum} />
        <Route path="/temporal" component={Temporal} />
        <Route path="/neural" component={Neural} />
        <Route path="/brain" component={BrainPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
