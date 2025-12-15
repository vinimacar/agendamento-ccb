import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { batismoDataService, santaCeiaDataService, ensaioDataService } from '@/services/dataLancamentoService';
import { eventService } from '@/services/eventService';
import type { InstrumentCounts, Event, Congregation } from '@/types';
import { Loader2, Plus, Music, Users2, Droplet, Printer } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface DataLancamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataSaved: () => void;
}

export function DataLancamentoDialog({ open, onOpenChange, onDataSaved }: DataLancamentoDialogProps) {
  const { toast } = useToast();
  const { congregations } = useCongregations();
  const [activeTab, setActiveTab] = useState('batismo');
  const [saving, setSaving] = useState(false);

  // Estados para Batismo
  const [batismoCongregationId, setBatismoCongregationId] = useState('');
  const [batismoDate, setBatismoDate] = useState('');
  const [batismoIrmaos, setBatismoIrmaos] = useState('0');
  const [batismoIrmas, setBatismoIrmas] = useState('0');
  const [batismoElderName, setBatismoElderName] = useState('');
  const [batismoElderFromOther, setBatismoElderFromOther] = useState(false);
  const [batismoOtherElderName, setBatismoOtherElderName] = useState('');
  const [batismoTipo, setBatismoTipo] = useState<'extra' | 'darpe' | 'agendado'>('extra');
  const [scheduledBatismos, setScheduledBatismos] = useState<Event[]>([]);
  const [selectedBatismoEvent, setSelectedBatismoEvent] = useState<string>('');

  // Estados para Santa Ceia
  const [ceiaCongregationId, setCeiaCongregationId] = useState('');
  const [ceiaDate, setCeiaDate] = useState('');
  const [ceiaIrmaos, setCeiaIrmaos] = useState('0');
  const [ceiaIrmas, setCeiaIrmas] = useState('0');
  const [ceiaElderName, setCeiaElderName] = useState('');
  const [ceiaElderFromOther, setCeiaElderFromOther] = useState(false);
  const [ceiaOtherElderName, setCeiaOtherElderName] = useState('');

  // Estados para Ensaio
  const [ensaioCongregationId, setEnsaioCongregationId] = useState('');
  const [ensaioDate, setEnsaioDate] = useState('');
  const [ensaioType, setEnsaioType] = useState<'regional' | 'local'>('local');
  const [ensaioAnciao, setEnsaioAnciao] = useState('');
  const [ensaioEncarregadoRegional, setEnsaioEncarregadoRegional] = useState('');
  const [instruments, setInstruments] = useState<InstrumentCounts>({
    clarinete: 0,
    clarone: 0,
    saxSoprano: 0,
    saxAlto: 0,
    saxTenor: 0,
    saxBaritono: 0,
    trompete: 0,
    flugelhorn: 0,
    euphonio: 0,
    trombone: 0,
    trombonito: 0,
    tuba: 0,
    viola: 0,
    violino: 0,
    cello: 0,
    organista: 0,
  });

  // Estados para lista de anciãos
  const [availableElders, setAvailableElders] = useState<string[]>([]);
  
  // Estados para dados salvos (para impressão)
  const [lastSavedData, setLastSavedData] = useState<{
    type: 'batismo' | 'santa-ceia' | null;
    congregation: Congregation | undefined;
    data: Record<string, unknown> | null;
  }>({ type: null, congregation: undefined, data: null });

  const resetForms = () => {
    setBatismoCongregationId('');
    setBatismoDate('');
    setBatismoIrmaos('0');
    setBatismoIrmas('0');
    setBatismoElderName('');
    setBatismoElderFromOther(false);
    setBatismoOtherElderName('');
    setBatismoTipo('extra');
    setSelectedBatismoEvent('');
    
    setCeiaCongregationId('');
    setCeiaDate('');
    setCeiaIrmaos('0');
    setCeiaIrmas('0');
    setCeiaElderName('');
    setCeiaElderFromOther(false);
    setCeiaOtherElderName('');
    
    setEnsaioCongregationId('');
    setEnsaioDate('');
    setEnsaioType('local');
    setEnsaioAnciao('');
    setEnsaioEncarregadoRegional('');
    setInstruments({
      clarinete: 0,
      clarone: 0,
      saxSoprano: 0,
      saxAlto: 0,
      saxTenor: 0,
      saxBaritono: 0,
      trompete: 0,
      flugelhorn: 0,
      euphonio: 0,
      trombone: 0,
      trombonito: 0,
      tuba: 0,
      viola: 0,
      violino: 0,
      cello: 0,
      organista: 0,
    });
  };

  const loadAvailableElders = useCallback(() => {
    const eldersSet = new Set<string>();
    congregations.forEach(cong => {
      // Buscar ancionãos locais (elders pode ser string[] ou PersonEntry[])
      if (cong.elders && Array.isArray(cong.elders)) {
        cong.elders.forEach((elder: unknown) => {
          if (typeof elder === 'string') {
            eldersSet.add(elder);
          } else if (elder && typeof elder === 'object' && 'name' in elder) {
            const elderObj = elder as { name: string };
            eldersSet.add(elderObj.name);
          }
        });
      }
    });
    setAvailableElders(Array.from(eldersSet).sort());
  }, [congregations]);

  const loadScheduledBatismos = async () => {
    try {
      const events = await eventService.getAll();
      const batismos = events.filter(event => event.type === 'batismo');
      setScheduledBatismos(batismos);
    } catch (error) {
      console.error('Error loading scheduled batismos:', error);
    }
  };
  
  // Buscar batismos agendados ao abrir o diálogo
  useEffect(() => {
    if (open) {
      loadScheduledBatismos();
      loadAvailableElders();
    }
  }, [open, loadAvailableElders]);

  const generatePDF = (type: 'batismo' | 'santa-ceia', congregation: Congregation | undefined, data: Record<string, unknown>) => {
    const doc = new jsPDF();
    
    // Header com logo CCB (texto por enquanto, pode adicionar imagem depois)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', 105, 20, { align: 'center' });
    
    // Endereço da congregação
    if (congregation) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const address = `${congregation.street}, ${congregation.number} - ${congregation.neighborhood}`;
      const cityState = `${congregation.city}/${congregation.state}`;
      doc.text(address, 105, 28, { align: 'center' });
      doc.text(cityState, 105, 34, { align: 'center' });
    }
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    // Título do documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const title = type === 'batismo' ? 'REGISTRO DE BATISMO' : 'REGISTRO DE SANTA CEIA';
    doc.text(title, 105, 50, { align: 'center' });
    
    // Dados
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 65;
    
    // Validação de tipo para data.date
    const dataDate = data.date;
    const dateString = typeof dataDate === 'string' || typeof dataDate === 'number' || dataDate instanceof Date
      ? format(dataDate, 'dd/MM/yyyy')
      : 'Data não informada';
    
    doc.text(`Data: ${dateString}`, 20, yPos);
    yPos += 10;
    
    if (type === 'batismo' && data.tipoBatismo) {
      const tipoLabel = data.tipoBatismo === 'extra' ? 'Extra' : data.tipoBatismo === 'darpe' ? 'DARPE' : 'Agendado';
      doc.text(`Tipo: ${tipoLabel}`, 20, yPos);
      yPos += 10;
    }
    
    if (data.elderName || data.otherElderName) {
      const elderName = data.otherElderName || data.elderName;
      const elderType = data.elderFromOtherLocation ? ' (Visitante)' : '';
      doc.text(`Ancião: ${elderName}${elderType}`, 20, yPos);
      yPos += 10;
    }
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    const participantesLabel = type === 'batismo' ? 'Batizados' : 'Participantes';
    doc.text(participantesLabel, 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    const irmaos = typeof data.irmaos === 'number' ? data.irmaos : 0;
    const irmas = typeof data.irmas === 'number' ? data.irmas : 0;
    doc.text(`Irmãos: ${irmaos}`, 30, yPos);
    yPos += 7;
    doc.text(`Irmãs: ${irmas}`, 30, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${irmaos + irmas}`, 30, yPos);
    
    // Rodapé
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 280, { align: 'center' });
    
    // Salvar PDF
    const fileDate = typeof dataDate === 'string' || typeof dataDate === 'number' || dataDate instanceof Date
      ? format(dataDate, 'yyyyMMdd')
      : format(new Date(), 'yyyyMMdd');
    const fileName = `${type}_${congregation?.name || 'congregacao'}_${fileDate}.pdf`;
    doc.save(fileName);
  };
  
  const handleSaveBatismo = async () => {
    if (batismoTipo === 'agendado' && !selectedBatismoEvent) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um batismo agendado.',
        variant: 'destructive',
      });
      return;
    }
    
    if (batismoTipo !== 'agendado' && (!batismoCongregationId || !batismoDate)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha congregação e data.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let congregationId = batismoCongregationId;
      let congregationName = congregations.find(c => c.id === batismoCongregationId)?.name || '';
      let eventDate = new Date(batismoDate);
      let eventId = undefined;

      // Se for batismo agendado, buscar dados do evento
      if (batismoTipo === 'agendado' && selectedBatismoEvent) {
        const event = scheduledBatismos.find(e => e.id === selectedBatismoEvent);
        if (event) {
          congregationId = event.congregationId;
          congregationName = event.congregationName;
          eventDate = event.date;
          eventId = event.id;
        }
      }

      const savedData = {
        congregationId,
        congregationName,
        date: eventDate,
        irmaos: parseInt(batismoIrmaos) || 0,
        irmas: parseInt(batismoIrmas) || 0,
        elderName: batismoElderFromOther ? undefined : batismoElderName || undefined,
        elderFromOtherLocation: batismoElderFromOther,
        otherElderName: batismoElderFromOther ? batismoOtherElderName || undefined : undefined,
        tipoBatismo: batismoTipo,
        eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await batismoDataService.create(savedData);

      const congregation = congregations.find(c => c.id === congregationId) as unknown as Congregation | undefined;
      setLastSavedData({
        type: 'batismo',
        congregation,
        data: savedData as Record<string, unknown>
      });

      toast({
        title: 'Dados salvos!',
        description: 'Dados de batismo registrados com sucesso. Você pode imprimir o documento agora.',
      });
      
      resetForms();
    } catch (error) {
      console.error('Error saving batismo:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCeia = async () => {
    if (!ceiaCongregationId || !ceiaDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha congregação e data.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const congregation = congregations.find(c => c.id === ceiaCongregationId);
      const savedData = {
        congregationId: ceiaCongregationId,
        congregationName: congregation?.name || '',
        date: new Date(ceiaDate),
        irmaos: parseInt(ceiaIrmaos) || 0,
        irmas: parseInt(ceiaIrmas) || 0,
        elderName: ceiaElderFromOther ? undefined : ceiaElderName || undefined,
        elderFromOtherLocation: ceiaElderFromOther,
        otherElderName: ceiaElderFromOther ? ceiaOtherElderName || undefined : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await santaCeiaDataService.create(savedData);

      setLastSavedData({
        type: 'santa-ceia',
        congregation: congregation as unknown as Congregation | undefined,
        data: savedData as Record<string, unknown>
      });

      toast({
        title: 'Dados salvos!',
        description: 'Dados de Santa Ceia registrados com sucesso. Você pode imprimir o documento agora.',
      });
      
      resetForms();
    } catch (error) {
      console.error('Error saving ceia:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEnsaio = async () => {
    if (!ensaioCongregationId || !ensaioDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha congregação e data.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const congregation = congregations.find(c => c.id === ensaioCongregationId);
      await ensaioDataService.create({
        congregationId: ensaioCongregationId,
        congregationName: congregation?.name || '',
        date: new Date(ensaioDate),
        type: ensaioType,
        instruments,
        anciao: ensaioAnciao || undefined,
        encarregadoRegional: ensaioType === 'regional' ? (ensaioEncarregadoRegional || undefined) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: 'Dados salvos!',
        description: 'Dados de ensaio registrados com sucesso.',
      });
      
      resetForms();
      onDataSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving ensaio:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateInstrument = (instrument: keyof InstrumentCounts, value: string) => {
    setInstruments(prev => ({
      ...prev,
      [instrument]: parseInt(value) || 0,
    }));
  };

  const totalInstruments = Object.values(instruments).reduce((sum, val) => sum + val, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançar Dados</DialogTitle>
          <DialogDescription>
            Registre dados de batismos, santa ceias e ensaios
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batismo" className="flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Batismo
            </TabsTrigger>
            <TabsTrigger value="santa-ceia" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Santa Ceia
            </TabsTrigger>
            <TabsTrigger value="ensaio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Ensaios
            </TabsTrigger>
          </TabsList>

          {/* Tab Batismo */}
          <TabsContent value="batismo" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Batismo *</Label>
                <Select value={batismoTipo} onValueChange={(val: 'extra' | 'darpe' | 'agendado') => {
                  setBatismoTipo(val);
                  if (val === 'agendado') {
                    setBatismoCongregationId('');
                    setBatismoDate('');
                  } else {
                    setSelectedBatismoEvent('');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="extra">Extra</SelectItem>
                    <SelectItem value="darpe">DARPE</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {batismoTipo === 'agendado' ? (
                <>
                  <div className="space-y-2">
                    <Label>Batismo Agendado *</Label>
                    <Select value={selectedBatismoEvent} onValueChange={setSelectedBatismoEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um batismo agendado" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {scheduledBatismos.map((event) => (
                          <SelectItem key={event.id} value={event.id!}>
                            {event.congregationName} - {format(event.date, 'dd/MM/yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Congregação *</Label>
                    <Select value={batismoCongregationId} onValueChange={setBatismoCongregationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a congregação" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {congregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name} - {cong.city}/{cong.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batismo-date">Data *</Label>
                    <Input
                      id="batismo-date"
                      type="date"
                      value={batismoDate}
                      onChange={(e) => setBatismoDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batismo-irmaos">Irmãos Batizados</Label>
                  <Input
                    id="batismo-irmaos"
                    type="number"
                    min="0"
                    value={batismoIrmaos}
                    onChange={(e) => setBatismoIrmaos(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batismo-irmas">Irmãs Batizadas</Label>
                  <Input
                    id="batismo-irmas"
                    type="number"
                    min="0"
                    value={batismoIrmas}
                    onChange={(e) => setBatismoIrmas(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="batismo-elder-from-other"
                    checked={batismoElderFromOther}
                    onChange={(e) => setBatismoElderFromOther(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="batismo-elder-from-other" className="text-sm">
                    Ancião de Fora da Regional
                  </Label>
                </div>

                {batismoElderFromOther ? (
                  <div className="space-y-2">
                    <Label htmlFor="batismo-other-elder">Nome do Ancião</Label>
                    <Input
                      id="batismo-other-elder"
                      type="text"
                      placeholder="Digite o nome do ancião"
                      value={batismoOtherElderName}
                      onChange={(e) => setBatismoOtherElderName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="batismo-elder">Ancião que Atendeu</Label>
                    <Select value={batismoElderName} onValueChange={setBatismoElderName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ancião" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {availableElders.map((elder) => (
                          <SelectItem key={elder} value={elder}>
                            {elder}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total de Batizados</p>
                <p className="text-2xl font-bold text-primary">
                  {(parseInt(batismoIrmaos) || 0) + (parseInt(batismoIrmas) || 0)}
                </p>
              </div>

              <Button
                onClick={handleSaveBatismo}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Dados de Batismo
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Tab Santa Ceia */}
          <TabsContent value="santa-ceia" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Congregação *</Label>
                <Select value={ceiaCongregationId} onValueChange={setCeiaCongregationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a congregação" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-[300px]">
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name} - {cong.city}/{cong.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ceia-date">Data *</Label>
                <Input
                  id="ceia-date"
                  type="date"
                  value={ceiaDate}
                  onChange={(e) => setCeiaDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ceia-irmaos">Irmãos Participantes</Label>
                  <Input
                    id="ceia-irmaos"
                    type="number"
                    min="0"
                    value={ceiaIrmaos}
                    onChange={(e) => setCeiaIrmaos(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceia-irmas">Irmãs Participantes</Label>
                  <Input
                    id="ceia-irmas"
                    type="number"
                    min="0"
                    value={ceiaIrmas}
                    onChange={(e) => setCeiaIrmas(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ceia-elder-from-other"
                    checked={ceiaElderFromOther}
                    onChange={(e) => setCeiaElderFromOther(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="ceia-elder-from-other" className="text-sm">
                    Ancião de Fora da Regional
                  </Label>
                </div>

                {ceiaElderFromOther ? (
                  <div className="space-y-2">
                    <Label htmlFor="ceia-other-elder">Nome do Ancião</Label>
                    <Input
                      id="ceia-other-elder"
                      type="text"
                      placeholder="Digite o nome do ancião"
                      value={ceiaOtherElderName}
                      onChange={(e) => setCeiaOtherElderName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="ceia-elder">Ancião que Atendeu</Label>
                    <Select value={ceiaElderName} onValueChange={setCeiaElderName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ancião" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {availableElders.map((elder) => (
                          <SelectItem key={elder} value={elder}>
                            {elder}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total de Participantes</p>
                <p className="text-2xl font-bold text-primary">
                  {(parseInt(ceiaIrmaos) || 0) + (parseInt(ceiaIrmas) || 0)}
                </p>
              </div>

              <Button
                onClick={handleSaveCeia}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Dados de Santa Ceia
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Tab Ensaio */}
          <TabsContent value="ensaio" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Congregação *</Label>
                  <Select value={ensaioCongregationId} onValueChange={setEnsaioCongregationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a congregação" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover max-h-[200px]">
                      {congregations.map((cong) => (
                        <SelectItem key={cong.id} value={cong.id!}>
                          {cong.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Ensaio *</Label>
                  <Select value={ensaioType} onValueChange={(val: 'regional' | 'local') => setEnsaioType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="local">Ensaio Local</SelectItem>
                      <SelectItem value="regional">Ensaio Regional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ensaio-date">Data *</Label>
                <Input
                  id="ensaio-date"
                  type="date"
                  value={ensaioDate}
                  onChange={(e) => setEnsaioDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ensaio-anciao">Ancião</Label>
                <Input
                  id="ensaio-anciao"
                  type="text"
                  placeholder="Nome do ancião"
                  value={ensaioAnciao}
                  onChange={(e) => setEnsaioAnciao(e.target.value)}
                />
              </div>

              {ensaioType === 'regional' && (
                <div className="space-y-2">
                  <Label htmlFor="ensaio-encarregado">Encarregado Regional</Label>
                  <Input
                    id="ensaio-encarregado"
                    type="text"
                    placeholder="Nome do encarregado regional"
                    value={ensaioEncarregadoRegional}
                    onChange={(e) => setEnsaioEncarregadoRegional(e.target.value)}
                  />
                </div>
              )}

              {/* Instrumentos */}
              <div className="space-y-4">
                {/* Madeiras */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Madeiras</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'clarinete', label: 'Clarinete' },
                      { key: 'clarone', label: 'Clarone' },
                      { key: 'saxSoprano', label: 'Sax Soprano' },
                      { key: 'saxAlto', label: 'Sax Alto' },
                      { key: 'saxTenor', label: 'Sax Tenor' },
                      { key: 'saxBaritono', label: 'Sax Barítono' },
                    ].map((inst) => (
                      <div key={inst.key} className="space-y-1">
                        <Label htmlFor={inst.key} className="text-xs">{inst.label}</Label>
                        <Input
                          id={inst.key}
                          type="number"
                          min="0"
                          value={instruments[inst.key as keyof InstrumentCounts]}
                          onChange={(e) => updateInstrument(inst.key as keyof InstrumentCounts, e.target.value)}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Metais */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Metais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'trompete', label: 'Trompete' },
                      { key: 'flugelhorn', label: 'Flugelhorn' },
                      { key: 'euphonio', label: 'Euphonio' },
                      { key: 'trombone', label: 'Trombone' },
                      { key: 'trombonito', label: 'Trombonito' },
                      { key: 'tuba', label: 'Tuba' },
                    ].map((inst) => (
                      <div key={inst.key} className="space-y-1">
                        <Label htmlFor={inst.key} className="text-xs">{inst.label}</Label>
                        <Input
                          id={inst.key}
                          type="number"
                          min="0"
                          value={instruments[inst.key as keyof InstrumentCounts]}
                          onChange={(e) => updateInstrument(inst.key as keyof InstrumentCounts, e.target.value)}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Cordas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Cordas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'violino', label: 'Violino' },
                      { key: 'viola', label: 'Viola' },
                      { key: 'cello', label: 'Cello' },
                    ].map((inst) => (
                      <div key={inst.key} className="space-y-1">
                        <Label htmlFor={inst.key} className="text-xs">{inst.label}</Label>
                        <Input
                          id={inst.key}
                          type="number"
                          min="0"
                          value={instruments[inst.key as keyof InstrumentCounts]}
                          onChange={(e) => updateInstrument(inst.key as keyof InstrumentCounts, e.target.value)}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Organistas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Organistas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <Label htmlFor="organista" className="text-xs">Quantidade</Label>
                      <Input
                        id="organista"
                        type="number"
                        min="0"
                        value={instruments.organista}
                        onChange={(e) => updateInstrument('organista', e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total de Músicos</p>
                  <p className="text-2xl font-bold text-primary">{totalInstruments}</p>
                </div>
              </div>

              <Button
                onClick={handleSaveEnsaio}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Dados de Ensaio
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botão de Imprimir PDF */}
        {lastSavedData.type && lastSavedData.data && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Dados salvos com sucesso!</p>
                <p className="text-sm text-green-700 dark:text-green-300">Você pode imprimir o documento agora.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (lastSavedData.type && lastSavedData.data) {
                      generatePDF(lastSavedData.type, lastSavedData.congregation, lastSavedData.data);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLastSavedData({ type: null, congregation: undefined, data: null });
                    onDataSaved();
                    onOpenChange(false);
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
