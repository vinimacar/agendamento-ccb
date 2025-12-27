import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Book, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Filter, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Event, eventTypeLabels, EventType, ReforcoSchedule } from '@/types';
import { eventService } from '@/services/eventService';
import { reforcoService } from '@/services/reforcoService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

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

// Tipo combinado para eventos e reforços
interface ScheduleItem extends Event {
  isReforco?: boolean;
  responsibleName?: string;
}

export default function Schedule() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [reforcos, setReforcos] = useState<ReforcoSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [eventsData, reforcosData] = await Promise.all([
          eventService.getAll(),
          reforcoService.getAll()
        ]);
        setEvents(eventsData);
        setReforcos(reforcosData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Combinar eventos e reforços
  const allScheduleItems: ScheduleItem[] = [
    ...events,
    ...reforcos.map(reforco => ({
      id: reforco.id || '',
      title: reforco.type === 'culto-oficial' ? 'Culto Oficial para Reforço de Coletas' : 'RJM para Reforço de Coletas',
      type: reforco.type === 'culto-oficial' ? 'culto-oficial-reforco' : 'rjm-reforco',
      date: reforco.date,
      time: reforco.time,
      congregationId: reforco.congregationId,
      congregationName: reforco.congregationName,
      congregationCity: reforco.congregationCity,
      createdAt: reforco.createdAt,
      isReforco: true,
      responsibleName: reforco.responsibleName,
      description: reforco.isFromOutside ? `Responsável: ${reforco.responsibleName} (${reforco.outsideLocation})` : `Responsável: ${reforco.responsibleName}`,
    } as ScheduleItem))
  ];

  const filteredEvents = allScheduleItems.filter((event) => {
    // Filtrar por tipo
    const typeMatch = selectedType === 'all' || event.type === selectedType;
    
    // Filtrar por mês
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const eventMonth = eventDate.getMonth();
    const eventYear = eventDate.getFullYear();
    const selectedMonth = currentMonth.getMonth();
    const selectedYear = currentMonth.getFullYear();
    const monthMatch = eventMonth === selectedMonth && eventYear === selectedYear;
    
    return typeMatch && monthMatch;
  });

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Adicionar logo da CCB
      const logoUrl = '/ccb-logo.svg';
      const img = new Image();
      img.src = logoUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, 'SVG', 65, 5, 80, 28);
          resolve(true);
        };
        img.onerror = () => {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', pageWidth / 2, 15, { align: 'center' });
          resolve(true);
        };
      });
      
      let yPos = 38;

      // Título do relatório
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleText = selectedType === 'all' 
        ? 'AGENDA DE EVENTOS' 
        : `AGENDA DE EVENTOS - ${eventTypeLabels[selectedType].toUpperCase()}`;
      doc.text(titleText, pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;

      // Período
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Linha separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Eventos
      if (filteredEvents.length === 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhum evento encontrado para este período.', pageWidth / 2, yPos, { align: 'center' });
      } else {
        // Ordenar eventos por data
        const sortedEvents = [...filteredEvents].sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });

        sortedEvents.forEach((event, index) => {
          // Verificar se precisa de nova página
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);

          // Data
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(format(eventDate, "dd/MM/yyyy - EEEE", { locale: ptBR }), 20, yPos);
          yPos += 6;

          // Tipo de evento
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          const eventTypeLabel = eventTypeLabels[event.type] || event.type || 'Evento';
          doc.text(eventTypeLabel, 25, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 6;

          // Título
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const eventTitle = event.title || 'Sem título';
          doc.text(eventTitle, 25, yPos);
          yPos += 6;

          // Horário e Congregação
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const eventTime = event.time || 'Horário não definido';
          doc.text(`Horário: ${eventTime}`, 25, yPos);
          if (event.congregationName) {
            yPos += 5;
            const location = event.congregationCity 
              ? `${event.congregationName} - ${event.congregationCity}`
              : event.congregationName;
            doc.text(`Local: ${location}`, 25, yPos);
          }
          yPos += 5;

          // Descrição
          if (event.description) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            const lines = doc.splitTextToSize(event.description, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 4;
          }

          yPos += 8; // Espaço entre eventos

          // Linha divisória entre eventos
          if (index < sortedEvents.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(25, yPos, pageWidth - 25, yPos);
            yPos += 8;
          }
        });
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }

      // Salvar PDF
      const fileName = `Agenda_${format(currentMonth, 'MMMM_yyyy', { locale: ptBR })}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF gerado com sucesso",
        description: `O arquivo ${fileName} foi baixado.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF.",
        variant: "destructive",
      });
    }
  };

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
                <SelectTrigger className="w-[200px] shadow-sm hover:shadow-md transition-shadow duration-200">
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
              <Button
                variant="outline"
                size="default"
                className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={generatePDF}
              >
                <Printer className="h-4 w-4" />
                Imprimir PDF
              </Button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-semibold text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
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
                    className="group bg-card rounded-2xl p-6 shadow-md border border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                  >
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
                              <span>{event.congregationName}{event.congregationCity ? ` - ${event.congregationCity}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 px-4">
                <div className="bg-card rounded-2xl p-8 shadow-md border border-border/40 max-w-md mx-auto">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou volte mais tarde.
                  </p>
                </div>
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
