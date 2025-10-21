import { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './StatCard';
import { CriticalDCUsMap } from './CriticalDCUsMap';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Power, BarChart3, MessageSquare, Activity, MapPin, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DCUData {
  DCU: string;
  Status: string;
  Comentário: string;
  LAT: string;
  LONG: string;
  [key: string]: string; // Para as colunas dinâmicas de Meters XX.XX.XXXX
}

interface DCUDashboardProps {
  data: DCUData[];
}

export const DCUDashboard = ({ data }: DCUDashboardProps) => {
  const [selectedComment, setSelectedComment] = useState<string>('all');
  const [mapboxToken, setMapboxToken] = useState<string>('pk.eyJ1IjoiZ3JhemllbGUtbmFuc2VuIiwiYSI6ImNtZ3ozdW9qMDF1M2cyc3B0MXphamhkbmYifQ.JxrSUz5Pd05pK7PXBDg2_w');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedDCUs, setSelectedDCUs] = useState<Set<string>>(new Set());

  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Identificar colunas de datas (Meters XX.XX.XXXX)
    const firstRow = data[0];
    const meterColumns = Object.keys(firstRow).filter(key => key.startsWith('Meters '));
    const dates = meterColumns.map(col => col.replace('Meters ', '')).sort();
    const latestDate = dates[dates.length - 1];
    const latestMeterColumn = `Meters ${latestDate}`;

    // Calcular estatísticas
    const onlineDCUs = data.filter(d => d.Status && d.Status.toLowerCase() === 'online');
    const offlineDCUs = data.filter(d => d.Status && d.Status.toLowerCase() === 'offline');
    const notRegisteredDCUs = data.filter(d => d.Status && d.Status.toLowerCase() === 'não registrado');
    
    // DCUs com 0 medidores na última data
    const noMeters = data.filter(d => {
      const meterValue = d[latestMeterColumn];
      return meterValue !== undefined && (meterValue === '0' || meterValue === '' || parseInt(meterValue) === 0);
    });

    // DCUs online com 0 medidores na última data
    const onlineNoMeters = data.filter(d => {
      const meterValue = d[latestMeterColumn];
      const isOnline = d.Status && d.Status.toLowerCase() === 'online';
      const hasNoMeters = meterValue !== undefined && (meterValue === '0' || meterValue === '' || parseInt(meterValue) === 0);
      return isOnline && hasNoMeters;
    });

    // Sobrecarga e subcarga
    const overloaded = data.filter(d => {
      const meterValue = d[latestMeterColumn];
      return meterValue && parseInt(meterValue) > 850;
    });
    
    const underloaded = data.filter(d => {
      const meterValue = d[latestMeterColumn];
      return meterValue && parseInt(meterValue) > 0 && parseInt(meterValue) < 50;
    });

    // Casos em análise (Offline ou Não Registrado com comentário)
    const casesInAnalysis = data.filter(d => {
      const status = d.Status?.toLowerCase();
      const hasComment = d.Comentário && d.Comentário !== 'null' && d.Comentário.trim() !== '';
      return (status === 'offline' || status === 'não registrado') && hasComment;
    });

    // Calcular porcentagem de casos em análise
    const totalOfflineAndNotRegistered = offlineDCUs.length + notRegisteredDCUs.length;
    const casesInAnalysisPercent = totalOfflineAndNotRegistered > 0 
      ? Math.round((casesInAnalysis.length / totalOfflineAndNotRegistered) * 100) 
      : 0;

    // Análise histórica: calcular média e desvios
    const dcusWithHistory = data.map(dcu => {
      const meterValues = meterColumns.map(col => {
        const value = dcu[col];
        return value ? parseInt(value) : 0;
      }).filter(v => !isNaN(v));

      const avg = meterValues.length > 0 
        ? meterValues.reduce((sum, v) => sum + v, 0) / meterValues.length 
        : 0;
      
      const latestValue = dcu[latestMeterColumn] ? parseInt(dcu[latestMeterColumn]) : 0;
      const deviation = Math.abs(latestValue - avg);
      const deviationPercent = avg > 0 ? (deviation / avg) * 100 : 0;

      return {
        dcu: dcu.DCU,
        avg,
        latestValue,
        deviation,
        deviationPercent,
        history: meterColumns.map(col => ({
          date: col.replace('Meters ', ''),
          value: dcu[col] ? parseInt(dcu[col]) : 0
        }))
      };
    });

    // Top 10 DCUs com maior desvio
    const top10Deviations = dcusWithHistory
      .filter(d => d.avg > 0)
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 10);

    // Preparar dados para gráfico de linhas
    const trendData = dates.map(date => {
      const dataPoint: any = { date };
      top10Deviations.forEach((dcuData, idx) => {
        const historyPoint = dcuData.history.find(h => h.date === date);
        dataPoint[`DCU${idx + 1}`] = historyPoint?.value || 0;
      });
      return dataPoint;
    });

    // Calcular média geral para linha tracejada
    const overallAvg = top10Deviations.reduce((sum, d) => sum + d.avg, 0) / (top10Deviations.length || 1);
    const avgLineData = dates.map(date => ({ date, avg: Math.round(overallAvg) }));

    // Comentários (filtrar os que começam com "Interno")
    const comments = [...new Set(data.map(d => d.Comentário).filter(c => c && c !== 'null' && !c.startsWith('Interno')))];

    // Count DCUs by comment
    const commentCounts = comments.map(comment => ({
      name: comment,
      count: data.filter(d => d.Comentário === comment).length,
    })).sort((a, b) => b.count - a.count);

    // Status counts para o gráfico de pizza
    const statusCounts = [
      { name: 'Online', value: onlineDCUs.length, color: 'hsl(var(--success))' },
      { name: 'Offline', value: offlineDCUs.length, color: 'hsl(var(--destructive))' },
      { name: 'Não Registrado', value: notRegisteredDCUs.length, color: 'hsl(215 20% 65%)' },
    ].filter(s => s.value > 0);

    // Totalizador de medidores por status
    const totalMetersByStatus = {
      online: onlineDCUs.reduce((sum, d) => sum + (d[latestMeterColumn] ? parseInt(d[latestMeterColumn]) : 0), 0),
      offline: offlineDCUs.reduce((sum, d) => sum + (d[latestMeterColumn] ? parseInt(d[latestMeterColumn]) : 0), 0),
      notRegistered: notRegisteredDCUs.reduce((sum, d) => sum + (d[latestMeterColumn] ? parseInt(d[latestMeterColumn]) : 0), 0),
    };

    return {
      latestDate,
      overloaded,
      underloaded,
      noMeters,
      onlineNoMeters,
      totalDCUs: data.length,
      onlineDCUs: onlineDCUs.length,
      offlineDCUs: offlineDCUs.length,
      notRegisteredDCUs: notRegisteredDCUs.length,
      casesInAnalysis,
      casesInAnalysisPercent,
      comments,
      commentCounts,
      latestData: data,
      statusCounts,
      latestMeterColumn,
      top10Deviations,
      trendData,
      avgLineData,
      totalMetersByStatus,
    };
  }, [data]);

  if (!analysis) {
    return (
      <Card className="p-8 border-2 border-dashed border-border">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Nenhum dado carregado</h3>
          <p className="text-muted-foreground">Envie os dados de DCUs via chat para visualizar o dashboard</p>
        </div>
      </Card>
    );
  }

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !analysis) return;

    // Filtrar DCUs com coordenadas válidas
    const dcusWithCoords = analysis.latestData.filter(d => {
      const lat = parseFloat(d.LAT);
      const long = parseFloat(d.LONG);
      return !isNaN(lat) && !isNaN(long) && lat !== 0 && long !== 0;
    });

    if (dcusWithCoords.length === 0) return;

    // Inicializar mapa
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [parseFloat(dcusWithCoords[0].LONG), parseFloat(dcusWithCoords[0].LAT)],
      zoom: 10,
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcadores
    dcusWithCoords.forEach(dcu => {
      const lat = parseFloat(dcu.LAT);
      const long = parseFloat(dcu.LONG);
      const status = dcu.Status?.toLowerCase();
      
      let color = 'hsl(215 20% 65%)'; // Não registrado (cinza)
      if (status === 'online') color = 'hsl(var(--success))';
      else if (status === 'offline') color = 'hsl(var(--destructive))';

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = color;
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const meters = dcu[analysis.latestMeterColumn] || '0';
      const statusLabel = dcu.Status || 'N/A';
      const statusEmoji = status === 'online' ? '🟢' : status === 'offline' ? '🔴' : '⚪';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px;">
          <strong>${dcu.DCU}</strong><br/>
          ${statusLabel}
        </div>`
      );

      new mapboxgl.Marker(el)
        .setLngLat([long, lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Ajustar bounds para mostrar todos os marcadores
    if (dcusWithCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      dcusWithCoords.forEach(dcu => {
        bounds.extend([parseFloat(dcu.LONG), parseFloat(dcu.LAT)]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, analysis]);

  const filteredData = selectedComment === 'all' 
    ? analysis.latestData 
    : analysis.latestData.filter(d => d.Comentário === selectedComment);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

  const criticalData = [
    { name: 'Sobrecarga', value: analysis.overloaded.length, color: 'hsl(var(--destructive))' },
    { name: 'Subcarga', value: analysis.underloaded.length, color: 'hsl(var(--warning))' },
    { name: 'Sem medidores', value: analysis.noMeters.length, color: 'hsl(215 20% 65%)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Análise das DCUs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Última atualização: {analysis.latestDate}</p>
        </div>
      </div>

      {/* Primeira linha: Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de DCUs"
          value={analysis.totalDCUs}
          icon={Activity}
          variant="default"
        />
        <StatCard
          title="DCUs Online"
          value={analysis.onlineDCUs}
          icon={Power}
          variant="success"
        />
        <StatCard
          title="Online sem Medidores"
          value={analysis.onlineNoMeters.length}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Mapa de DCUs */}
      <Card className="p-6 border border-border bg-card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Localização das DCUs
        </h3>
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
            <span className="text-sm">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }}></div>
            <span className="text-sm">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(215 20% 65%)' }}></div>
            <span className="text-sm">Não Registrado</span>
          </div>
        </div>
        <div ref={mapContainer} className="h-[400px] rounded-lg" />
      </Card>

      {/* Segunda linha: Status e Casos em Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DCUs por Status */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Power className="h-5 w-5 text-primary" />
            DCUs por Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysis.statusCounts}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {analysis.statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Casos em Análise */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Casos em Análise
          </h3>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {analysis.casesInAnalysisPercent}%
              </div>
              <p className="text-base text-muted-foreground">
                das DCUs Offline e Não Registradas<br/>já estão em análise
              </p>
              {analysis.casesInAnalysis.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  {analysis.casesInAnalysis.length} casos sob análise da equipe
                </div>
              )}
            </div>
            <Button 
              className="mt-6"
              onClick={() => window.open('https://nansencombr-my.sharepoint.com/:w:/g/personal/evandro_silva_nansen_com_br/EdcsSnUwiHVJiVdhISWvZcMBEUgUg2enzLhd-BoBXhNaFQ?e=ORaU91', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Relatório
            </Button>
          </div>
        </Card>
      </div>

      {/* Terceira linha: DCUs Críticas e Análise Histórica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DCUs Críticas */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            DCUs Críticas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={criticalData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {criticalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white'
                }} 
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold"
                fill="hsl(var(--foreground))"
              >
                {criticalData.reduce((sum, item) => sum + item.value, 0)}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 10 DCUs com Maior Desvio */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Top 10 Desvios da Média
          </h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {analysis.top10Deviations.map((dcuData, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 bg-background/50 rounded">
                <span className="font-mono font-semibold">{idx + 1}. {dcuData.dcu}</span>
                <div className="text-right">
                  <div className="font-bold text-destructive">{dcuData.latestValue} med</div>
                  <div className="text-muted-foreground text-xs">
                    Média: {Math.round(dcuData.avg)} | Δ {Math.round(dcuData.deviation)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráfico de Linhas - Variação Histórica Top 10 */}
      {analysis.top10Deviations.length > 0 && (
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Variação Histórica - Top 10 DCUs
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Clique em uma DCU na legenda para isolar sua linha</p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analysis.trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 13 }}
                angle={0}
                height={60}
                tickFormatter={(value) => {
                  const [day, month, year] = value.split('.');
                  return `${day}/${month}/${year}`;
                }}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white'
                }}
                labelFormatter={(value) => {
                  const [day, month, year] = value.split('.');
                  return `${day}/${month}/${year}`;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '14px', cursor: 'pointer' }}
                onClick={(e) => {
                  if (e.dataKey) {
                    const dcuName = analysis.top10Deviations.find((_, idx) => `DCU${idx + 1}` === e.dataKey)?.dcu;
                    if (dcuName) {
                      setSelectedDCUs(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(dcuName)) {
                          newSet.delete(dcuName);
                        } else {
                          newSet.clear();
                          newSet.add(dcuName);
                        }
                        return newSet;
                      });
                    }
                  }
                }}
              />
              {analysis.top10Deviations.map((dcuData, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`DCU${idx + 1}`}
                  name={dcuData.dcu}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  hide={selectedDCUs.size > 0 && !selectedDCUs.has(dcuData.dcu)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {selectedDCUs.size > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedDCUs(new Set())}
              >
                Mostrar todas as DCUs
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Mapa de DCUs Críticas */}
      <CriticalDCUsMap 
        data={analysis.latestData}
        overloaded={analysis.overloaded}
        underloaded={analysis.underloaded}
        noMeters={analysis.noMeters}
        latestMeterColumn={analysis.latestMeterColumn}
        mapboxToken={mapboxToken}
      />


      {/* Lista Detalhada das DCUs Críticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {analysis.overloaded.length > 0 && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sobrecarregadas (&gt;850)
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {analysis.overloaded.slice(0, 10).map((dcu, idx) => (
                <div key={idx} className="text-sm font-mono bg-background/50 p-2 rounded">
                  {dcu.DCU}: <span className="font-bold">{dcu[analysis.latestMeterColumn]}</span> medidores
                </div>
              ))}
              {analysis.overloaded.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{analysis.overloaded.length - 10} mais
                </p>
              )}
            </div>
          </Card>
        )}

        {analysis.underloaded.length > 0 && (
          <Card className="p-4 border-warning/30 bg-warning/5">
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Pouca Carga (&lt;50)
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {analysis.underloaded.slice(0, 10).map((dcu, idx) => (
                <div key={idx} className="text-sm font-mono bg-background/50 p-2 rounded">
                  {dcu.DCU}: <span className="font-bold">{dcu[analysis.latestMeterColumn]}</span> medidores
                </div>
              ))}
              {analysis.underloaded.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{analysis.underloaded.length - 10} mais
                </p>
              )}
            </div>
          </Card>
        )}

        {analysis.noMeters.length > 0 && (
          <Card className="p-4 border-border bg-muted/50">
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Power className="h-4 w-4" style={{ color: 'hsl(215 20% 65%)' }} />
              Sem medidores
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {analysis.noMeters.slice(0, 10).map((dcu, idx) => (
                <div key={idx} className="text-sm font-mono bg-background/50 p-2 rounded">
                  {dcu.DCU}
                </div>
              ))}
              {analysis.noMeters.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{analysis.noMeters.length - 10} mais
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Gráfico de Barras - DCUs em Análise */}
      {analysis.commentCounts.length > 0 && (
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              DCUs em Análise
            </h3>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Total em Análise</p>
                <p className="text-2xl font-bold text-primary">
                  {analysis.latestData.filter(d => d.Comentário && d.Comentário !== 'null').length}
                </p>
              </div>
              <Button 
                onClick={() => window.open('https://nansencombr-my.sharepoint.com/:w:/g/personal/graziele_souza_nansen_com_br/ES3VFQF59G9En61f6228DaEB4lgGndrCreZLDkNPbicYzw?e=e58fq7', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Relatório
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.commentCounts}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                angle={0}
                height={80}
                interval={0}
                tick={{ fontSize: 13 }}
              />
              <YAxis 
                domain={[0, 'dataMax + 5']}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'white'
                }} 
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {analysis.commentCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {analysis.comments.length > 0 && (
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold mb-4">Filtrar por Comentário</h3>
          <Select value={selectedComment} onValueChange={setSelectedComment}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecione um comentário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({analysis.latestData.length} DCUs)</SelectItem>
              {analysis.comments.map((name) => {
                const count = analysis.latestData.filter(d => d.Comentário === name).length;
                return (
                  <SelectItem key={name} value={name}>
                    {name} ({count} DCUs)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Card>
      )}

      <Card className="p-6 border border-border bg-card">
        <h3 className="text-xl font-semibold mb-4">
          Detalhes das DCUs {selectedComment !== 'all' && `(${selectedComment})`}
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base">DCU</TableHead>
                <TableHead className="text-base">Status</TableHead>
                <TableHead className="text-base">LAT</TableHead>
                <TableHead className="text-base">LONG</TableHead>
                <TableHead className="text-base">Medidores ({analysis.latestDate})</TableHead>
                <TableHead className="text-base">Comentário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, 20).map((dcu, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{dcu.DCU}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      dcu.Status && dcu.Status.toLowerCase() === 'online' 
                        ? 'bg-success/20 text-success' 
                        : dcu.Status && dcu.Status.toLowerCase() === 'offline'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {dcu.Status || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{dcu.LAT || '-'}</TableCell>
                  <TableCell className="text-sm">{dcu.LONG || '-'}</TableCell>
                  <TableCell className="text-sm">{dcu[analysis.latestMeterColumn] || '0'}</TableCell>
                  <TableCell className="text-base text-muted-foreground">
                    {dcu.Comentário || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredData.length > 20 && (
            <p className="text-base text-muted-foreground text-center mt-4">
              Mostrando 20 de {filteredData.length} DCUs
            </p>
          )}
        </div>
      </Card>

      {/* Rodapé com Informações de Contato */}
      <Card className="p-8 border border-border bg-card text-center">
        <h3 className="text-xl font-semibold mb-4">Equipe I-NOC Nansen</h3>
        <p className="text-muted-foreground mb-6">
          Para dúvidas ou mais informações sobre este relatório, entre em contato com nossa equipe:
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Responsável pelo Relatório</p>
            <p className="text-muted-foreground">Graziele Souza</p>
            <a 
              href="mailto:graziele.souza@nansen.com.br" 
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              graziele.souza@nansen.com.br
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="hidden md:block h-16 w-px bg-border"></div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Revisores</p>
            <div className="space-y-1">
              <div>
                <p className="text-muted-foreground">Alisson Ribeiro</p>
                <a 
                  href="mailto:alisson.ribeiro@nansen.com.br" 
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  alisson.ribeiro@nansen.com.br
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Evandro Silva</p>
                <a 
                  href="mailto:evandro.silva@nansen.com.br" 
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  evandro.silva@nansen.com.br
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
