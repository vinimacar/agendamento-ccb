import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import type { Musician } from '@/types';
import { Music, Plus, Trash2, Loader2, Search, Calendar, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, parseISO } from 'date-fns';
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

  useEffect(() => {
    loadMusicians();
  }, [loadMusicians]);

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

  // Função para coletar todos os ensaios de todas as congregações
  const getAllRehearsals = () => {
    const allRehearsals: Array<{
      congregation: string;
      type: string;
      day?: string;
      date?: Date;
      time: string;
      repeats: boolean;
    }> = [];

    congregations.forEach(congregation => {
      if (congregation.rehearsals && congregation.rehearsals.length > 0) {
        congregation.rehearsals.forEach(rehearsal => {
          allRehearsals.push({
            congregation: congregation.name,
            type: rehearsal.type,
            day: rehearsal.day,
            date: rehearsal.date,
            time: rehearsal.time,
            repeats: rehearsal.repeats,
          });
        });
      }
    });

    return allRehearsals;
  };

  // Função para gerar calendário em Excel
  const exportToExcel = () => {
    const rehearsals = getAllRehearsals();
    
    if (rehearsals.length === 0) {
      toast({
        title: 'Nenhum ensaio cadastrado',
        description: 'Cadastre ensaios nas congregações primeiro.',
        variant: 'destructive',
      });
      return;
    }

    // Criar dados para próximos 3 meses
    const months = [0, 1, 2].map(offset => addMonths(new Date(), offset));
    const worksheetData: (string | number)[][] = [];

    months.forEach(monthDate => {
      const monthName = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      worksheetData.push([monthName.toUpperCase()]);
      worksheetData.push(['Data', 'Dia', 'Congregação', 'Tipo', 'Horário']);

      const days = eachDayOfInterval({
        start: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
      });

      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      days.forEach(day => {
        const dayName = dayNames[getDay(day)];
        
        rehearsals.forEach(rehearsal => {
          let shouldShow = false;

          if (rehearsal.repeats && rehearsal.day === dayName) {
            shouldShow = true;
          } else if (rehearsal.date) {
            const rehearsalDate = new Date(rehearsal.date);
            if (
              rehearsalDate.getDate() === day.getDate() &&
              rehearsalDate.getMonth() === day.getMonth() &&
              rehearsalDate.getFullYear() === day.getFullYear()
            ) {
              shouldShow = true;
            }
          }

          if (shouldShow) {
            worksheetData.push([
              format(day, 'dd/MM/yyyy'),
              dayName,
              rehearsal.congregation,
              rehearsal.type,
              rehearsal.time,
            ]);
          }
        });
      });

      worksheetData.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendário de Ensaios');

    // Aplicar estilos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        
        if (worksheet[cellAddress].v && typeof worksheet[cellAddress].v === 'string') {
          if (worksheet[cellAddress].v.match(/^\w+ \d{4}$/)) {
            worksheet[cellAddress].s = { font: { bold: true, sz: 14 } };
          }
        }
      }
    }

    XLSX.writeFile(workbook, `calendario-ensaios-${format(new Date(), 'yyyy-MM')}.xlsx`);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo Excel foi gerado com sucesso.',
    });
  };

  // Função para gerar calendário em PDF
  const exportToPDF = () => {
    const rehearsals = getAllRehearsals();
    
    if (rehearsals.length === 0) {
      toast({
        title: 'Nenhum ensaio cadastrado',
        description: 'Cadastre ensaios nas congregações primeiro.',
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
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 28, { align: 'center' });

    let yPosition = 40;

    // Gerar para próximos 3 meses
    const months = [0, 1, 2].map(offset => addMonths(new Date(), offset));

    months.forEach((monthDate, monthIndex) => {
      if (monthIndex > 0) {
        doc.addPage();
        yPosition = 20;
      }

      const monthName = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      
      // Cabeçalho do mês
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      doc.text(monthName.toUpperCase(), 14, yPosition);
      yPosition += 10;

      const days = eachDayOfInterval({
        start: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
      });

      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const tableData: string[][] = [];

      days.forEach(day => {
        const dayName = dayNames[getDay(day)];
        
        rehearsals.forEach(rehearsal => {
          let shouldShow = false;

          if (rehearsal.repeats && rehearsal.day === dayName) {
            shouldShow = true;
          } else if (rehearsal.date) {
            const rehearsalDate = new Date(rehearsal.date);
            if (
              rehearsalDate.getDate() === day.getDate() &&
              rehearsalDate.getMonth() === day.getMonth() &&
              rehearsalDate.getFullYear() === day.getFullYear()
            ) {
              shouldShow = true;
            }
          }

          if (shouldShow) {
            tableData.push([
              format(day, 'dd/MM'),
              dayName,
              rehearsal.congregation,
              rehearsal.type,
              rehearsal.time,
            ]);
          }
        });
      });

      if (tableData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Data', 'Dia', 'Congregação', 'Tipo', 'Horário']],
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
          margin: { top: 10 },
          styles: {
            cellPadding: 4,
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
          },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Nenhum ensaio cadastrado para este mês.', 14, yPosition + 5);
      }
    });

    doc.save(`calendario-ensaios-${format(new Date(), 'yyyy-MM')}.pdf`);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo PDF foi gerado com sucesso.',
    });
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendário de Ensaios
                <FileDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar para Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar para PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
