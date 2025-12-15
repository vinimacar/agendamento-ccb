import { useState } from 'react';
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
import type { InstrumentCounts } from '@/types';
import { Loader2, Plus, Music, Users2, Droplet } from 'lucide-react';
import { format } from 'date-fns';

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

  // Estados para Santa Ceia
  const [ceiaCongregationId, setCeiaCongregationId] = useState('');
  const [ceiaDate, setCeiaDate] = useState('');
  const [ceiaIrmaos, setCeiaIrmaos] = useState('0');
  const [ceiaIrmas, setCeiaIrmas] = useState('0');

  // Estados para Ensaio
  const [ensaioCongregationId, setEnsaioCongregationId] = useState('');
  const [ensaioDate, setEnsaioDate] = useState('');
  const [ensaioType, setEnsaioType] = useState<'regional' | 'local'>('local');
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

  const resetForms = () => {
    setBatismoCongregationId('');
    setBatismoDate('');
    setBatismoIrmaos('0');
    setBatismoIrmas('0');
    
    setCeiaCongregationId('');
    setCeiaDate('');
    setCeiaIrmaos('0');
    setCeiaIrmas('0');
    
    setEnsaioCongregationId('');
    setEnsaioDate('');
    setEnsaioType('local');
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

  const handleSaveBatismo = async () => {
    if (!batismoCongregationId || !batismoDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha congregação e data.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const congregation = congregations.find(c => c.id === batismoCongregationId);
      await batismoDataService.create({
        congregationId: batismoCongregationId,
        congregationName: congregation?.name || '',
        date: new Date(batismoDate),
        irmaos: parseInt(batismoIrmaos) || 0,
        irmas: parseInt(batismoIrmas) || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: 'Dados salvos!',
        description: 'Dados de batismo registrados com sucesso.',
      });
      
      resetForms();
      onDataSaved();
      onOpenChange(false);
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
      await santaCeiaDataService.create({
        congregationId: ceiaCongregationId,
        congregationName: congregation?.name || '',
        date: new Date(ceiaDate),
        irmaos: parseInt(ceiaIrmaos) || 0,
        irmas: parseInt(ceiaIrmas) || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: 'Dados salvos!',
        description: 'Dados de Santa Ceia registrados com sucesso.',
      });
      
      resetForms();
      onDataSaved();
      onOpenChange(false);
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
      </DialogContent>
    </Dialog>
  );
}
