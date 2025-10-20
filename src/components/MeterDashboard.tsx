import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { StatCard } from './StatCard';
import { ExportButton } from './ExportButton';
import { Activity, TrendingUp, TrendingDown, MapPinOff } from 'lucide-react';

interface MeterData {
  'Meter Number': string;
  LAT: string;
  LONG: string;
  Data: string;
  Status: string;
  DCU: string;
}

interface MeterDashboardProps {
  data: MeterData[];
}

const COLORS = {
  Online: 'hsl(var(--success))',
  Offline: 'hsl(var(--destructive))',
  Removidos: 'hsl(var(--muted))',
  default: 'hsl(var(--primary))',
};

export const MeterDashboard = ({ data }: MeterDashboardProps) => {
  // Otimização para dados massivos (600k+ linhas)
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    console.log('Processando', data.length, 'registros de medidores...');

    // Get unique dates and sort
    const dates = [...new Set(data.map(d => d.Data))].sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA)).getTime() -
             new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB)).getTime();
    });

    const latestDate = dates[dates.length - 1];
    const previousDate = dates[dates.length - 2];

    // Otimização: Processar tudo em uma única passagem
    const statusCounts: { [key: string]: number } = {};
    const previousStatusCounts: { [key: string]: number } = {};
    let latestCount = 0;
    let previousCount = 0;
    let noLocationCount = 0;

    data.forEach(meter => {
      const status = meter.Status || 'Unknown';
      
      // Contar medidores sem localização (LAT ou LONG = 0)
      const lat = parseFloat(meter.LAT);
      const long = parseFloat(meter.LONG);
      if (meter.Data === latestDate && (lat === 0 || long === 0 || isNaN(lat) || isNaN(long))) {
        noLocationCount++;
      }
      
      if (meter.Data === latestDate) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        latestCount++;
      } else if (meter.Data === previousDate) {
        previousStatusCounts[status] = (previousStatusCounts[status] || 0) + 1;
        previousCount++;
      }
    });

    // Create chart data
    const latestChartData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const previousChartData = Object.entries(previousStatusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate changes
    const changes: { [key: string]: number } = {};
    Object.keys({ ...statusCounts, ...previousStatusCounts }).forEach(status => {
      const current = statusCounts[status] || 0;
      const previous = previousStatusCounts[status] || 0;
      changes[status] = current - previous;
    });

    console.log('Análise concluída:', latestCount, 'registros na data mais recente');

    return {
      latestDate,
      previousDate,
      latestChartData,
      previousChartData,
      totalLatest: latestCount,
      totalPrevious: previousCount,
      statusCounts,
      previousStatusCounts,
      changes,
      noLocationCount,
    };
  }, [data]);

  if (!analysis) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Carregue os dados de medidores para visualizar o dashboard</p>
      </Card>
    );
  }

  const totalChange = analysis.totalLatest - analysis.totalPrevious;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard de Medidores
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Data atual: {analysis.latestDate}</p>
            {analysis.previousDate && (
              <p className="text-sm text-muted-foreground">Data anterior: {analysis.previousDate}</p>
            )}
          </div>
          <ExportButton data={data} filename="meter-dashboard" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Medidores (Atual)"
          value={analysis.totalLatest.toLocaleString()}
          icon={Activity}
          trend={totalChange !== 0 ? {
            value: totalChange,
            label: 'vs. dia anterior'
          } : undefined}
          variant="default"
        />
        <StatCard
          title="Medidores Online"
          value={analysis.statusCounts['Online'] || 0}
          icon={TrendingUp}
          trend={analysis.changes['Online'] ? {
            value: analysis.changes['Online'],
            label: 'vs. dia anterior'
          } : undefined}
          variant="success"
        />
        <StatCard
          title="Medidores Offline"
          value={analysis.statusCounts['Offline'] || 0}
          icon={TrendingDown}
          trend={analysis.changes['Offline'] ? {
            value: analysis.changes['Offline'],
            label: 'vs. dia anterior'
          } : undefined}
          variant="danger"
        />
        <StatCard
          title="Sem Localização"
          value={analysis.noLocationCount}
          icon={MapPinOff}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
          <h3 className="text-lg font-semibold mb-4">Status Atual ({analysis.latestDate})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysis.latestChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analysis.latestChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.default} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {analysis.previousDate && (
          <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
            <h3 className="text-lg font-semibold mb-4">Status Anterior ({analysis.previousDate})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysis.previousChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analysis.previousChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.default} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Análise de Mudanças</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analysis.changes).map(([status, change]) => (
            <div key={status} className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">{status}</p>
              <p className={`text-2xl font-bold ${
                change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : ''
              }`}>
                {change > 0 ? '+' : ''}{change}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.previousStatusCounts[status] || 0} → {analysis.statusCounts[status] || 0}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
