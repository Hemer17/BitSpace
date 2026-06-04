import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import FeedPage from "@/pages/FeedPage";
import MapPage from "@/pages/MapPage";
import ArtistsPage from "@/pages/ArtistsPage";
import ArtistDetailPage from "@/pages/ArtistDetailPage";
import TicketsPage from "@/pages/TicketsPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={FeedPage} />
        <Route path="/mappa" component={MapPage} />
        <Route path="/artisti" component={ArtistsPage} />
        <Route path="/artisti/:id" component={ArtistDetailPage} />
        <Route path="/biglietti" component={TicketsPage} />
        <Route path="/dashboard" component={DashboardPage} />
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
