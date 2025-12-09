import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Book, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Event, eventTypeLabels, EventType } from '@/types';
import { eventService } from '@/services/eventService';
import { cn } from '@/lib/utils';

const eventTypeColors: Record<string, string> = {
  'culto-busca-dons': 'bg-primary text-primary-foreground',
  'culto-jovens': 'bg-accent text-accent-foreground',
  'reuniao-mocidade': 'bg-success text-primary-foreground',
  'batismo': 'bg-navy text-primary-foreground',
  'santa-ceia': 'bg-gold text-foreground',
  'ordenacao': 'bg-primary text-primary-foreground',
  'reuniao-ministerial': 'bg-muted-foreground text-primary-foreground',
  'culto-oficial-reforco': 'bg-warning text-foreground',
  'rjm-reforco': 'bg-accent text-accent-foreground',
};

export default function Schedule() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await eventService.getAll();
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = events.filter(
    (event) => selectedType === 'all' || event.type === selectedType
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg">
              <Book className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">agendaccb</span>
          </Link>
          <Link to="/login">
            <Button variant="outline">
              Área Administrativa
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Agenda de Eventos
            </h1>
            <p className="text-muted-foreground">
              Confira os próximos eventos das congregações
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-5 w-5" />
                <span className="text-sm font-medium">Filtrar:</span>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium text-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Events List */}
          <div className="grid gap-4 max-w-3xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                return (
                  <div
                    key={event.id}
                    className="bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300 animate-fade-up"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0">
                        <span className="text-xs font-medium">
                          {format(eventDate, 'MMM', { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-xl font-bold leading-none">
                          {format(eventDate, 'dd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2',
                            eventTypeColors[event.type] || 'bg-muted text-muted-foreground'
                          )}
                        >
                          {eventTypeLabels[event.type]}
                        </span>
                        <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                        {event.description && (
                          <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          {event.congregationName && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              <span>{event.congregationName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou volte mais tarde.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">agendaccb</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} agendaccb. Sistema de Gestão para Congregações.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
