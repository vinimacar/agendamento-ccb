import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, User } from 'lucide-react';
import { Event, eventTypeLabels } from '@/types';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  compact?: boolean;
}

const eventTypeColors: Record<string, string> = {
  'culto-busca-dons': 'bg-primary/10 text-primary border-primary/20',
  'culto-jovens': 'bg-accent/10 text-accent border-accent/20',
  'reuniao-mocidade': 'bg-success/10 text-success border-success/20',
  'batismo': 'bg-navy/10 text-navy border-navy/20',
  'santa-ceia': 'bg-gold/10 text-gold border-gold/20',
  'ordenacao': 'bg-primary/10 text-primary border-primary/20',
  'reuniao-ministerial': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  'culto-oficial-reforco': 'bg-warning/10 text-warning border-warning/20',
  'rjm-reforco': 'bg-accent/10 text-accent border-accent/20',
};

export function EventCard({ event, compact = false }: EventCardProps) {
  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
  
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="w-12 h-12 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground">
          <span className="text-xs font-medium">
            {format(eventDate, 'MMM', { locale: ptBR }).toUpperCase()}
          </span>
          <span className="text-lg font-bold leading-none">
            {format(eventDate, 'dd')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground truncate">
            {eventTypeLabels[event.type]}
          </p>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          eventTypeColors[event.type] || 'bg-muted text-muted-foreground'
        )}>
          {event.time}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
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
          <span className={cn(
            "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border mb-2",
            eventTypeColors[event.type] || 'bg-muted text-muted-foreground'
          )}>
            {eventTypeLabels[event.type]}
          </span>
          <h3 className="font-semibold text-foreground">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
          
          {/* Exibir contagem para Santa Ceia e Batismo */}
          {(event.type === 'santa-ceia' || event.type === 'batismo') && (event.irmaos || event.irmas) && (
            <div className="mt-3 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  {event.irmaos !== undefined && (
                    <span className="text-muted-foreground">
                      {event.type === 'santa-ceia' ? 'Irmãos' : 'Homens'}: <strong className="text-foreground">{event.irmaos}</strong>
                    </span>
                  )}
                  {event.irmas !== undefined && (
                    <span className="text-muted-foreground">
                      {event.type === 'santa-ceia' ? 'Irmãs' : 'Mulheres'}: <strong className="text-foreground">{event.irmas}</strong>
                    </span>
                  )}
                </div>
                <span className="font-semibold text-primary">
                  Total: {(event.irmaos || 0) + (event.irmas || 0)}
                </span>
              </div>
            </div>
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
            {event.elderName && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>
                  {event.elderName}
                  {event.elderFromOtherLocation && <span className="text-xs ml-1">(Visitante)</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
