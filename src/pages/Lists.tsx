import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  type: 'culto-oficial' | 'rjm';
  createdAt: Date;
  updatedAt: Date;
}

interface Event {
  id?: string;
  title: string;
  congregationId?: string;
  congregationName?: string;
  date: Date;
  type: string;
  description?: string;
}

interface ListItem {
  date: Date;
  type: string;
  congregationName: string;
  city: string;
  details?: string;
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
  
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterType, setFilterType] = useState('all');
  const [filterCongregation, setFilterCongregation] = useState('all');
  const [showPreview, setShowPreview] = useState(false);

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
      setEvents(eventsData as Event[]);
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
    const year = parseInt(filterYear);

    // Batismos
    if (filterType === 'all' || filterType === 'batismo') {
      batismos.forEach(batismo => {
        if (batismo.date.getFullYear() === year) {
          if (filterCongregation === 'all' || batismo.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === batismo.congregationId);
            items.push({
              date: batismo.date,
              type: 'Batismo',
              congregationName: batismo.congregationName,
              city: cong?.city || '-',
              details: `${batismo.irmaos + batismo.irmas} batizados`,
            });
          }
        }
      });
    }

    // Santa Ceia
    if (filterType === 'all' || filterType === 'santa-ceia') {
      santaCeias.forEach(ceia => {
        if (ceia.date.getFullYear() === year) {
          if (filterCongregation === 'all' || ceia.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === ceia.congregationId);
            items.push({
              date: ceia.date,
              type: 'Santa Ceia',
              congregationName: ceia.congregationName,
              city: cong?.city || '-',
              details: `${ceia.irmaos + ceia.irmas} participantes`,
            });
          }
        }
      });
    }

    // Ensaios Regionais
    if (filterType === 'all' || filterType === 'ensaio-regional') {
      ensaios.forEach(ensaio => {
        if (ensaio.date.getFullYear() === year && ensaio.type === 'regional') {
          if (filterCongregation === 'all' || ensaio.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === ensaio.congregationId);
            items.push({
              date: ensaio.date,
              type: 'Ensaio Regional',
              congregationName: ensaio.congregationName,
              city: cong?.city || '-',
            });
          }
        }
      });
    }

    // Reforços para Cultos Oficiais
    if (filterType === 'all' || filterType === 'reforco-culto') {
      reforcos.forEach(reforco => {
        if (reforco.date.getFullYear() === year && reforco.type === 'culto-oficial') {
          if (filterCongregation === 'all' || reforco.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === reforco.congregationId);
            items.push({
              date: reforco.date,
              type: 'Reforço - Culto Oficial',
              congregationName: reforco.congregationName,
              city: cong?.city || '-',
            });
          }
        }
      });
    }

    // Reforços para RJM
    if (filterType === 'all' || filterType === 'reforco-rjm') {
      reforcos.forEach(reforco => {
        if (reforco.date.getFullYear() === year && reforco.type === 'rjm') {
          if (filterCongregation === 'all' || reforco.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === reforco.congregationId);
            items.push({
              date: reforco.date,
              type: 'Reforço - RJM',
              congregationName: reforco.congregationName,
              city: cong?.city || '-',
            });
          }
        }
      });
    }

    // Eventos gerais
    if (filterType === 'all' || filterType === 'eventos') {
      events.forEach(event => {
        if (event.date.getFullYear() === year) {
          if (filterCongregation === 'all' || event.congregationId === filterCongregation) {
            const cong = congregations.find(c => c.id === event.congregationId);
            items.push({
              date: event.date,
              type: event.type,
              congregationName: event.congregationName || cong?.name || '-',
              city: cong?.city || '-',
              details: event.description,
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
    worksheetData.push(['LISTA DE SERVIÇOS E EVENTOS']);
    worksheetData.push([]);
    worksheetData.push([`Ano: ${filterYear}`]);
    worksheetData.push([]);
    worksheetData.push(['Data', 'Tipo', 'Congregação', 'Cidade', 'Detalhes']);

    items.forEach(item => {
      worksheetData.push([
        format(item.date, 'dd/MM/yyyy'),
        item.type,
        item.congregationName,
        item.city,
        item.details || '-',
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Serviços');

    XLSX.writeFile(workbook, `lista-servicos-${filterYear}.xlsx`);

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

    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text('Lista de Serviços e Eventos', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Ano: ${filterYear}`, 105, 28, { align: 'center' });
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 33, { align: 'center' });

    const tableData = items.map(item => [
      format(item.date, 'dd/MM/yyyy'),
      item.type,
      item.congregationName,
      item.city,
      item.details || '-',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Tipo', 'Congregação', 'Cidade', 'Detalhes']],
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
        cellPadding: 3,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
    });

    doc.save(`lista-servicos-${filterYear}.pdf`);

    toast({
      title: 'Lista exportada!',
      description: 'O arquivo PDF foi gerado com sucesso.',
    });
  };

  const filteredItems = getFilteredItems();

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(new Date().getFullYear() - 1)}>
                      {new Date().getFullYear() - 1}
                    </SelectItem>
                    <SelectItem value={String(new Date().getFullYear())}>
                      {new Date().getFullYear()}
                    </SelectItem>
                    <SelectItem value={String(new Date().getFullYear() + 1)}>
                      {new Date().getFullYear() + 1}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Congregação</th>
                        <th className="p-2 text-left">Cidade</th>
                        <th className="p-2 text-left">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2">{format(item.date, 'dd/MM/yyyy')}</td>
                          <td className="p-2">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="p-2">{item.congregationName}</td>
                          <td className="p-2">{item.city}</td>
                          <td className="p-2 text-muted-foreground">{item.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
