import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Reports() {
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

        {/* Report Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Por Ministério</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Anciões Locais</span>
                <span className="font-semibold text-foreground">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cooperadores do Ofício</span>
                <span className="font-semibold text-foreground">78</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diáconos</span>
                <span className="font-semibold text-foreground">120</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cooperadores de Jovens</span>
                <span className="font-semibold text-foreground">56</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Por Cidade</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">São Paulo</span>
                <span className="font-semibold text-foreground">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Campinas</span>
                <span className="font-semibold text-foreground">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ribeirão Preto</span>
                <span className="font-semibold text-foreground">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Santos</span>
                <span className="font-semibold text-foreground">5</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Por Dia de Culto</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Domingo</span>
                <span className="font-semibold text-foreground">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quarta-feira</span>
                <span className="font-semibold text-foreground">32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sexta-feira</span>
                <span className="font-semibold text-foreground">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sábado</span>
                <span className="font-semibold text-foreground">15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border/50">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Gráficos em breve</h3>
              <p className="text-muted-foreground">
                Os gráficos interativos estarão disponíveis em uma próxima atualização.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
