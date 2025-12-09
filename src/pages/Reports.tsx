import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from 'recharts';
import { eventService } from '@/services/eventService';
import { congregationService } from '@/services/congregationService';

const COLORS = ['hsl(217, 91%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(217, 91%, 55%)'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [ministryData, setMinistryData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [worshipDayData, setWorshipDayData] = useState<any[]>([]);
  const [monthlyEventsData, setMonthlyEventsData] = useState<any[]>([]);

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        const [events, congregations] = await Promise.all([
          eventService.getAll(),
          congregationService.getAll(),
        ]);

        // Calcular dados de ministério
        const eldersCount = congregations.reduce((sum, c) => sum + (c.elders?.length || 0), 0);
        const officeCoopCount = congregations.reduce((sum, c) => sum + (c.officeCooperators?.length || 0), 0);
        const deaconsCount = congregations.reduce((sum, c) => sum + (c.deacons?.length || 0), 0);
        const youthCoopCount = congregations.reduce((sum, c) => sum + (c.youthCooperators?.length || 0), 0);

        setMinistryData([
          { name: 'Anciões Locais', value: eldersCount, fill: 'hsl(217, 91%, 40%)' },
          { name: 'Coop. Ofício', value: officeCoopCount, fill: 'hsl(38, 92%, 50%)' },
          { name: 'Diáconos', value: deaconsCount, fill: 'hsl(142, 76%, 36%)' },
          { name: 'Coop. Jovens', value: youthCoopCount, fill: 'hsl(217, 91%, 55%)' },
        ]);

        // Calcular dados por cidade
        const cityCounts = congregations.reduce((acc: any, c) => {
          acc[c.city] = (acc[c.city] || 0) + 1;
          return acc;
        }, {});
        
        const sortedCities = Object.entries(cityCounts)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 5)
          .map(([name, congregations]) => ({ name, congregations }));
        
        setCityData(sortedCities);

        // Calcular dados de dias de culto
        const worshipDayCounts = congregations.reduce((acc: any, c) => {
          c.worshipDays?.forEach((day: string) => {
            acc[day] = (acc[day] || 0) + 1;
          });
          return acc;
        }, {});

        const dayColors = ['hsl(217, 91%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(217, 91%, 55%)'];
        const worshipData = Object.entries(worshipDayCounts).map(([name, value], index) => ({
          name,
          value,
          fill: dayColors[index % dayColors.length],
        }));
        
        setWorshipDayData(worshipData);

        // Calcular eventos por mês
        const monthCounts = events.reduce((acc: any, event) => {
          const month = new Date(event.date).getMonth();
          const monthName = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month];
          if (!acc[monthName]) {
            acc[monthName] = { month: monthName, eventos: 0, batismos: 0 };
          }
          acc[monthName].eventos++;
          if (event.type === 'batismo') {
            acc[monthName].batismos++;
          }
          return acc;
        }, {});

        const monthlyData = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
          .map(month => monthCounts[month] || { month, eventos: 0, batismos: 0 });
        
        setMonthlyEventsData(monthlyData);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, []);

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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Visualize relatórios detalhados</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select defaultValue="ministry">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ministry">Por Ministério</SelectItem>
              <SelectItem value="congregation">Por Congregação</SelectItem>
              <SelectItem value="city">Por Cidade</SelectItem>
              <SelectItem value="worship">Por Dia de Culto</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="2024">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Charts Grid - Top Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ministry Bar Chart */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Distribuição por Ministério</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {ministryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Worship Day Pie Chart */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Cultos por Dia da Semana</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={worshipDayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {worshipDayData.map((entry, index) => (
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
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Events Area Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Eventos Mensais - 2024</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEventsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBatismos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
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
                  dataKey="eventos"
                  name="Total de Eventos"
                  stroke="hsl(217, 91%, 40%)"
                  fillOpacity={1}
                  fill="url(#colorEventos)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="batismos"
                  name="Batismos"
                  stroke="hsl(38, 92%, 50%)"
                  fillOpacity={1}
                  fill="url(#colorBatismos)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Bar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Congregações por Cidade</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar 
                  dataKey="congregations" 
                  name="Congregações"
                  fill="hsl(217, 91%, 40%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Resumo Ministério</h3>
            <div className="space-y-3">
              {ministryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground text-sm">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-primary">
                    {ministryData.reduce((acc, item) => acc + item.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Por Cidade</h3>
            <div className="space-y-3">
              {cityData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{item.name}</span>
                  <span className="font-semibold text-foreground">{item.congregations}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-primary">
                    {cityData.reduce((acc, item) => acc + item.congregations, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Por Dia de Culto</h3>
            <div className="space-y-3">
              {worshipDayData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground text-sm">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-primary">
                    {worshipDayData.reduce((acc, item) => acc + item.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
