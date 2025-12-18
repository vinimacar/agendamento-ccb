import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { batismoDataService, santaCeiaDataService, ensaioDataService } from '@/services/dataLancamentoService';
import { reforcoService } from '@/services/reforcoService';
import { eventService } from '@/services/eventService';
import type { BatismoData, SantaCeiaData, EnsaioData, Event as EventType } from '@/types';
import { FileSpreadsheet, FileText, Eye, Loader2, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReforcoSchedule {
  id?: string;
  congregationId: string;
  congregationName: string;
  date: Date;
  time?: string;
  type: 'culto-oficial' | 'rjm';
  responsibleName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ListItem {
  date: Date;
  time?: string;
  type: string;
  congregationName: string;
  city: string;
  details?: string;
  responsavel?: string;
}

export default function Lists() {
  const { toast } = useToast();
  const { congregations } = useCongregations();
  
  const [loading, setLoading] = useState(false);
  const [batismos, setBatismos] = useState<BatismoData[]>([]);
  const [santaCeias, setSantaCeias] = useState<SantaCeiaData[]>([]);
  const [ensaios, setEnsaios] = useState<EnsaioData[]>([]);
  const [reforcos, setReforcos] = useState<ReforcoSchedule[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  
  // Filtros de período
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCongregation, setFilterCongregation] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [avisos, setAvisos] = useState('');

  useEffect(() => {
    loadAllData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [batismosData, santaCeiasData, ensaiosData, reforcosData, eventsData] = await Promise.all([
        batismoDataService.getAll(),
        santaCeiaDataService.getAll(),
        ensaioDataService.getAll(),
        reforcoService.getAll(),
        eventService.getAll(),
      ]);

      setBatismos(batismosData);
      setSantaCeias(santaCeiasData);
      setEnsaios(ensaiosData);
      setReforcos(reforcosData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do sistema.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = (): ListItem[] => {
    const items: ListItem[] = [];
    
    // Parse das datas do filtro
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Função auxiliar para verificar se a data está no período
    const isInPeriod = (date: Date) => {
      if (!start && !end) return true;
      if (start && end) return date >= start && date <= end;
      if (start) return date >= start;
      if (end) return date <= end;
      return true;
    };

    // Batismos
    if (filterType === 'all' || filterType === 'batismo') {
      batismos.forEach(batismo => {
        if (isInPeriod(batismo.date)) {
          if (filterCongregation === 'all' || batismo.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === batismo.congregationId);
            items.push({
              date: batismo.date,
              time: '19:30',
              type: 'Batismo',
              congregationName: batismo.congregationName,
              city: cong?.city || '-',
              details: `${batismo.irmaos + batismo.irmas} batizados`,
              responsavel: cong?.admin || '-',
            });
          }
        }
      });
    }

    // Santa Ceia
    if (filterType === 'all' || filterType === 'santa-ceia') {
      santaCeias.forEach(ceia => {
        if (isInPeriod(ceia.date)) {
          if (filterCongregation === 'all' || ceia.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === ceia.congregationId);
            items.push({
              date: ceia.date,
              time: '19:30',
              type: 'Santa Ceia',
              congregationName: ceia.congregationName,
              city: cong?.city || '-',
              details: `${ceia.irmaos + ceia.irmas} participantes`,
              responsavel: cong?.admin || '-',
            });
          }
        }
      });
    }

    // Ensaios Regionais
    if (filterType === 'all' || filterType === 'ensaio-regional') {
      ensaios.forEach(ensaio => {
        if (ensaio.type === 'regional' && isInPeriod(ensaio.date)) {
          if (filterCongregation === 'all' || ensaio.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === ensaio.congregationId);
            items.push({
              date: ensaio.date,
              time: '19:00',
              type: 'Ensaio Regional',
              congregationName: ensaio.congregationName,
              city: cong?.city || '-',
              responsavel: '-',
            });
          }
        }
      });
    }

    // Reforços para Cultos Oficiais
    if (filterType === 'all' || filterType === 'reforco-culto') {
      reforcos.forEach(reforco => {
        if (reforco.type === 'culto-oficial' && isInPeriod(reforco.date)) {
          if (filterCongregation === 'all' || reforco.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === reforco.congregationId);
            items.push({
              date: reforco.date,
              time: reforco.time || '19:30',
              type: 'Reforço - Culto Oficial',
              congregationName: reforco.congregationName,
              city: cong?.city || '-',
              responsavel: reforco.responsibleName || '-',
            });
          }
        }
      });
    }

    // Reforços para RJM
    if (filterType === 'all' || filterType === 'reforco-rjm') {
      reforcos.forEach(reforco => {
        if (reforco.type === 'rjm' && isInPeriod(reforco.date)) {
          if (filterCongregation === 'all' || reforco.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === reforco.congregationId);
            items.push({
              date: reforco.date,
              time: reforco.time || '19:30',
              type: 'Reforço - RJM',
              congregationName: reforco.congregationName,
              city: cong?.city || '-',
              responsavel: reforco.responsibleName || '-',
            });
          }
        }
      });
    }

    // Eventos gerais
    if (filterType === 'all' || filterType === 'eventos') {
      events.forEach(event => {
        if (isInPeriod(event.date)) {
          if (filterCongregation === 'all' || event.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === event.congregationId);
            items.push({
              date: event.date,
              time: event.time || '19:30',
              type: event.type || 'Evento',
              congregationName: event.congregationName || cong?.name || '-',
              city: cong?.city || '-',
              details: event.description || event.title,
              responsavel: event.elderName || '-',
            });
          }
        }
      });
    }

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const exportToExcel = () => {
    const items = getFilteredItems();

    if (items.length === 0) {
      toast({
        title: 'Nenhum item encontrado',
        description: 'Não há dados para exportar com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const worksheetData: (string | number)[][] = [];
    worksheetData.push(['CONGREGAÇÃO CRISTÃ NO BRASIL']);
    worksheetData.push(['REGIONAL UBERLÂNDIA']);
    worksheetData.push([]);
    worksheetData.push([`Período: ${getPeriodText()}`]);
    worksheetData.push([]);
    worksheetData.push(['Data', 'Hora', 'Tipo', 'Congregação', 'Cidade', 'Ancião']);

    items.forEach(item => {
      worksheetData.push([
        format(item.date, 'dd/MM/yyyy'),
        item.time || '19:30',
        item.type,
        item.congregationName,
        item.city,
        item.responsavel || '-',
      ]);
    });

    // Adicionar avisos se houver
    if (avisos) {
      worksheetData.push([]);
      worksheetData.push([]);
      worksheetData.push(['AVISOS PARA IRMANDADE']);
      worksheetData.push([avisos]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Serviços');

    const filename = startDate && endDate 
      ? `lista-servicos-${format(new Date(startDate), 'yyyy-MM-dd')}_${format(new Date(endDate), 'yyyy-MM-dd')}.xlsx`
      : `lista-servicos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    XLSX.writeFile(workbook, filename);

    toast({
      title: 'Lista exportada!',
      description: 'O arquivo Excel foi gerado com sucesso.',
    });
  };

  const exportToPDF = () => {
    const items = getFilteredItems();

    if (items.length === 0) {
      toast({
        title: 'Nenhum item encontrado',
        description: 'Não há dados para exportar com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('REGIONAL UBERLÂNDIA', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getPeriodText(), 105, 28, { align: 'center' });

    // Agrupar por tipo
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);

    let currentY = 35;

    Object.entries(grouped).forEach(([eventType, eventItems], index) => {
      if (index > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Categoria
      doc.setFillColor(240, 240, 240);
      doc.rect(10, currentY, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(eventType.toUpperCase(), 105, currentY + 5, { align: 'center' });
      currentY += 10;

      // Tabela
      const tableData = eventItems.map(item => [
        format(item.date, "dd/MM EEE", { locale: ptBR }).replace(/\w+$/, (day) => day.substring(0, 3).toUpperCase()),
        item.time || '19:30',
        `${item.congregationName.toUpperCase()} (${item.city})`,
        item.responsavel?.toUpperCase() || '-',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['DATA', 'HORA', 'LOCALIDADE', 'ANCIÃO']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 90 },
          3: { cellWidth: 50 },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;
    });

    // Adicionar avisos se houver
    if (avisos) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 5;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, currentY, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('AVISOS PARA IRMANDADE', 105, currentY + 5, { align: 'center' });
      currentY += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitAvisos = doc.splitTextToSize(avisos, 180);
      doc.text(splitAvisos, 15, currentY);
    }

    const filename = startDate && endDate 
      ? `lista-servicos-${format(new Date(startDate), 'yyyy-MM-dd')}_${format(new Date(endDate), 'yyyy-MM-dd')}.pdf`
      : `lista-servicos-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    doc.save(filename);

    toast({
      title: 'Lista exportada!',
      description: 'O arquivo PDF foi gerado com sucesso.',
    });
  };

  const filteredItems = getFilteredItems();
  
  // Agrupar itens por tipo de evento
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  // Formatar período para exibição
  const getPeriodText = () => {
    if (!startDate && !endDate) return 'TODO O PERÍODO';
    if (startDate && endDate) {
      return `${format(new Date(startDate), 'dd/MM/yyyy')} A ${format(new Date(endDate), 'dd/MM/yyyy')}`;
    }
    if (startDate) return `A PARTIR DE ${format(new Date(startDate), 'dd/MM/yyyy')}`;
    if (endDate) return `ATÉ ${format(new Date(endDate), 'dd/MM/yyyy')}`;
    return '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Listas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e exporte listas de serviços e eventos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="batismo">Batismos</SelectItem>
                    <SelectItem value="santa-ceia">Santa Ceia</SelectItem>
                    <SelectItem value="ensaio-regional">Ensaios Regionais</SelectItem>
                    <SelectItem value="reforco-culto">Reforços - Cultos Oficiais</SelectItem>
                    <SelectItem value="reforco-rjm">Reforços - RJM</SelectItem>
                    <SelectItem value="eventos">Eventos Gerais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Congregação</Label>
                <Select value={filterCongregation} onValueChange={setFilterCongregation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {congregations.map(cong => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avisos para Irmandade</Label>
              <Textarea
                placeholder="Digite os avisos que serão exibidos no final da lista..."
                value={avisos}
                onChange={(e) => setAvisos(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                {showPreview ? 'Ocultar' : 'Mostrar'} Preview
              </Button>
              <Button onClick={exportToExcel} disabled={loading} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={exportToPDF} disabled={loading} variant="secondary" className="gap-2">
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Preview da Lista
                </span>
                <Badge variant="secondary">{filteredItems.length} itens</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum item encontrado com os filtros selecionados
                </p>
              ) : (
                <div className="space-y-8">
                  {/* Cabeçalho */}
                  <div className="text-center space-y-2 border-b pb-4">
                    <h2 className="text-xl font-bold">CONGREGAÇÃO CRISTÃ NO BRASIL</h2>
                    <p className="text-sm font-semibold">REGIONAL UBERLÂNDIA - {getPeriodText()}</p>
                    <p className="text-sm font-semibold">
                      {filterType === 'batismo' ? 'LISTA DE BATISMOS' :
                       filterType === 'santa-ceia' ? 'LISTA DE SANTA CEIA' :
                       filterType === 'ensaio-regional' ? 'LISTA DE ENSAIOS REGIONAIS' :
                       filterType === 'reforco-culto' ? 'LISTA DE REFORÇOS - CULTOS OFICIAIS' :
                       filterType === 'reforco-rjm' ? 'LISTA DE REFORÇOS - RJM' :
                       filterType === 'eventos' ? 'LISTA DE EVENTOS' :
                       'LISTA DE BATISMOS E DIVERSOS'}
                    </p>
                  </div>

                  {/* Itens agrupados por tipo */}
                  {Object.entries(groupedItems).map(([eventType, items]) => (
                    <div key={eventType} className="space-y-4">
                      {/* Categoria */}
                      <div className="bg-muted/30 p-2 font-bold text-center">
                        {eventType.toUpperCase()}
                      </div>

                      {/* Tabela */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left border font-semibold">DATA</th>
                              <th className="p-2 text-left border font-semibold">HORA</th>
                              <th className="p-2 text-left border font-semibold">LOCALIDADE</th>
                              <th className="p-2 text-left border font-semibold">ANCIÃO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                <td className="p-2 border">{format(item.date, "dd/MM 'SEX'", { locale: ptBR }).replace('SEX', format(item.date, 'EEEE', { locale: ptBR }).substring(0, 3).toUpperCase())}</td>
                                <td className="p-2 border">{item.time || '19:30'}</td>
                                <td className="p-2 border">{item.congregationName.toUpperCase()} ({item.city})</td>
                                <td className="p-2 border">{item.responsavel?.toUpperCase() || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Avisos para Irmandade */}
                  {avisos && (
                    <div className="mt-8 space-y-2">
                      <div className="bg-muted/30 p-2 font-bold text-center">
                        AVISOS PARA IRMANDADE
                      </div>
                      <div className="border p-4 whitespace-pre-wrap text-sm">
                        {avisos}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
