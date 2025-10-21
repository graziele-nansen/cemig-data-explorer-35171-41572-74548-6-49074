import { useState, useMemo } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface MeterData {
  'Meter Number': string;
  LAT: string;
  LONG: string;
  Data: string;
  Status: string;
  DCU: string;
}

interface MapTabProps {
  data: MeterData[];
}

export const MapTab = ({ data }: MapTabProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { filteredData, dates, statuses } = useMemo(() => {
    if (!data || data.length === 0) {
      return { filteredData: [], dates: [], statuses: [] };
    }

    // Get unique dates and statuses
    const uniqueDates = [...new Set(data.map(d => d.Data))].sort();
    const uniqueStatuses = [...new Set(data.map(d => d.Status))].filter(Boolean);

    // Filter data based on selections
    let filtered = data.filter(meter => {
      // Skip invalid coordinates
      const lat = parseFloat(meter.LAT);
      const long = parseFloat(meter.LONG);
      
      // Check if coordinates are valid (exclude 0 values)
      if (isNaN(lat) || isNaN(long) || lat === 0 || long === 0) return false;
      if (lat < -20.5 || lat > -19.5 || long < -44.5 || long > -43.5) return false;

      // Apply filters
      const matchesStatus = statusFilter === 'all' || meter.Status === statusFilter;
      const matchesDate = dateFilter === 'all' || meter.Data === dateFilter;
      
      if (!matchesStatus || !matchesDate) return false;

      return true;
    });

    // Mapear para o formato esperado pelo InteractiveMap
    const mappedData = filtered.map(meter => ({
      ...meter,
      latitude: parseFloat(meter.LAT),
      longitude: parseFloat(meter.LONG),
    }));

    return {
      filteredData: mappedData,
      dates: uniqueDates,
      statuses: uniqueStatuses,
    };
  }, [data, statusFilter, dateFilter]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Carregue os dados de medidores para visualizar o mapa</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mapa de Distribuição dos Medidores e DCUs
        </h2>
      </div>

      {/* Filtros e Contador */}
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="space-y-2 flex-1">
              <Label htmlFor="status-filter">Filtrar por Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="date-filter">Filtrar por Data</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Datas</SelectItem>
                  {dates.map(date => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </Card>

      {/* Mapa */}
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
        <div className="h-[600px] rounded-lg overflow-hidden">
          <InteractiveMap data={filteredData} />
        </div>
      </Card>

      {/* Legenda de Cores */}
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Legenda de Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-sm">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-sm">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eab308' }} />
            <span className="text-sm">Queda de Energia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6b7280' }} />
            <span className="text-sm">Desativado</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
