import { ExcelFile } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";
import { StatsCard } from "./StatsCard";
import { AdvancedCharts } from "./AdvancedCharts";
import { InteractiveMap } from "./InteractiveMap";
import { InsightsPage } from "./dashboard/InsightsPage";
import { Database, TrendingUp, BarChart3, Activity, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardViewProps {
  file: ExcelFile;
}

export const DashboardView = ({ file }: DashboardViewProps) => {
  const data = file.data;
  
  // Calculate stats
  const numericKeys = Object.keys(data[0] || {}).filter(key => {
    const value = data[0][key];
    return typeof value === 'number' || !isNaN(Number(value));
  });

  const primaryKey = numericKeys[0] || Object.keys(data[0] || {})[0];
  const values = data.map(item => Number(item[primaryKey])).filter(v => !isNaN(v));
  
  const totalRecords = data.length;
  const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;

  const hasCoordinates = data.some(item => item.latitude && item.longitude);
  const nameKey = Object.keys(data[0] || {}).find(key => 
    typeof data[0][key] === 'string'
  ) || Object.keys(data[0] || {})[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary via-primary-glow to-secondary">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">{file.name}</h2>
          <p className="text-white/80">
            Carregado em {file.uploadedAt.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Registros"
          value={totalRecords.toLocaleString('pt-BR')}
          icon={Database}
          gradient="from-primary to-primary-glow"
        />
        <StatsCard
          title="Valor Médio"
          value={avgValue.toFixed(2)}
          icon={TrendingUp}
          gradient="from-secondary to-chart-2"
          trend={12.5}
        />
        <StatsCard
          title="Valor Máximo"
          value={maxValue.toFixed(2)}
          icon={BarChart3}
          gradient="from-accent to-chart-3"
        />
        <StatsCard
          title="Valor Mínimo"
          value={minValue.toFixed(2)}
          icon={Activity}
          gradient="from-chart-4 to-chart-5"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="area">Área</TabsTrigger>
          <TabsTrigger value="bar">Barras</TabsTrigger>
          <TabsTrigger value="line">Linha</TabsTrigger>
          <TabsTrigger value="pie">Pizza</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <InsightsPage data={data} />
        </TabsContent>

        <TabsContent value="area" className="space-y-4">
          <DashboardCard title="Gráfico de Área" icon={<BarChart3 className="w-5 h-5" />}>
            <AdvancedCharts data={data} type="area" dataKey={primaryKey} nameKey={nameKey} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="bar" className="space-y-4">
          <DashboardCard title="Gráfico de Barras" icon={<BarChart3 className="w-5 h-5" />}>
            <AdvancedCharts data={data} type="bar" dataKey={primaryKey} nameKey={nameKey} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="line" className="space-y-4">
          <DashboardCard title="Gráfico de Linha" icon={<TrendingUp className="w-5 h-5" />}>
            <AdvancedCharts data={data} type="line" dataKey={primaryKey} nameKey={nameKey} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="pie" className="space-y-4">
          <DashboardCard title="Gráfico de Pizza" icon={<Activity className="w-5 h-5" />}>
            <AdvancedCharts data={data} type="pie" dataKey={primaryKey} nameKey={nameKey} />
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Map Section */}
      {hasCoordinates && (
        <DashboardCard title="Mapa Interativo" icon={<Database className="w-5 h-5" />}>
          <InteractiveMap data={data} />
        </DashboardCard>
      )}

      {/* Data Table Preview */}
      <DashboardCard title="Prévia dos Dados" icon={<Database className="w-5 h-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {Object.keys(data[0] || {}).map(key => (
                  <th key={key} className="text-left p-3 font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="p-3">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Mostrando 10 de {data.length} registros
          </p>
        )}
      </DashboardCard>
    </div>
  );
};
