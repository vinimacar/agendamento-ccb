import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { musicianService } from '@/services/musicianService';
import { ensaioDataService } from '@/services/dataLancamentoService';
import type { Musician, EnsaioData } from '@/types';
import { Music, Plus, Trash2, Loader2, Search, Calendar, FileDown, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, startOfYear, endOfYear, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const INSTRUMENTS = [
  'Clarinete',
  'Clarone',
  'Sax Soprano',
  'Sax Alto',
  'Sax Tenor',
  'Sax Barítono',
  'Trompete',
  'Flugelhorn',
  'Eufônio',
  'Trombone',
  'Trombonito',
  'Tuba',
  'Viola',
  'Violino',
  'Cello',
  'Órgão',
];

const STAGES = ['Ensaio', 'RJM', 'Culto Oficial', 'Oficialização'] as const;

export default function Musical() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();

  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loadingMusicians, setLoadingMusicians] = useState(false);
  const [savingMusician, setSavingMusician] = useState(false);

  // Formulário
  const [name, setName] = useState('');
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState('');
  const [stage, setStage] = useState<typeof STAGES[number]>('Ensaio');

  // Filtros
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterCongregation, setFilterCongregation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [musicianToDelete, setMusicianToDelete] = useState<{ id: string; name: string } | null>(null);

  // Calendário e filtros
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [ensaios, setEnsaios] = useState<EnsaioData[]>([]);
  const [loadingEnsaios, setLoadingEnsaios] = useState(false);
  const [filterCalendarCongregation, setFilterCalendarCongregation] = useState('all');
  const [filterCalendarCity, setFilterCalendarCity] = useState('all');
  const [filterCalendarMonth, setFilterCalendarMonth] = useState('all');
  const [filterCalendarYear, setFilterCalendarYear] = useState(new Date().getFullYear().toString());

  const loadMusicians = useCallback(async () => {
    setLoadingMusicians(true);
    try {
      const data = await musicianService.getAll();
      setMusicians(data);
    } catch (error) {
      console.error('Error loading musicians:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os músicos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMusicians(false);
    }
  }, [toast]);

  const loadEnsaios = useCallback(async () => {
    setLoadingEnsaios(true);
    try {
      const data = await ensaioDataService.getAll();
      setEnsaios(data);
    } catch (error) {
      console.error('Error loading ensaios:', error);
      toast({
        title: 'Erro ao carregar ensaios',
        description: 'Não foi possível carregar os ensaios cadastrados.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnsaios(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMusicians();
  }, [loadMusicians]);

  // Carregar ensaios do Firebase
  useEffect(() => {
    loadEnsaios();
  }, [loadEnsaios]);

  // Atualizar cidade quando congregação é selecionada
  useEffect(() => {
    if (selectedCongregationId) {
      const congregation = congregations.find(c => c.id === selectedCongregationId);
      if (congregation) {
        setCity(congregation.city);
      }
    }
  }, [selectedCongregationId, congregations]);

  const handleAddMusician = async () => {
    if (!name || !selectedCongregationId || !city || !phone || !instrument || !stage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para cadastrar um músico.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = congregations.find(c => c.id === selectedCongregationId);
    if (!congregation) return;

    setSavingMusician(true);
    try {
      await musicianService.create({
        name,
        congregationId: selectedCongregationId,
        congregationName: congregation.name,
        city,
        phone,
        instrument,
        stage,
      });

      toast({
        title: 'Músico cadastrado!',
        description: `${name} foi cadastrado com sucesso.`,
      });

      // Limpar formulário
      setName('');
      setSelectedCongregationId('');
      setCity('');
      setPhone('');
      setInstrument('');
      setStage('Ensaio');

      loadMusicians();
    } catch (error) {
      console.error('Error adding musician:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o músico.',
        variant: 'destructive',
      });
    } finally {
      setSavingMusician(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setMusicianToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!musicianToDelete) return;

    try {
      await musicianService.delete(musicianToDelete.id);
      loadMusicians();
      toast({
        title: 'Músico removido',
        description: `${musicianToDelete.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting musician:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o músico.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMusicianToDelete(null);
    }
  };

  // Aplicar filtros
  const filteredMusicians = musicians.filter((musician) => {
    if (filterInstrument && musician.instrument !== filterInstrument) return false;
    if (filterStage && musician.stage !== filterStage) return false;
    if (filterCongregation && musician.congregationId !== filterCongregation) return false;
    if (searchTerm && !musician.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Agrupar por etapa
  const musiciansByStage = STAGES.reduce((acc, s) => {
    acc[s] = filteredMusicians.filter(m => m.stage === s);
    return acc;
  }, {} as Record<string, Musician[]>);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Ensaio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'RJM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Culto Oficial': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Oficialização': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Função para carregar ensaios do Firebase
  // Função para filtrar ensaios
  const getFilteredEnsaios = () => {
    let filtered = [...ensaios];

    // Filtro por ano
    if (filterCalendarYear) {
      const year = parseInt(filterCalendarYear);
      filtered = filtered.filter(e => getYear(e.date) === year);
    }

    // Filtro por congregação
    if (filterCalendarCongregation && filterCalendarCongregation !== 'all') {
      filtered = filtered.filter(e => e.congregationId === filterCalendarCongregation);
    }

    // Filtro por cidade
    if (filterCalendarCity && filterCalendarCity !== 'all') {
      filtered = filtered.filter(e => {
        const cong = congregations.find(c => c.id === e.congregationId);
        return cong?.city === filterCalendarCity;
      });
    }

    // Filtro por mês
    if (filterCalendarMonth && filterCalendarMonth !== 'all' && filterCalendarMonth !== 'annual') {
      const monthIndex = parseInt(filterCalendarMonth) - 1; // Ajustar para índice 0-based
      filtered = filtered.filter(e => getMonth(e.date) === monthIndex);
    }

    return filtered;
  };

  // Função para gerar calendário em Excel
  const exportToExcel = async () => {
    await loadEnsaios();
    const filteredEnsaios = getFilteredEnsaios();
    
    if (filteredEnsaios.length === 0) {
      toast({
        title: 'Nenhum ensaio encontrado',
        description: 'Não há ensaios cadastrados com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const worksheetData: (string | number)[][] = [];

    // Título e filtros aplicados
    worksheetData.push(['CALENDÁRIO DE ENSAIOS MUSICAIS']);
    worksheetData.push([]);
    
    const filters = [];
    if (filterCalendarCongregation) {
      const cong = congregations.find(c => c.id === filterCalendarCongregation);
      filters.push(`Congregação: ${cong?.name}`);
    }
    if (filterCalendarCity) {
      filters.push(`Cidade: ${filterCalendarCity}`);
    }
    if (filterCalendarMonth && filterCalendarMonth !== 'all' && filterCalendarMonth !== 'annual') {
      const monthName = format(new Date(2000, parseInt(filterCalendarMonth) - 1, 1), 'MMMM', { locale: ptBR });
      filters.push(`Mês: ${monthName}`);
    } else if (filterCalendarMonth === 'annual') {
      filters.push(`Período: Anual`);
    }
    filters.push(`Ano: ${filterCalendarYear}`);
    
    filters.forEach(f => worksheetData.push([f]));
    worksheetData.push([]);
    worksheetData.push(['Data', 'Congregação', 'Tipo', 'Cidade']);

    // Ordenar por data
    const sortedEnsaios = filteredEnsaios.sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedEnsaios.forEach(ensaio => {
      const congregation = congregations.find(c => c.id === ensaio.congregationId);
      worksheetData.push([
        format(ensaio.date, 'dd/MM/yyyy'),
        ensaio.congregationName,
        ensaio.type === 'regional' ? 'Regional' : 'Local',
        congregation?.city || '-',
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ensaios');

    const fileName = `calendario-ensaios-${filterCalendarYear}${filterCalendarMonth === 'annual' ? '-anual' : filterCalendarMonth && filterCalendarMonth !== 'all' ? `-${filterCalendarMonth.padStart(2, '0')}` : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo Excel foi gerado com sucesso.',
    });
    
    setCalendarDialogOpen(false);
  };

  // Função para gerar calendário em PDF
  const exportToPDF = async () => {
    await loadEnsaios();
    const filteredEnsaios = getFilteredEnsaios();
    
    if (filteredEnsaios.length === 0) {
      toast({
        title: 'Nenhum ensaio encontrado',
        description: 'Não há ensaios cadastrados com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    
    // Configurar fonte e cores
    doc.setFont('helvetica');
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text('Calendário de Ensaios Musicais', 105, 20, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    let yPos = 28;
    
    if (filterCalendarCongregation) {
      const cong = congregations.find(c => c.id === filterCalendarCongregation);
      doc.text(`Congregação: ${cong?.name}`, 105, yPos, { align: 'center' });
      yPos += 5;
    }
    if (filterCalendarCity) {
      doc.text(`Cidade: ${filterCalendarCity}`, 105, yPos, { align: 'center' });
      yPos += 5;
    }
    if (filterCalendarMonth && filterCalendarMonth !== 'all' && filterCalendarMonth !== 'annual') {
      const monthName = format(new Date(2000, parseInt(filterCalendarMonth) - 1, 1), 'MMMM', { locale: ptBR });
      doc.text(`Mês: ${monthName}`, 105, yPos, { align: 'center' });
      yPos += 5;
    } else if (filterCalendarMonth === 'annual') {
      doc.text(`Período: Anual`, 105, yPos, { align: 'center' });
      yPos += 5;
    }
    doc.text(`Ano: ${filterCalendarYear}`, 105, yPos, { align: 'center' });
    yPos += 5;
    
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, yPos, { align: 'center' });

    // Ordenar por data
    const sortedEnsaios = filteredEnsaios.sort((a, b) => a.date.getTime() - b.date.getTime());

    const tableData: string[][] = sortedEnsaios.map(ensaio => {
      const congregation = congregations.find(c => c.id === ensaio.congregationId);
      return [
        format(ensaio.date, 'dd/MM/yyyy'),
        ensaio.congregationName,
        ensaio.type === 'regional' ? 'Regional' : 'Local',
        congregation?.city || '-',
      ];
    });

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Data', 'Congregação', 'Tipo', 'Cidade']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      styles: {
        cellPadding: 4,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
    });

    const fileName = `calendario-ensaios-${filterCalendarYear}${filterCalendarMonth === 'annual' ? '-anual' : filterCalendarMonth && filterCalendarMonth !== 'all' ? `-${filterCalendarMonth.padStart(2, '0')}` : ''}.pdf`;
    doc.save(fileName);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo PDF foi gerado com sucesso.',
    });
    
    setCalendarDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Musical</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie músicos e organistas da região
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              loadEnsaios();
              setCalendarDialogOpen(true);
            }}
          >
            <Calendar className="h-4 w-4" />
            Calendário de Ensaios
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário de cadastro */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Cadastrar Músico/Organista
              </CardTitle>
              <CardDescription>Adicione novos músicos da região</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="musician-name">Nome *</Label>
                <Input
                  id="musician-name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-congregation">Comum Congregação *</Label>
                <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                  <SelectTrigger id="musician-congregation">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-city">Cidade *</Label>
                <Input
                  id="musician-city"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-phone">Telefone *</Label>
                <Input
                  id="musician-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-instrument">Instrumento *</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger id="musician-instrument">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-stage">Etapa *</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as typeof STAGES[number])}>
                  <SelectTrigger id="musician-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddMusician}
                disabled={savingMusician}
                className="w-full"
              >
                {savingMusician ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de músicos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Músicos e Organistas
              </CardTitle>
              <CardDescription>
                Total: {filteredMusicians.length} músico{filteredMusicians.length !== 1 ? 's' : ''}
              </CardDescription>
              
              {/* Filtros */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterInstrument} onValueChange={setFilterInstrument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Instrumento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todos</SelectItem>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCongregation} onValueChange={setFilterCongregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas</SelectItem>
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMusicians ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMusicians.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum músico encontrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {STAGES.map((stageName) => {
                    const stageMusicians = musiciansByStage[stageName];
                    if (stageMusicians.length === 0) return null;

                    return (
                      <div key={stageName} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Badge className={getStageColor(stageName)}>
                            {stageName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({stageMusicians.length})
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {stageMusicians.map((musician) => (
                            <div
                              key={musician.id}
                              className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{musician.name}</h3>
                                  <Badge variant="outline">{musician.instrument}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {musician.congregationName} • {musician.city}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  📞 {musician.phone}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(musician.id!, musician.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar Filter Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Calendário de Ensaios</DialogTitle>
            <DialogDescription>
              {loadingEnsaios ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando ensaios...
                </span>
              ) : (
                <>
                  {ensaios.length} ensaio{ensaios.length !== 1 ? 's' : ''} encontrado{ensaios.length !== 1 ? 's' : ''} • Escolha os filtros para gerar o calendário
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Filtro de Congregação */}
            <div className="space-y-2">
              <Label>Congregação</Label>
              <Select
                value={filterCalendarCongregation}
                onValueChange={setFilterCalendarCongregation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {congregations.map((cong) => (
                    <SelectItem key={cong.id} value={cong.id!}>
                      {cong.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Cidade */}
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={filterCalendarCity}
                onValueChange={setFilterCalendarCity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Array.from(new Set(congregations.map(c => c.city)))
                    .sort()
                    .map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Mês */}
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={filterCalendarMonth}
                onValueChange={setFilterCalendarMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Próximos 3 meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Próximos 3 meses</SelectItem>
                  <SelectItem value="annual">Anual (12 meses)</SelectItem>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Ano */}
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={filterCalendarYear}
                onValueChange={setFilterCalendarYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
                  <SelectItem value={String(new Date().getFullYear() + 1)}>
                    {new Date().getFullYear() + 1}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview dos ensaios filtrados */}
          {!loadingEnsaios && ensaios.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">
                Ensaios que serão exportados ({getFilteredEnsaios().length})
              </Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {getFilteredEnsaios().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum ensaio encontrado com os filtros selecionados
                  </p>
                ) : (
                  getFilteredEnsaios()
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((ensaio, idx) => {
                      const cong = congregations.find(c => c.id === ensaio.congregationId);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <div className="flex-1">
                            <span className="font-medium">{format(ensaio.date, 'dd/MM/yyyy')}</span>
                            <span className="mx-2">•</span>
                            <span>{ensaio.congregationName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ensaio.type === 'regional' ? 'Regional' : 'Local'}
                            </Badge>
                            {cong && (
                              <span className="text-muted-foreground">{cong.city}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={exportToExcel}
              disabled={loadingEnsaios}
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={loadingEnsaios}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold">{musicianToDelete?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
