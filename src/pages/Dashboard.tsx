import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EventCard } from '@/components/events/EventCard';
import { Users, Calendar, MapPin, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Event } from '@/types';

// Mock data for demonstration
const mockStats = {
  congregations: 45,
  events: 128,
  cities: 12,
  growth: 8.5,
};

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Culto de Adoração',
    type: 'culto-busca-dons',
    date: new Date(2024, 11, 15),
    time: '19:00',
    congregationName: 'Congregação Central',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Reunião da Mocidade',
    type: 'reuniao-mocidade',
    date: new Date(2024, 11, 18),
    time: '15:00',
    congregationName: 'Congregação Norte',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Santa Ceia',
    type: 'santa-ceia',
    date: new Date(2024, 11, 20),
    time: '09:00',
    congregationName: 'Congregação Sul',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Batismo',
    type: 'batismo',
    date: new Date(2024, 11, 22),
    time: '10:00',
    congregationName: 'Congregação Leste',
    createdAt: new Date(),
  },
];

export default function Dashboard() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Congregações"
            value={mockStats.congregations}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Eventos Agendados"
            value={mockStats.events}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Cidades"
            value={mockStats.cities}
            icon={MapPin}
          />
          <StatCard
            title="Crescimento"
            value={`${mockStats.growth}%`}
            icon={TrendingUp}
            trend={{ value: mockStats.growth, isPositive: true }}
          />
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Próximos Eventos</h2>
              <Link to="/events">
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-6">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link to="/congregations/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Users className="h-4 w-4" />
                  Cadastrar Congregação
                </Button>
              </Link>
              <Link to="/events/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Calendar className="h-4 w-4" />
                  Agendar Evento
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <TrendingUp className="h-4 w-4" />
                  Ver Relatórios
                </Button>
              </Link>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-muted/50">
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
