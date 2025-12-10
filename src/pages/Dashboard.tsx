import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EventCard } from '@/components/events/EventCard';
import { Users, Calendar, MapPin, TrendingUp, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Event } from '@/types';
import { eventService } from '@/services/eventService';
import { congregationService } from '@/services/congregationService';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [congregationsCount, setCongregationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsData, congregationsData] = await Promise.all([
          eventService.getAll(),
          congregationService.getAll(),
        ]);
        setEvents(eventsData.slice(0, 4)); // Mostrar apenas 4 eventos próximos
        setCongregationsCount(congregationsData.length);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const upcomingEvents = events.filter(e => e.date >= new Date()).slice(0, 4);
  const stats = {
    congregations: congregationsCount,
    events: events.length,
    cities: new Set(events.map(e => e.congregationName).filter(Boolean)).size,
    growth: 8.5,
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
          </div>
          <div className="flex gap-3">
            <Link to="/congregations/new">
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" />
                Nova Congregação
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          <StatCard
            title="Congregações"
            value={stats.congregations}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Eventos Agendados"
            value={stats.events}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Cidades"
            value={stats.cities}
            icon={MapPin}
          />
          <StatCard
            title="Crescimento"
            value={`${stats.growth}%`}
            icon={TrendingUp}
            trend={{ value: stats.growth, isPositive: true }}
          />
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Próximos Eventos</h2>
              <Link to="/events">
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-5">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum evento agendado</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/40">
            <h2 className="text-xl font-semibold text-foreground mb-6">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link to="/congregations/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 hover:shadow-md transition-all duration-200 hover:border-primary/50">
                  <Users className="h-4 w-4" />
                  Cadastrar Congregação
                </Button>
              </Link>
              <Link to="/events/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 hover:shadow-md transition-all duration-200 hover:border-primary/50">
                  <Calendar className="h-4 w-4" />
                  Agendar Evento
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 hover:shadow-md transition-all duration-200 hover:border-primary/50">
                  <TrendingUp className="h-4 w-4" />
                  Ver Relatórios
                </Button>
              </Link>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/30">
              <h3 className="font-medium text-foreground mb-2">Dica do dia</h3>
              <p className="text-sm text-muted-foreground">
                Use os relatórios para acompanhar o crescimento das congregações por cidade e região.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
