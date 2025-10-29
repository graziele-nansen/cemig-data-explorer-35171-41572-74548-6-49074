import { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './StatCard';
import { CriticalDCUsMap } from './CriticalDCUsMap';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Power, BarChart3, MessageSquare, Activity, MapPin, ExternalLink, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import nansenLogo from '@/assets/logo-nansen.png';

interface DCUData {
  DCU: string;
  Status: string;
  Comentário: string;
  'Status da Análise'?: string;
  LAT: string;
  LONG: string;
  [key: string]: string; // Para as colunas dinâmicas de Meters XX.XX.XXXX
}

interface DCUDashboardProps {
  data: DCUData[];
}

// Função auxiliar para determinar o motivo de uma DCU estar em análise
const getReasonForDCU = (dcu: DCUData, latestMeterColumn: string): string => {
  const status = dcu.Status?.toLowerCase();
  const meterValue = dcu[latestMeterColumn];
  const hasNoMeters = meterValue !== undefined && (
    meterValue === '0' || 
    meterValue === '' || 
    meterValue === '#N/D' || 
    parseInt(meterValue) === 0 || 
    isNaN(parseInt(meterValue))
  );
  
  if (status === 'não registrado') {
    return 'Status da DCU é não registrado';
  }
  
  if (status === 'offline') {
    return 'Status da DCU é offline';
  }
  
  if (status === 'online' && hasNoMeters) {
    return 'Status da DCU é online mas não contém medidores';
  }
  
  return 'Motivo não identificado';
};

export const DCUDashboard = ({ data }: DCUDashboardProps) => {
  const [selectedComment, setSelectedComment] = useState<string>('all');
  const [mapboxToken, setMapboxToken] = useState<string>('pk.eyJ1IjoiZ3JhemllbGUtbmFuc2VuIiwiYSI6ImNtZ3ozdW9qMDF1M2cyc3B0MXphamhkbmYifQ.JxrSUz5Pd05pK7PXBDg2_w');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedDCUs, setSelectedDCUs] = useState<Set<string>>(new Set());
  const [visibleDCUs, setVisibleDCUs] = useState<Set<string>>(new Set());

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
      return meterValue !== undefined && (
        meterValue === '0' || 
        meterValue === '' || 
        meterValue === '#N/D' || 
        parseInt(meterValue) === 0 || 
        isNaN(parseInt(meterValue))
      );
    });

    // DCUs online com 0 medidores na última data
    const onlineNoMeters = data.filter(d => {
      const meterValue = d[latestMeterColumn];
      const isOnline = d.Status && d.Status.toLowerCase() === 'online';
      const hasNoMeters = meterValue !== undefined && (
        meterValue === '0' || 
        meterValue === '' || 
        meterValue === '#N/D' || 
        parseInt(meterValue) === 0 || 
        isNaN(parseInt(meterValue))
      );
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

    // Casos de atenção: Offline + Não Registrado + Online com 0 medidores
    const offlineAttention = data.filter(d => d.Status?.toLowerCase() === 'offline');
    const notRegisteredAttention = data.filter(d => d.Status?.toLowerCase() === 'não registrado');
    const onlineNoMetersAttention = data.filter(d => {
      const status = d.Status?.toLowerCase();
      const meterValue = d[latestMeterColumn];
      const hasNoMeters = meterValue !== undefined && (
        meterValue === '0' || 
        meterValue === '' || 
        meterValue === '#N/D' || 
        parseInt(meterValue) === 0 || 
        isNaN(parseInt(meterValue))
      );
      return status === 'online' && hasNoMeters;
    });

    // Casos "Em estudo" - filtrar DCUs com Comentário = "Em estudo"
    const casesInStudy = data.filter(d => 
      d.Comentário && d.Comentário.toLowerCase().trim() === 'em estudo'
    );

    // Agrupar casos "Em estudo" por "Status da Análise"
    const analysisByStatus = {
      identificado: casesInStudy.filter(d => 
        d['Status da Análise'] && d['Status da Análise'].toLowerCase().trim() === 'identificado'
      ),
      emAnalise: casesInStudy.filter(d => 
        d['Status da Análise'] && d['Status da Análise'].toLowerCase().trim() === 'em análise'
      ),
      aguardandoAtuacao: casesInStudy.filter(d => 
        d['Status da Análise'] && d['Status da Análise'].toLowerCase().trim() === 'aguardando atuação'
      ),
      solucionado: casesInStudy.filter(d => 
        d['Status da Análise'] && d['Status da Análise'].toLowerCase().trim() === 'solucionado'
      ),
    };

    // Total de casos de atenção e em estudo
    const totalAttentionCases = offlineAttention.length + notRegisteredAttention.length + onlineNoMetersAttention.length;
    const totalInStudy = casesInStudy.length;

    // Calcular porcentagem de casos em estudo sobre casos de atenção
    const casesInStudyPercent = totalAttentionCases > 0 
      ? Math.round((totalInStudy / totalAttentionCases) * 100) 
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
      offlineAttention,
      notRegisteredAttention,
      onlineNoMetersAttention,
      casesInStudy,
      analysisByStatus,
      totalAttentionCases,
      totalInStudy,
      casesInStudyPercent,
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
      // Validar se as coordenadas estão dentro dos limites válidos
      return !isNaN(lat) && !isNaN(long) && 
             lat >= -90 && lat <= 90 && 
             long >= -180 && long <= 180 &&
             lat !== 0 && long !== 0;
    });

    if (dcusWithCoords.length === 0) return;

    // Inicializar mapa
    mapboxgl.accessToken = mapboxToken;
    
    // Usar coordenadas válidas para o centro inicial
    const initialLat = parseFloat(dcusWithCoords[0].LAT);
    const initialLong = parseFloat(dcusWithCoords[0].LONG);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [initialLong, initialLat],
      zoom: 10,
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcadores
    dcusWithCoords.forEach(dcu => {
      const lat = parseFloat(dcu.LAT);
      const long = parseFloat(dcu.LONG);
      
      // Validação adicional antes de criar o marcador
      if (lat < -90 || lat > 90 || long < -180 || long > 180) {
        console.warn(`Coordenadas inválidas para DCU ${dcu.DCU}: lat=${lat}, long=${long}`);
        return;
      }
      
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
        `<div style="padding: 12px; min-width: 150px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">DCU: ${dcu.DCU}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Status: ${statusLabel}</div>
          <div style="font-size: 14px; color: #666;">Medidores: ${meters}</div>
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
    <div className="space-y-8 animate-fade-in">
      {/* ========== ANÁLISE DE STATUS ========== */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Análise de Status
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Última atualização: {analysis.latestDate}</p>
        </div>
      </div>
      
      <p className="text-muted-foreground leading-relaxed">
        Esta seção apresenta o status atual das DCUs, permitindo a análise da saúde da rede AMI. São destacados os dispositivos com comportamento fora do esperado, como DCUs offline, não registradas ou online sem medidores. Também é possível acessar os relatórios da equipe I-NOC Nansen relacionados aos casos em análise.
      </p>

      {/* Primeira linha: Total, Online, Online sem Medidores */}
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

      {/* Segunda linha: Mapa de Localização */}
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

      {/* Terceira linha: DCUs por Status e Casos em Análise */}
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Casos em Análise
            </h3>
            <Button 
              size="sm"
              onClick={() => window.open('https://nansencombr-my.sharepoint.com/:w:/g/personal/evandro_silva_nansen_com_br/EdcsSnUwiHVJiVdhISWvZcMBEUgUg2enzLhd-BoBXhNaFQ?e=ORaU91', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Relatório
            </Button>
          </div>

          <div className="space-y-3">
            {/* Status: Identificado */}
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 transition-transform" />
                  <span className="font-medium">Identificado</span>
                  <span className="text-sm text-muted-foreground">
                    ({analysis.analysisByStatus.identificado.length} casos)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-7">
                  {analysis.analysisByStatus.identificado.map((dcu) => {
                    const reason = getReasonForDCU(dcu, analysis.latestMeterColumn);
                    return (
                      <div key={dcu.DCU} className="p-3 rounded-md bg-background/30 border border-border/50">
                        <div className="font-medium text-sm">{dcu.DCU}</div>
                        <div className="text-xs text-muted-foreground mt-1">{reason}</div>
                      </div>
                    );
                  })}
                  {analysis.analysisByStatus.identificado.length === 0 && (
                    <div className="text-sm text-muted-foreground italic p-3">Nenhum caso identificado</div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Status: Em análise */}
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 transition-transform" />
                  <span className="font-medium">Em análise</span>
                  <span className="text-sm text-muted-foreground">
                    ({analysis.analysisByStatus.emAnalise.length} casos)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-7">
                  {analysis.analysisByStatus.emAnalise.map((dcu) => {
                    const reason = getReasonForDCU(dcu, analysis.latestMeterColumn);
                    return (
                      <div key={dcu.DCU} className="p-3 rounded-md bg-background/30 border border-border/50">
                        <div className="font-medium text-sm">{dcu.DCU}</div>
                        <div className="text-xs text-muted-foreground mt-1">{reason}</div>
                      </div>
                    );
                  })}
                  {analysis.analysisByStatus.emAnalise.length === 0 && (
                    <div className="text-sm text-muted-foreground italic p-3">Nenhum caso em análise</div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Status: Aguardando atuação */}
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 transition-transform" />
                  <span className="font-medium">Aguardando atuação</span>
                  <span className="text-sm text-muted-foreground">
                    ({analysis.analysisByStatus.aguardandoAtuacao.length} casos)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-7">
                  {analysis.analysisByStatus.aguardandoAtuacao.map((dcu) => {
                    const reason = getReasonForDCU(dcu, analysis.latestMeterColumn);
                    return (
                      <div key={dcu.DCU} className="p-3 rounded-md bg-background/30 border border-border/50">
                        <div className="font-medium text-sm">{dcu.DCU}</div>
                        <div className="text-xs text-muted-foreground mt-1">{reason}</div>
                      </div>
                    );
                  })}
                  {analysis.analysisByStatus.aguardandoAtuacao.length === 0 && (
                    <div className="text-sm text-muted-foreground italic p-3">Nenhum caso aguardando atuação</div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Status: Solucionado */}
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 transition-transform" />
                  <span className="font-medium">Solucionado</span>
                  <span className="text-sm text-muted-foreground">
                    ({analysis.analysisByStatus.solucionado.length} casos)
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-7">
                  {analysis.analysisByStatus.solucionado.map((dcu) => {
                    const reason = getReasonForDCU(dcu, analysis.latestMeterColumn);
                    return (
                      <div key={dcu.DCU} className="p-3 rounded-md bg-background/30 border border-border/50">
                        <div className="font-medium text-sm">{dcu.DCU}</div>
                        <div className="text-xs text-muted-foreground mt-1">{reason}</div>
                      </div>
                    );
                  })}
                  {analysis.analysisByStatus.solucionado.length === 0 && (
                    <div className="text-sm text-muted-foreground italic p-3">Nenhum caso solucionado</div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </Card>
      </div>

      {/* ========== ANÁLISE DE CARGA ========== */}
      <div className="flex items-center justify-between border-b border-border pb-4 pt-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Análise de Carga
          </h2>
        </div>
      </div>
      
      <p className="text-muted-foreground leading-relaxed">
        Esta seção exibe a carga atual das DCUs, destacando aquelas que estão sobrecarregadas, subcarregadas ou sem medidores vinculados. Também são apresentados os casos em análise, com acesso aos relatórios técnicos correspondentes.
      </p>

      {/* Primeira linha: DCUs Críticas (Donut) e DCUs em Análise (Barras) */}
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
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

        {/* Gráfico de Barras - DCUs em Análise */}
        {analysis.commentCounts.length > 0 && (
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                DCUs em Análise
              </h3>
              <Button 
                size="sm"
                onClick={() => window.open('https://nansencombr-my.sharepoint.com/:w:/g/personal/graziele_souza_nansen_com_br/ES3VFQF59G9En61f6228DaEB4lgGndrCreZLDkNPbicYzw?e=e58fq7', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            </div>
            <div className="flex items-center justify-center mb-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {analysis.commentCounts.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total de DCUs em Análise</p>
              </div>
            </div>
            <div className="flex justify-center">
              <ResponsiveContainer width="95%" height={220}>
                <BarChart data={analysis.commentCounts}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    angle={0}
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax + 5']}
                    allowDecimals={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Bar 
                    dataKey="count" 
                    radius={[8, 8, 0, 0]}
                  >
                    {analysis.commentCounts.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Segunda linha: Mapa de DCUs Críticas */}
      <CriticalDCUsMap 
        data={analysis.latestData}
        overloaded={analysis.overloaded}
        underloaded={analysis.underloaded}
        noMeters={analysis.noMeters}
        latestMeterColumn={analysis.latestMeterColumn}
        mapboxToken={mapboxToken}
      />

      {/* Terceira linha: Sobrecarregadas, Pouca Carga e Sem Medidores */}
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

      {/* Quarta linha: Tabela com Filtro por Comentário */}
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

      {/* ========== ANÁLISE HISTÓRICA ========== */}
      <div className="flex items-center justify-between border-b border-border pb-4 pt-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Análise Histórica
          </h2>
        </div>
      </div>
      
      <p className="text-muted-foreground leading-relaxed">
        Esta seção apresenta uma análise histórica da carga nas DCUs, com foco nos 10 dispositivos que registraram maior variação ao longo do tempo. A visualização permite identificar padrões de oscilação e avaliar a estabilidade da rede.
      </p>

      {/* Primeira linha: Variação Histórica e Top 10 Desvios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Gráfico de Linhas - Variação Histórica Top 10 */}
        {analysis.top10Deviations.length > 0 && (
          <Card className="p-6 border border-border bg-card md:col-span-3">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Variação Histórica - Top 10 DCUs
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analysis.trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  angle={0}
                  height={50}
                  tickFormatter={(value) => {
                    const [day, month] = value.split('.');
                    return `${day}/${month}`;
                  }}
                />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
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
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                {analysis.top10Deviations.map((dcuData, idx) => {
                  const isVisible = visibleDCUs.size === 0 || visibleDCUs.has(dcuData.dcu);
                  return (
                    <Line
                      key={idx}
                      type="monotone"
                      dataKey={`DCU${idx + 1}`}
                      name={dcuData.dcu}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      hide={!isVisible}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top 10 DCUs com Maior Desvio */}
        <Card className="p-6 border border-border bg-card md:col-span-1">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Top 10 Desvios
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {analysis.top10Deviations.map((dcuData, idx) => {
              const isVisible = visibleDCUs.size === 0 || visibleDCUs.has(dcuData.dcu);
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                    isVisible ? 'bg-background/50' : 'bg-muted/30 opacity-50'
                  }`}
                  onClick={() => {
                    const newVisible = new Set(visibleDCUs);
                    if (newVisible.has(dcuData.dcu)) {
                      newVisible.delete(dcuData.dcu);
                    } else {
                      newVisible.add(dcuData.dcu);
                    }
                    setVisibleDCUs(newVisible);
                  }}
                >
                  <span className="font-mono font-semibold flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {idx + 1}. {dcuData.dcu}
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-destructive">{dcuData.latestValue}</div>
                    <div className="text-muted-foreground text-xs">
                      Δ {Math.round(dcuData.deviation)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Clique no ID da DCU para filtrar
            </p>
            {visibleDCUs.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleDCUs(new Set())}
                className="w-full text-xs"
              >
                Voltar (mostrar todas)
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Linha divisória antes do rodapé */}
      <div className="relative my-8">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Rodapé com Informações de Contato */}
      <div className="relative bg-card/30 backdrop-blur-sm">
        <div className="p-8">
        <div className="flex flex-col items-center mb-6">
          <img 
            src={nansenLogo} 
            alt="Nansen Logo" 
            className="h-12 w-auto mb-4" 
          />
          <h3 className="text-xl font-semibold mb-2">Equipe I-NOC Nansen</h3>
          <p className="text-muted-foreground text-center">
            Para dúvidas ou mais informações sobre este dashboard, entre em contato com nossa equipe:
          </p>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-start md:items-center gap-8 max-w-4xl mx-auto">
          <div className="flex-1 text-center space-y-2">
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider">Responsável pelo Dashboard</p>
            <p className="text-lg font-medium text-foreground">Graziele Souza</p>
            <a 
              href="mailto:graziele.souza@nansen.com.br" 
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
            >
              graziele.souza@nansen.com.br
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <div className="hidden md:block w-px h-24 bg-border"></div>
          
          <div className="flex-1 text-center space-y-2">
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider">Revisor</p>
            <p className="text-lg font-medium text-foreground">Evandro Silva</p>
            <a 
              href="mailto:evandro.silva@nansen.com.br" 
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
            >
              evandro.silva@nansen.com.br
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="hidden md:block w-px h-24 bg-border"></div>

          <div className="flex-1 text-center space-y-2">
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider">Coordenador do Projeto</p>
            <p className="text-lg font-medium text-foreground">Alisson Ribeiro</p>
            <a 
              href="mailto:alisson.ribeiro@nansen.com.br" 
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
            >
              alisson.ribeiro@nansen.com.br
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
