import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Congregations from "./pages/Congregations";
import CongregationForm from "./pages/CongregationForm";
import CongregationDetails from "./pages/CongregationDetails";
import Events from "./pages/Events";
import EventForm from "./pages/EventForm";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ReforcoAgendamento from "./pages/ReforcoAgendamento";
import RJMManagement from "./pages/RJMManagement";
import Musical from "./pages/Musical";
import DarpeManagement from "./pages/DarpeManagement";
import EBIManagement from "./pages/EBIManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/agendamento-ccb">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/congregations"
              element={
                <ProtectedRoute>
                  <Congregations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/congregations/new"
              element={
                <ProtectedRoute>
                  <CongregationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/congregations/:id"
              element={
                <ProtectedRoute>
                  <CongregationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/congregations/:id/edit"
              element={
                <ProtectedRoute>
                  <CongregationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute>
                  <EventForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute>
                  <EventForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reforco-agendamento"
              element={<ReforcoAgendamento />}
            />
            <Route
              path="/rjm"
              element={
                <ProtectedRoute>
                  <RJMManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/musical"
              element={
                <ProtectedRoute>
                  <Musical />
                </ProtectedRoute>
              }
            />
            <Route
              path="/darpe"
              element={
                <ProtectedRoute>
                  <DarpeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ebi"
              element={
                <ProtectedRoute>
                  <EBIManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
