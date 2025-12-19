import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, Users, Calendar, TrendingUp, Filter, FileSpreadsheet, Upload, Plus, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { eventService } from '@/services/eventService';
import { congregationService } from '@/services/congregationService';
import { batismoDataService, santaCeiaDataService, ensaioDataService } from '@/services/dataLancamentoService';
const DataLancamentoDialog = lazy(() => import('@/components/data/DataLancamentoDialog').then(module => ({ default: module.DataLancamentoDialog })));
import { Event, BatismoData, SantaCeiaData, EnsaioData } from '@/types';

const COLORS = {
  primary: 'hsl(217, 91%, 40%)',
  secondary: 'hsl(38, 92%, 50%)',
  success: 'hsl(142, 76%, 36%)',
  accent: 'hsl(217, 91%, 55%)',
  batismo: 'hsl(217, 91%, 60%)',
  santaCeia: 'hsl(38, 92%, 55%)',
};

export default function Reports() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [congregations, setCongregations] = useState<any[]>([]);
  
  // Novos estados para dados lançados
  const [batismoData, setBatismoData] = useState<BatismoData[]>([]);
  const [santaCeiaData, setSantaCeiaData] = useState<SantaCeiaData[]>([]);
  const [ensaioData, setEnsaioData] = useState<EnsaioData[]>([]);
  const [showDataDialog, setShowDataDialog] = useState(false);
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedCongregation, setSelectedCongregation] = useState<string>('all');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [eventsData, congregationsData, batismoD, ceiaD, ensaioD] = await Promise.all([
        eventService.getAll(),
        congregationService.getAll(),
        batismoDataService.getAll(),
        santaCeiaDataService.getAll(),
        ensaioDataService.getAll(),
      ]);
      setEvents(eventsData);
      setCongregations(congregationsData);
      setBatismoData(batismoD);
      setSantaCeiaData(ceiaD);
      setEnsaioData(ensaioD);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos baseado nos filtros selecionados
  // Considera apenas eventos que já foram realizados (data anterior à data atual)
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      // Filtro de data: apenas eventos já realizados
      const isPastEvent = eventDate < today;
      
      const eventYear = new Date(event.date).getFullYear().toString();
      const yearMatch = selectedYear === 'all' || eventYear === selectedYear;
      const typeMatch = selectedEventType === 'all' || event.type === selectedEventType;
      const congregationMatch = selectedCongregation === 'all' || event.congregationId === selectedCongregation;
      
      return isPastEvent && yearMatch && typeMatch && congregationMatch;
    });
  }, [events, selectedYear, selectedEventType, selectedCongregation]);

  // Filtrar dados lançados
  const filteredBatismoData = useMemo(() => {
    return batismoData.filter(data => {
      const dataYear = new Date(data.date).getFullYear().toString();
      const yearMatch = selectedYear === 'all' || dataYear === selectedYear;
      const congregationMatch = selectedCongregation === 'all' || data.congregationId === selectedCongregation;
      return yearMatch && congregationMatch;
    });
  }, [batismoData, selectedYear, selectedCongregation]);

  const filteredSantaCeiaData = useMemo(() => {
    return santaCeiaData.filter(data => {
      const dataYear = new Date(data.date).getFullYear().toString();
      const yearMatch = selectedYear === 'all' || dataYear === selectedYear;
      const congregationMatch = selectedCongregation === 'all' || data.congregationId === selectedCongregation;
      return yearMatch && congregationMatch;
    });
  }, [santaCeiaData, selectedYear, selectedCongregation]);

  const filteredEnsaioData = useMemo(() => {
    return ensaioData.filter(data => {
      const dataYear = new Date(data.date).getFullYear().toString();
      const yearMatch = selectedYear === 'all' || dataYear === selectedYear;
      const congregationMatch = selectedCongregation === 'all' || data.congregationId === selectedCongregation;
      return yearMatch && congregationMatch;
    });
  }, [ensaioData, selectedYear, selectedCongregation]);

  // Estatísticas de dados lançados
  const batismoDataStats = useMemo(() => {
    const totalBatizados = filteredBatismoData.reduce((sum, d) => sum + d.irmaos + d.irmas, 0);
    const totalHomens = filteredBatismoData.reduce((sum, d) => sum + d.irmaos, 0);
    const totalMulheres = filteredBatismoData.reduce((sum, d) => sum + d.irmas, 0);
    return {
      total: filteredBatismoData.length,
      totalBatizados,
      totalHomens,
      totalMulheres,
    };
  }, [filteredBatismoData]);

  const santaCeiaDataStats = useMemo(() => {
    const totalParticipantes = filteredSantaCeiaData.reduce((sum, d) => sum + d.irmaos + d.irmas, 0);
    const totalIrmaos = filteredSantaCeiaData.reduce((sum, d) => sum + d.irmaos, 0);
    const totalIrmas = filteredSantaCeiaData.reduce((sum, d) => sum + d.irmas, 0);
    return {
      total: filteredSantaCeiaData.length,
      totalParticipantes,
      totalIrmaos,
      totalIrmas,
    };
  }, [filteredSantaCeiaData]);

  const ensaioDataStats = useMemo(() => {
    const totalRegionais = filteredEnsaioData.filter(e => e.type === 'regional').length;
    const totalLocais = filteredEnsaioData.filter(e => e.type === 'local').length;
    
    const totalMadeiras = filteredEnsaioData.reduce((sum, e) => {
      const inst = e.instruments;
      return sum + (inst.clarinete || 0) + (inst.clarone || 0) + 
             (inst.saxSoprano || 0) + (inst.saxAlto || 0) + 
             (inst.saxTenor || 0) + (inst.saxBaritono || 0);
    }, 0);
    
    const totalMetais = filteredEnsaioData.reduce((sum, e) => {
      const inst = e.instruments;
      return sum + (inst.trompete || 0) + (inst.flugelhorn || 0) + 
             (inst.euphonio || 0) + (inst.trombone || 0) + 
             (inst.trombonito || 0) + (inst.tuba || 0);
    }, 0);
    
    const totalCordas = filteredEnsaioData.reduce((sum, e) => {
      const inst = e.instruments;
      return sum + (inst.violino || 0) + (inst.viola || 0) + (inst.cello || 0);
    }, 0);
    
    const totalOrganistas = filteredEnsaioData.reduce((sum, e) => sum + (e.instruments.organista || 0), 0);
    const totalMusicos = totalMadeiras + totalMetais + totalCordas + totalOrganistas;
    
    return {
      total: filteredEnsaioData.length,
      totalRegionais,
      totalLocais,
      totalMadeiras,
      totalMetais,
      totalCordas,
      totalOrganistas,
      totalMusicos,
    };
  }, [filteredEnsaioData]);

  // Estatísticas de Batismo
  const batismoStats = useMemo(() => {
    const batismos = filteredEvents.filter(e => e.type === 'batismo');
    const totalBatizandos = batismos.reduce((sum, e) => sum + (e.irmaos || 0) + (e.irmas || 0), 0);
    const totalHomens = batismos.reduce((sum, e) => sum + (e.irmaos || 0), 0);
    const totalMulheres = batismos.reduce((sum, e) => sum + (e.irmas || 0), 0);
    const media = batismos.length > 0 ? (totalBatizandos / batismos.length).toFixed(1) : '0';

    return {
      total: batismos.length,
      totalBatizandos,
      totalHomens,
      totalMulheres,
      media,
    };
  }, [filteredEvents]);

  // Estatísticas de Santa Ceia
  const santaCeiaStats = useMemo(() => {
    const santasCeias = filteredEvents.filter(e => e.type === 'santa-ceia');
    const totalParticipantes = santasCeias.reduce((sum, e) => sum + (e.irmaos || 0) + (e.irmas || 0), 0);
    const totalIrmaos = santasCeias.reduce((sum, e) => sum + (e.irmaos || 0), 0);
    const totalIrmas = santasCeias.reduce((sum, e) => sum + (e.irmas || 0), 0);
    const media = santasCeias.length > 0 ? (totalParticipantes / santasCeias.length).toFixed(1) : '0';

    return {
      total: santasCeias.length,
      totalParticipantes,
      totalIrmaos,
      totalIrmas,
      media,
    };
  }, [filteredEvents]);

  // Dados mensais de Batismo e Santa Ceia
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthCounts = filteredEvents.reduce((acc: any, event) => {
      const month = new Date(event.date).getMonth();
      const monthName = monthNames[month];
      if (!acc[monthName]) {
        acc[monthName] = { 
          month: monthName, 
          batizandos: 0, 
          participantesCeia: 0,
          batismos: 0,
          santasCeias: 0,
        };
      }
      if (event.type === 'batismo') {
        acc[monthName].batizandos += (event.irmaos || 0) + (event.irmas || 0);
        acc[monthName].batismos += 1;
      }
      if (event.type === 'santa-ceia') {
        acc[monthName].participantesCeia += (event.irmaos || 0) + (event.irmas || 0);
        acc[monthName].santasCeias += 1;
      }
      return acc;
    }, {});

    return monthNames.map(month => monthCounts[month] || { 
      month, 
      batizandos: 0, 
      participantesCeia: 0,
      batismos: 0,
      santasCeias: 0,
    });
  }, [filteredEvents]);

  // Distribuição por gênero - Batismo
  const batismoGenderData = useMemo(() => {
    return [
      { name: 'Homens', value: batismoStats.totalHomens, fill: COLORS.batismo },
      { name: 'Mulheres', value: batismoStats.totalMulheres, fill: COLORS.secondary },
    ];
  }, [batismoStats]);

  // Distribuição por gênero - Santa Ceia
  const santaCeiaGenderData = useMemo(() => {
    return [
      { name: 'Irmãos', value: santaCeiaStats.totalIrmaos, fill: COLORS.santaCeia },
      { name: 'Irmãs', value: santaCeiaStats.totalIrmas, fill: COLORS.success },
    ];
  }, [santaCeiaStats]);

  // Eventos por congregação
  const congregationData = useMemo(() => {
    const congCounts = filteredEvents.reduce((acc: any, event) => {
      if (event.congregationName) {
        if (!acc[event.congregationName]) {
          acc[event.congregationName] = { batismos: 0, santasCeias: 0 };
        }
        if (event.type === 'batismo') acc[event.congregationName].batismos += 1;
        if (event.type === 'santa-ceia') acc[event.congregationName].santasCeias += 1;
      }
      return acc;
    }, {});

    return Object.entries(congCounts)
      .map(([name, data]: [string, any]) => ({
        name,
        batismos: data.batismos,
        santasCeias: data.santasCeias,
      }))
      .sort((a, b) => (b.batismos + b.santasCeias) - (a.batismos + a.santasCeias))
      .slice(0, 8);
  }, [filteredEvents]);

  // Anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set(events.map(e => new Date(e.date).getFullYear().toString()));
    return ['all', ...Array.from(years).sort().reverse()];
  }, [events]);

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Batismos e Santa Ceia', 14, 20);
    
    // Filtros aplicados
    doc.setFontSize(10);
    const filterText = `Ano: ${selectedYear === 'all' ? 'Todos' : selectedYear} | Tipo: ${selectedEventType === 'all' ? 'Todos' : selectedEventType} | Congregação: ${selectedCongregation === 'all' ? 'Todas' : congregations.find(c => c.id === selectedCongregation)?.name || 'Todas'}`;
    doc.text(filterText, 14, 28);
    
    // Estatísticas de Batismo
    doc.setFontSize(14);
    doc.text('Batismos', 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Eventos', batismoStats.total.toString()],
        ['Total de Batizandos', batismoStats.totalBatizandos.toString()],
        ['Homens', batismoStats.totalHomens.toString()],
        ['Mulheres', batismoStats.totalMulheres.toString()],
        ['Média por Evento', batismoStats.media],
      ],
    });
    
    // Estatísticas de Santa Ceia
    const finalY = (doc as any).lastAutoTable.finalY || 42;
    doc.setFontSize(14);
    doc.text('Santa Ceia', 14, finalY + 10);
    autoTable(doc, {
      startY: finalY + 14,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Eventos', santaCeiaStats.total.toString()],
        ['Total de Participantes', santaCeiaStats.totalParticipantes.toString()],
        ['Irmãos', santaCeiaStats.totalIrmaos.toString()],
        ['Irmãs', santaCeiaStats.totalIrmas.toString()],
        ['Média por Evento', santaCeiaStats.media],
      ],
    });
    
    // Salvar PDF
    const fileName = `relatorio-${selectedYear}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF exportado!',
      description: 'O relatório foi baixado com sucesso.',
    });
  };

  // Exportar para Excel
  const exportToExcel = () => {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Aba de Resumo
    const summaryData = [
      ['Relatório de Batismos e Santa Ceia'],
      [''],
      ['Filtros Aplicados:'],
      ['Ano:', selectedYear === 'all' ? 'Todos' : selectedYear],
      ['Tipo:', selectedEventType === 'all' ? 'Todos' : selectedEventType],
      ['Congregação:', selectedCongregation === 'all' ? 'Todas' : congregations.find(c => c.id === selectedCongregation)?.name || 'Todas'],
      [''],
      ['BATISMOS'],
      ['Métrica', 'Valor'],
      ['Total de Eventos', batismoStats.total],
      ['Total de Batizandos', batismoStats.totalBatizandos],
      ['Homens', batismoStats.totalHomens],
      ['Mulheres', batismoStats.totalMulheres],
      ['Média por Evento', batismoStats.media],
      [''],
      ['SANTA CEIA'],
      ['Métrica', 'Valor'],
      ['Total de Eventos', santaCeiaStats.total],
      ['Total de Participantes', santaCeiaStats.totalParticipantes],
      ['Irmãos', santaCeiaStats.totalIrmaos],
      ['Irmãs', santaCeiaStats.totalIrmas],
      ['Média por Evento', santaCeiaStats.media],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Aba de Dados Mensais
    const monthlyExportData = monthlyData.map(item => ({
      'Mês': item.month,
      'Batizandos': item.batizandos,
      'Participantes Ceia': item.participantesCeia,
      'Eventos Batismo': item.batismos,
      'Eventos Santa Ceia': item.santasCeias,
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyExportData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Dados Mensais');
    
    // Aba de Congregações
    if (congregationData.length > 0) {
      const congExportData = congregationData.map(item => ({
        'Congregação': item.name,
        'Batismos': item.batismos,
        'Santa Ceia': item.santasCeias,
        'Total': item.batismos + item.santasCeias,
      }));
      const wsCong = XLSX.utils.json_to_sheet(congExportData);
      XLSX.utils.book_append_sheet(wb, wsCong, 'Por Congregação');
    }

    // Aba de Detalhamento (para importação/referência)
    const detailedData = filteredEvents
      .filter(e => e.type === 'batismo' || e.type === 'santa-ceia')
      .map(event => ({
        'Tipo': event.type === 'batismo' ? 'Batismo' : 'Santa-Ceia',
        'Título': event.title,
        'Data': new Date(event.date).toLocaleDateString('pt-BR'),
        'Hora': event.time,
        'Cidade': event.congregationName || '',
        'Oficiante': event.elderName || '',
        'Irmãos': event.irmaos || 0,
        'Irmãs': event.irmas || 0,
        'Observações': event.description || '',
      }));
    
    if (detailedData.length > 0) {
      const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detalhamento');
    }
    
    // Salvar arquivo
    const fileName = `relatorio-${selectedYear}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: 'Excel exportado!',
      description: 'O relatório foi baixado com sucesso.',
    });
  };

  // Importar dados de Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Ler primeira aba
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Converter para JSON
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast({
            title: 'Arquivo vazio',
            description: 'O arquivo não contém dados para importar.',
            variant: 'destructive',
          });
          return;
        }

        // Processar e importar eventos
        let importedCount = 0;
        let errorCount = 0;

        for (const row of data) {
          try {
            // Mapear colunas do Excel para campos do evento
            // Esperado: Tipo, Título, Data, Hora, Cidade, Oficiante, Irmãos, Irmãs
            const eventType = String(row['Tipo'] || '').toLowerCase().trim();
            
            // Validar tipo de evento (apenas batismo e santa-ceia)
            if (eventType !== 'batismo' && eventType !== 'santa-ceia') {
              continue; // Pular linhas que não são batismo ou santa ceia
            }

            // Validar campos obrigatórios
            if (!row['Data'] || !row['Cidade']) {
              errorCount++;
              continue;
            }

            // Processar data
            let eventDate: Date;
            if (typeof row['Data'] === 'number') {
              // Excel date format (número de dias desde 1900)
              eventDate = XLSX.SSF.parse_date_code(row['Data']);
              eventDate = new Date(eventDate.y, eventDate.m - 1, eventDate.d);
            } else {
              // Tentar parsear como string (DD/MM/YYYY ou similar)
              const dateStr = String(row['Data']);
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                eventDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              } else {
                eventDate = new Date(dateStr);
              }
            }

            if (isNaN(eventDate.getTime())) {
              errorCount++;
              continue;
            }

            // Encontrar congregação pela cidade
            const city = String(row['Cidade']).trim();
            const congregation = congregations.find(c => 
              c.city.toLowerCase() === city.toLowerCase()
            );

            // Criar evento
            const eventData: any = {
              title: String(row['Título'] || `${eventType === 'batismo' ? 'Batismo' : 'Santa Ceia'} - ${city}`),
              type: eventType === 'batismo' ? 'batismo' : 'santa-ceia',
              date: eventDate,
              time: String(row['Hora'] || '19:30'),
              congregationId: congregation?.id,
              congregationName: congregation?.name || city,
              elderName: row['Oficiante'] ? String(row['Oficiante']).trim() : undefined,
              elderFromOtherLocation: !congregation, // Se não encontrou congregação, assume que é de outra localidade
              ministerRole: 'elder',
              irmaos: row['Irmãos'] ? parseInt(String(row['Irmãos'])) : 0,
              irmas: row['Irmãs'] ? parseInt(String(row['Irmãs'])) : 0,
              description: row['Observações'] ? String(row['Observações']) : undefined,
            };

            // Criar evento no Firebase
            await eventService.create(eventData);
            importedCount++;

          } catch (error) {
            console.error('Erro ao importar linha:', row, error);
            errorCount++;
          }
        }

        // Recarregar eventos
        const updatedEvents = await eventService.getAll();
        setEvents(updatedEvents);

        // Mostrar resultado
        if (importedCount > 0) {
          toast({
            title: 'Importação concluída!',
            description: `${importedCount} evento(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s) encontrado(s).` : ''}`,
          });
        } else {
          toast({
            title: 'Nenhum evento importado',
            description: errorCount > 0 ? `${errorCount} erro(s) encontrado(s). Verifique o formato do arquivo.` : 'Não foram encontrados eventos válidos para importar.',
            variant: 'destructive',
          });
        }
        
      } catch (error) {
        console.error('Erro ao importar:', error);
        toast({
          title: 'Erro na importação',
          description: 'Não foi possível ler o arquivo. Verifique o formato.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios e Estatísticas</h1>
            <p className="text-muted-foreground mt-1">Análise detalhada de Batismos e Santa Ceia</p>
          </div>
          
          <div className="flex gap-2">
            {/* Botão de Importação */}
            <Button 
              variant="outline" 
              className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Importar XLSX
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
            />
            
            {/* Botão Lançar Dados */}
            <Button
              onClick={() => setShowDataDialog(true)}
              className="gap-2 shadow-sm hover:shadow-md transition-all duration-200 gradient-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Lançar Dados
            </Button>

            {/* Menu de Exportação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar como Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Dialog de Lançamento de Dados */}
        <Suspense fallback={<div></div>}>
          <DataLancamentoDialog 
            open={showDataDialog} 
            onOpenChange={setShowDataDialog}
            onDataSaved={loadReportsData}
          />
        </Suspense>

        {/* Filters */}
        <Card className="shadow-md border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year-filter">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {availableYears.filter(y => y !== 'all').map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Tipo de Evento</Label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="batismo">Batismo</SelectItem>
                    <SelectItem value="santa-ceia">Santa Ceia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation-filter">Congregação</Label>
                <Select value={selectedCongregation} onValueChange={setSelectedCongregation}>
                  <SelectTrigger id="congregation-filter">
                    <SelectValue placeholder="Selecione a congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as congregações</SelectItem>
                    {congregations.map(cong => (
                      <SelectItem key={cong.id} value={cong.id}>
                        {cong.name} - {cong.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Batismos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{batismoStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {batismoStats.totalBatizandos} batizandos no total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Média por Batismo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{batismoStats.media}</div>
              <p className="text-xs text-muted-foreground mt-1">pessoas por evento</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Santa Ceia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{santaCeiaStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {santaCeiaStats.totalParticipantes} participantes no total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Média por Santa Ceia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{santaCeiaStats.media}</div>
              <p className="text-xs text-muted-foreground mt-1">participantes por evento</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid - Gender Distribution */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Batismo Gender Chart */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Distribuição por Gênero - Batismo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={batismoGenderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                      }
                    >
                      {batismoGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Santa Ceia Gender Chart */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Distribuição por Gênero - Santa Ceia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={santaCeiaGenderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                      }
                    >
                      {santaCeiaGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Chart */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução Mensal de Batizandos e Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBatizandos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.batismo} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.batismo} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCeia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.santaCeia} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.santaCeia} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="batizandos"
                    name="Batizandos"
                    stroke={COLORS.batismo}
                    fillOpacity={1}
                    fill="url(#colorBatizandos)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="participantesCeia"
                    name="Participantes Santa Ceia"
                    stroke={COLORS.santaCeia}
                    fillOpacity={1}
                    fill="url(#colorCeia)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Events Count by Month */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Quantidade de Eventos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                  />
                  <Bar 
                    dataKey="batismos" 
                    name="Batismos"
                    fill={COLORS.batismo} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="santasCeias" 
                    name="Santa Ceia"
                    fill={COLORS.santaCeia} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Congregation Comparison */}
        {congregationData.length > 0 && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle>Eventos por Congregação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={congregationData} 
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 150, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      width={140}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                    />
                    <Bar dataKey="batismos" name="Batismos" fill={COLORS.batismo} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="santasCeias" name="Santa Ceia" fill={COLORS.santaCeia} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Details Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento de Batismos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">Total de Eventos</span>
                  <span className="text-xl font-bold text-primary">{batismoStats.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">Total de Batizandos</span>
                  <span className="text-xl font-bold text-primary">{batismoStats.totalBatizandos}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Homens</p>
                    <p className="text-2xl font-bold text-foreground">{batismoStats.totalHomens}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Mulheres</p>
                    <p className="text-2xl font-bold text-foreground">{batismoStats.totalMulheres}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium text-foreground">Média por Evento</span>
                  <span className="text-xl font-bold text-primary">{batismoStats.media}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento de Santa Ceia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">Total de Eventos</span>
                  <span className="text-xl font-bold text-primary">{santaCeiaStats.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">Total de Participantes</span>
                  <span className="text-xl font-bold text-primary">{santaCeiaStats.totalParticipantes}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Irmãos</p>
                    <p className="text-2xl font-bold text-foreground">{santaCeiaStats.totalIrmaos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Irmãs</p>
                    <p className="text-2xl font-bold text-foreground">{santaCeiaStats.totalIrmas}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium text-foreground">Média por Evento</span>
                  <span className="text-xl font-bold text-primary">{santaCeiaStats.media}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Ensaios - Dados Lançados */}
        {filteredEnsaioData.length > 0 && (
          <>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Music className="h-5 w-5 text-primary" />
                  Estatísticas de Ensaios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Total de Ensaios</p>
                    <p className="text-3xl font-bold text-foreground">{ensaioDataStats.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Ensaios Regionais</p>
                    <p className="text-3xl font-bold text-foreground">{ensaioDataStats.totalRegionais}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Ensaios Locais</p>
                    <p className="text-3xl font-bold text-foreground">{ensaioDataStats.totalLocais}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total de Músicos</p>
                    <p className="text-3xl font-bold text-foreground">{ensaioDataStats.totalMusicos}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Gráfico de Instrumentos por Categoria */}
                  <div className="h-80">
                    <h3 className="text-sm font-semibold mb-4">Distribuição por Categoria</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Madeiras', value: ensaioDataStats.totalMadeiras, fill: COLORS.primary },
                            { name: 'Metais', value: ensaioDataStats.totalMetais, fill: COLORS.secondary },
                            { name: 'Cordas', value: ensaioDataStats.totalCordas, fill: COLORS.success },
                            { name: 'Organistas', value: ensaioDataStats.totalOrganistas, fill: COLORS.accent },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value, percent }) => 
                            value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                          }
                        >
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detalhamento por Categoria */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold mb-4">Detalhamento por Categoria</h3>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Madeiras</span>
                        <span className="text-lg font-bold text-primary">{ensaioDataStats.totalMadeiras}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clarinete, Clarone, Sax Soprano, Sax Alto, Sax Tenor, Sax Barítono
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Metais</span>
                        <span className="text-lg font-bold text-secondary">{ensaioDataStats.totalMetais}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trompete, Flugelhorn, Euphonio, Trombone, Trombonito, Tuba
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cordas</span>
                        <span className="text-lg font-bold text-success">{ensaioDataStats.totalCordas}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Violino, Viola, Cello
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Organistas</span>
                        <span className="text-lg font-bold text-accent">{ensaioDataStats.totalOrganistas}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Cards de Dados Lançados - Batismo e Santa Ceia */}
        {(filteredBatismoData.length > 0 || filteredSantaCeiaData.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredBatismoData.length > 0 && (
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle className="text-lg">Dados Lançados - Batismo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-foreground">Total Registrados</span>
                      <span className="text-xl font-bold text-primary">{batismoDataStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-foreground">Total de Batizados</span>
                      <span className="text-xl font-bold text-primary">{batismoDataStats.totalBatizados}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Irmãos</p>
                        <p className="text-2xl font-bold text-foreground">{batismoDataStats.totalHomens}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Irmãs</p>
                        <p className="text-2xl font-bold text-foreground">{batismoDataStats.totalMulheres}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredSantaCeiaData.length > 0 && (
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle className="text-lg">Dados Lançados - Santa Ceia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-foreground">Total Registrados</span>
                      <span className="text-xl font-bold text-primary">{santaCeiaDataStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-foreground">Total de Participantes</span>
                      <span className="text-xl font-bold text-primary">{santaCeiaDataStats.totalParticipantes}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Irmãos</p>
                        <p className="text-2xl font-bold text-foreground">{santaCeiaDataStats.totalIrmaos}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Irmãs</p>
                        <p className="text-2xl font-bold text-foreground">{santaCeiaDataStats.totalIrmas}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
