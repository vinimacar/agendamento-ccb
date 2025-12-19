import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, User, Edit, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Event, eventTypeLabels } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { DataLancamentoDialog } from '@/components/data/DataLancamentoDialog';

interface EventCardProps {
  event: Event;
  compact?: boolean;
  showDataEntry?: boolean;
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

export function EventCard({ event, compact = false, showDataEntry = false }: EventCardProps) {
  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  
  if (compact) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-all duration-200 border border-border/40 hover:border-primary/30 hover:shadow-md group">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-[10px] font-medium leading-none">
              {format(eventDate, 'MMM', { locale: ptBR }).toUpperCase()}
            </span>
            <span className="text-base font-bold leading-none mt-0.5">
              {format(eventDate, 'dd')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{event.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {eventTypeLabels[event.type]}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pl-[52px]">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium border",
            eventTypeColors[event.type] || 'bg-muted text-muted-foreground'
          )}>
            {format(eventDate, 'EEE', { locale: ptBR }).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-card rounded-2xl p-6 shadow-sm border border-border/40 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
          <span className="text-xs font-medium">
            {format(eventDate, 'MMM', { locale: ptBR }).toUpperCase()}
          </span>
          <span className="text-xl font-bold leading-none">
            {format(eventDate, 'dd')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className={cn(
              "inline-block px-3 py-1 rounded-full text-xs font-semibold border shadow-sm",
              eventTypeColors[event.type] || 'bg-muted text-muted-foreground'
            )}>
              {eventTypeLabels[event.type]}
            </span>
            <div className="flex gap-1">
              {showDataEntry && (event.type === 'batismo' || event.type === 'santa-ceia') && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 shrink-0 hover:bg-green-500/10 hover:text-green-600 transition-colors rounded-lg"
                  onClick={() => setDataDialogOpen(true)}
                  title="Lançar dados"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Link to={`/events/${event.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
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

      {/* Dialog para lançar dados */}
      {showDataEntry && (
        <DataLancamentoDialog 
          open={dataDialogOpen} 
          onOpenChange={setDataDialogOpen}
          onDataSaved={() => {
            setDataDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
