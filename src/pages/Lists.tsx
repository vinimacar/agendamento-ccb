import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { batismoDataService, santaCeiaDataService, ensaioDataService } from '@/services/dataLancamentoService';
import { reforcoService } from '@/services/reforcoService';
import { eventService } from '@/services/eventService';
import { savedListService } from '@/services/savedListService';
import type { BatismoData, SantaCeiaData, EnsaioData, Event as EventType, SavedList } from '@/types';
import { FileSpreadsheet, FileText, Eye, Loader2, Calendar, Filter, Save, FolderOpen, Trash2 } from 'lucide-react';
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
  eventTitle?: string; // Título do evento para reuniões
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
  
  // Listas salvas
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>({});
  const [avisosEnabled, setAvisosEnabled] = useState(true);

  useEffect(() => {
    loadAllData();
    loadSavedLists();
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

  const loadSavedLists = async () => {
    try {
      const lists = await savedListService.getAll();
      setSavedLists(lists);
    } catch (error) {
      console.error('Error loading saved lists:', error);
    }
  };

  const saveList = async () => {
    if (!listTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para a lista.',
        variant: 'destructive',
      });
      return;
    }

    const items = getFilteredItems();
    if (items.length === 0) {
      toast({
        title: 'Lista vazia',
        description: 'Não há itens para salvar com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await savedListService.create({
        title: listTitle,
        startDate,
        endDate,
        filterType,
        filterCongregation,
        avisos,
        items,
      });

      toast({
        title: 'Lista salva!',
        description: 'A lista foi salva com sucesso.',
      });

      setListTitle('');
      setSaveDialogOpen(false);
      loadSavedLists();
    } catch (error) {
      console.error('Error saving list:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a lista.',
        variant: 'destructive',
      });
    }
  };

  const loadList = (list: SavedList) => {
    setStartDate(list.startDate);
    setEndDate(list.endDate);
    setFilterType(list.filterType);
    setFilterCongregation(list.filterCongregation);
    setAvisos(list.avisos);
    setLoadDialogOpen(false);
    setShowPreview(true);

    toast({
      title: 'Lista carregada!',
      description: `Lista "${list.title}" foi carregada com sucesso.`,
    });
  };

  const deleteList = async (id: string) => {
    try {
      await savedListService.delete(id);
      toast({
        title: 'Lista excluída!',
        description: 'A lista foi excluída com sucesso.',
      });
      loadSavedLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a lista.',
        variant: 'destructive',
      });
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
            const anciaoResponsavel = batismo.elderFromOtherLocation && batismo.otherElderName 
              ? batismo.otherElderName 
              : batismo.elderName || cong?.admin || '-';
            items.push({
              date: batismo.date,
              time: '19:30',
              type: 'Batismo',
              congregationName: batismo.congregationName,
              city: cong?.city || '-',
              details: `${batismo.irmaos + batismo.irmas} batizados`,
              responsavel: anciaoResponsavel,
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
            const anciaoResponsavel = ceia.elderFromOtherLocation && ceia.otherElderName 
              ? ceia.otherElderName 
              : ceia.elderName || cong?.admin || '-';
            items.push({
              date: ceia.date,
              time: '19:30',
              type: 'Santa Ceia',
              congregationName: ceia.congregationName,
              city: cong?.city || '-',
              details: `${ceia.irmaos + ceia.irmas} participantes`,
              responsavel: anciaoResponsavel,
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
              responsavel: ensaio.anciao || ensaio.encarregadoRegional || cong?.admin || '-',
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
            const anciaoResponsavel = event.elderFromOtherLocation && event.otherElderName 
              ? event.otherElderName 
              : event.elderName || cong?.admin || '-';
            
            // Verificar se é reunião ou evento customizado - ambos usam eventTitle
            const isReuniao = event.type === 'reuniao-mocidade' || event.type === 'reuniao-ministerial';
            const isCustomEvent = event.type?.startsWith('custom-');
            
            // Remover prefixo "custom-" do tipo de evento para exibição
            const displayType = isCustomEvent 
              ? event.type.replace('custom-', '').split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              : event.type || 'Evento';
            
            items.push({
              date: event.date,
              time: event.time || '19:30',
              type: displayType,
              congregationName: event.congregationName || cong?.name || '-',
              city: cong?.city || '-',
              details: event.description || event.title,
              responsavel: anciaoResponsavel,
              eventTitle: (isReuniao || isCustomEvent) ? event.title : undefined, // Reuniões e eventos customizados mostram título
            });
          }
        }
      });
    }

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const exportToExcel = () => {
    const items = getFilteredItems().filter(item => enabledCategories[item.type] !== false);

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
    worksheetData.push(['ADMINISTRAÇÃO ITUIUTABA']);
    worksheetData.push([]);
    worksheetData.push([`Período: ${getPeriodText()}`]);
    worksheetData.push([]);
    
    // Verificar se tem eventos (com eventTitle) ou reforços
    const hasEvents = items.some(item => item.eventTitle);
    const hasReforcos = items.some(item => item.type.includes('Reforço'));
    const lastColumnHeader = hasEvents ? 'Tipo de Reunião' : hasReforcos ? 'Responsável' : 'Ancião';
    worksheetData.push(['Data', 'Hora', 'Tipo', 'Congregação', 'Cidade', lastColumnHeader]);

    items.forEach(item => {
      worksheetData.push([
        format(item.date, 'dd/MM/yyyy'),
        item.time || '19:30',
        item.type,
        item.congregationName,
        item.city,
        item.eventTitle ? item.eventTitle : (item.responsavel || '-'),
      ]);
    });

    // Adicionar avisos se houver e estiver habilitado
    if (avisos && avisosEnabled) {
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

  const exportToPDF = async () => {
    const items = getFilteredItems().filter(item => enabledCategories[item.type] !== false);

    if (items.length === 0) {
      toast({
        title: 'Nenhum item encontrado',
        description: 'Não há dados para exportar com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();

    // Adicionar logo da CCB no cabeçalho (contém "CONGREGAÇÃO CRISTÃ NO BRASIL")
    const logoUrl = '/ccb-logo.svg';
    const img = new Image();
    img.src = logoUrl;
    
    // Aguardar carregamento da imagem
    await new Promise((resolve) => {
      img.onload = () => {
        // Adicionar logo centralizada no topo (60mm de largura - reduzida)
        doc.addImage(img, 'SVG', 75, 3, 60, 21);
        resolve(true);
      };
      img.onerror = () => {
        // Se falhar ao carregar, adicionar texto alternativo
        console.warn('Erro ao carregar logo CCB');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', 105, 12, { align: 'center' });
        resolve(true);
      };
    });

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('LISTA DE BATISMOS E DIVERSOS', 105, 27, { align: 'center' });
    
    // Cabeçalho - administração e período
    doc.setFontSize(8);
    doc.text('ADMINISTRAÇÃO ITUIUTABA', 105, 32, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(getPeriodText(), 105, 36, { align: 'center' });

    // Agrupar por tipo
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);

    // Ordem específica dos tipos de evento (mesma do preview)
    const eventTypeOrder: Record<string, number> = {
      'Batismo': 1,
      'batismo': 1,
      'reuniao-mocidade': 2,
      'Santa Ceia': 3,
      'santa-ceia': 3,
      'Ensaio Regional': 4,
      'culto-oficial-reforco': 5,
      'rjm-reforco': 5,
      'Reforço - Culto Oficial': 5,
      'Reforço - RJM': 5,
      'culto-busca-dons': 6,
    };

    // Ordenar grupos pela mesma ordem do preview
    const sortedGrouped = Object.entries(grouped).sort(([typeA], [typeB]) => {
      const orderA = eventTypeOrder[typeA] || 999;
      const orderB = eventTypeOrder[typeB] || 999;
      return orderA - orderB;
    });

    let currentY = 40;

    sortedGrouped.forEach(([eventType, eventItems], index) => {
      if (index > 0 && currentY > 260) {
        doc.addPage();
        currentY = 15;
      }

      // Categoria (reduzida)
      doc.setFillColor(240, 240, 240);
      doc.rect(10, currentY, 190, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(eventType.toUpperCase(), 105, currentY + 4, { align: 'center' });
      currentY += 7;

      // Tabela
      const hasEventsInGroup = eventItems.some(item => item.eventTitle);
      const hasReforcosInGroup = eventType.includes('Reforço');
      const tableData = eventItems.map(item => {
        const dateStr = format(item.date, "dd/MM", { locale: ptBR });
        const dayOfWeek = format(item.date, "EEE", { locale: ptBR }).toUpperCase().substring(0, 3);
        return [
          `${dateStr} ${dayOfWeek}`,
          item.time || '19:30',
          `${item.congregationName.toUpperCase()} - ${item.city.toUpperCase()}`,
          item.eventTitle ? item.eventTitle.toUpperCase() : (item.responsavel?.toUpperCase() || '-'),
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [["DATA", "HORA", "LOCALIDADE", hasEventsInGroup ? "TIPO DE REUNIÃO" : hasReforcosInGroup ? "RESPONSÁVEL" : "ANCIÃO"]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          cellPadding: 1,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 18 },
          2: { cellWidth: 88 },
          3: { cellWidth: 56 },
        },
      });

      currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY + 50;
      currentY += 3;
    });

    // Adicionar avisos se houver e estiver habilitado
    if (avisos && avisosEnabled) {
      if (currentY > 260) {
        doc.addPage();
        currentY = 15;
      }

      currentY += 3;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, currentY, 190, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('AVISOS PARA IRMANDADE', 105, currentY + 4, { align: 'center' });
      currentY += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
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
  
  // Inicializar todas as categorias como habilitadas quando os itens mudam
  useEffect(() => {
    const categories: Record<string, boolean> = {};
    filteredItems.forEach(item => {
      if (!categories.hasOwnProperty(item.type)) {
        categories[item.type] = true; // Todas habilitadas por padrão
      }
    });
    setEnabledCategories(categories);
  }, [filteredItems.length, filterType, filterCongregation, startDate, endDate]);

  // Função para alternar categoria
  const toggleCategory = (category: string) => {
    setEnabledCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Ordem específica dos tipos de evento
  const eventTypeOrder: Record<string, number> = {
    'Batismo': 1,
    'batismo': 1,
    'reuniao-mocidade': 2,
    'Santa Ceia': 3,
    'santa-ceia': 3,
    'Ensaio Regional': 4,
    'culto-oficial-reforco': 5,
    'rjm-reforco': 5,
    'Reforço - Culto Oficial': 5,
    'Reforço - RJM': 5,
    'culto-busca-dons': 6,
  };
  
  // Agrupar itens por tipo de evento
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  // Ordenar grupos pela ordem definida
  const sortedGroupedItems = Object.entries(groupedItems).sort(([typeA], [typeB]) => {
    const orderA = eventTypeOrder[typeA] || 999;
    const orderB = eventTypeOrder[typeB] || 999;
    return orderA - orderB;
  });

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
              
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Lista
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Salvar Lista</DialogTitle>
                    <DialogDescription>
                      Digite um título para identificar esta lista
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Título da Lista</Label>
                    <Input
                      placeholder="Ex: Batismos Dezembro 2025"
                      value={listTitle}
                      onChange={(e) => setListTitle(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveList}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Carregar Lista
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Listas Salvas</DialogTitle>
                    <DialogDescription>
                      Selecione uma lista para carregar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {savedLists.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhuma lista salva
                      </p>
                    ) : (
                      savedLists.map(list => (
                        <div key={list.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">{list.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(list.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })} • {list.items.length} itens
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => loadList(list)}>
                              Carregar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => list.id && deleteList(list.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

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
                <div className="space-y-3">
                  <style>{`
                    @media print {
                      * { 
                        font-size: 9px !important;
                        line-height: 1.2 !important;
                      }
                      h2 { font-size: 13px !important; }
                      .text-xl { font-size: 13px !important; }
                      .text-sm { font-size: 8px !important; }
                      table { font-size: 8px !important; }
                      th, td { 
                        padding: 2px 4px !important;
                        line-height: 1.1 !important;
                      }
                      .space-y-3 > * + * { margin-top: 6px !important; }
                      .space-y-1 > * + * { margin-top: 2px !important; }
                      .compact-p { padding: 2px 4px !important; }
                      .compact-header { padding: 3px 6px !important; }
                      .pb-2 { padding-bottom: 4px !important; }
                      .mt-4 { margin-top: 8px !important; }
                    }
                  `}</style>
                  {/* Cabeçalho */}
                  <div className="text-center space-y-1 border-b pb-2">
                    <h2 className="text-base font-bold">CONGREGAÇÃO CRISTÃ NO BRASIL</h2>
                    <p className="text-xs font-semibold">ADMINISTRAÇÃO ITUIUTABA - {getPeriodText()}</p>
                    <p className="text-xs font-semibold">
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
                  {sortedGroupedItems.map(([eventType, items]) => {
                    const isEnabled = enabledCategories[eventType] !== false; // Default true se não definido
                    
                    return (
                      <div key={eventType} className="space-y-1">
                        {/* Categoria com toggle clicável */}
                        <div 
                          className="relative bg-gray-400 compact-header py-1.5 px-2 font-bold text-center text-white rounded-sm text-xs cursor-pointer hover:bg-gray-500 transition-colors"
                          onClick={() => toggleCategory(eventType)}
                        >
                          {eventType.toUpperCase()}
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${
                            isEnabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                              isEnabled ? 'ml-auto' : 'mr-auto'
                            }`}></div>
                          </div>
                        </div>

                        {/* Tabela - só mostra se habilitado */}
                        {isEnabled && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="compact-p py-1 px-2 text-left border border-gray-300 font-bold">DATA</th>
                                  <th className="compact-p py-1 px-2 text-left border border-gray-300 font-bold">HORA</th>
                                  <th className="compact-p py-1 px-2 text-left border border-gray-300 font-bold">LOCALIDADE</th>
                                  <th className="compact-p py-1 px-2 text-left border border-gray-300 font-bold">
                                    {items[0]?.eventTitle ? 'TIPO DE REUNIÃO' : 
                                     eventType.includes('Reforço') ? 'RESPONSÁVEL' : 'ANCIÃO'}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => {
                                  const dateStr = format(item.date, "dd/MM", { locale: ptBR });
                                  const dayOfWeek = format(item.date, "EEE", { locale: ptBR }).toUpperCase().substring(0, 3);
                                  return (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="compact-p py-1 px-2 border border-gray-300">{dateStr} {dayOfWeek}</td>
                                      <td className="compact-p py-1 px-2 border border-gray-300">{item.time || '19:30'}</td>
                                      <td className="compact-p py-1 px-2 border border-gray-300">{item.congregationName.toUpperCase()} - {item.city.toUpperCase()}</td>
                                      <td className="compact-p py-1 px-2 border border-gray-300">
                                        {item.eventTitle ? item.eventTitle.toUpperCase() : (item.responsavel?.toUpperCase() || '-')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Avisos para Irmandade */}
                  {avisos && (
                    <div className="mt-4 space-y-1">
                      <div 
                        className="relative bg-gray-400 compact-header py-1.5 px-2 font-bold text-center text-white rounded-sm text-xs cursor-pointer hover:bg-gray-500 transition-colors"
                        onClick={() => setAvisosEnabled(!avisosEnabled)}
                      >
                        AVISOS PARA IRMANDADE
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${
                          avisosEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                            avisosEnabled ? 'ml-auto' : 'mr-auto'
                          }`}></div>
                        </div>
                      </div>
                      {avisosEnabled && (
                        <div className="border border-gray-300 p-2 whitespace-pre-wrap text-xs bg-white leading-tight">
                          {avisos}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rodapé com data e horário de encerramento */}
                  <div className="mt-4 pt-2 border-t text-center">
                    <p className="text-xs text-gray-500">
                      Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
