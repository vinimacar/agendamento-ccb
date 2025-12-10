import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, Users, Calendar, TrendingUp, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import { Event } from '@/types';

const COLORS = {
  primary: 'hsl(217, 91%, 40%)',
  secondary: 'hsl(38, 92%, 50%)',
  success: 'hsl(142, 76%, 36%)',
  accent: 'hsl(217, 91%, 55%)',
  batismo: 'hsl(217, 91%, 60%)',
  santaCeia: 'hsl(38, 92%, 55%)',
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [congregations, setCongregations] = useState<any[]>([]);
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedCongregation, setSelectedCongregation] = useState<string>('all');

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        const [eventsData, congregationsData] = await Promise.all([
          eventService.getAll(),
          congregationService.getAll(),
        ]);
        setEvents(eventsData);
        setCongregations(congregationsData);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, []);

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
          <Button variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

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
      </div>
    </DashboardLayout>
  );
}
