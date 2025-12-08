import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Event, eventTypeLabels } from '@/types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Culto de Adoração',
    type: 'culto-busca-dons',
    date: new Date(2024, 11, 15),
    time: '19:00',
    congregationName: 'Congregação Central',
    description: 'Culto especial para busca dos dons espirituais.',
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

export default function Events() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.congregationName?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Eventos</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os eventos agendados</p>
          </div>
          <Link to="/events/new">
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              Novo Evento
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== 'all' ? 'Tente ajustar seus filtros' : 'Comece agendando o primeiro evento'}
            </p>
            <Link to="/events/new">
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
