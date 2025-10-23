import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface DCUData {
  DCU: string;
  Status: string;
  Comentário: string;
  LAT: string;
  LONG: string;
  [key: string]: string;
}

interface CriticalDCUsMapProps {
  data: DCUData[];
  overloaded: DCUData[];
  underloaded: DCUData[];
  noMeters: DCUData[];
  latestMeterColumn: string;
  mapboxToken: string;
}

export const CriticalDCUsMap = ({
  data,
  overloaded,
  underloaded,
  noMeters,
  latestMeterColumn,
  mapboxToken,
}: CriticalDCUsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Combinar todas as DCUs críticas
    const criticalDCUs = [...overloaded, ...underloaded, ...noMeters];

    // Filtrar DCUs com coordenadas válidas e excluir DCUs 715 e 642
    const dcusWithCoords = criticalDCUs.filter(d => {
      const lat = parseFloat(d.LAT);
      const long = parseFloat(d.LONG);
      const dcuId = String(d.DCU || '');
      // Excluir DCUs 715 e 642
      if (dcuId === '715' || dcuId === '642') return false;
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
      const meters = dcu[latestMeterColumn] ? parseInt(dcu[latestMeterColumn]) : 0;
      
      let color = 'hsl(215 20% 65%)'; // Sem medidores (cinza)
      let label = 'Sem medidores';
      let emoji = '⚪';
      
      if (overloaded.find(d => d.DCU === dcu.DCU)) {
        color = 'hsl(var(--destructive))';
        label = 'Sobrecarga';
        emoji = '🔴';
      } else if (underloaded.find(d => d.DCU === dcu.DCU)) {
        color = 'hsl(var(--warning))';
        label = 'Subcarga';
        emoji = '🟡';
      }

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = color;
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 12px; min-width: 150px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">DCU: ${dcu.DCU}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Tipo: ${label}</div>
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
  }, [mapboxToken, overloaded, underloaded, noMeters, latestMeterColumn]);

  if (overloaded.length === 0 && underloaded.length === 0 && noMeters.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border border-border bg-card">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-destructive" />
        Mapa de DCUs Críticas
      </h3>
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }}></div>
          <span className="text-sm">Sobrecarga ({overloaded.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }}></div>
          <span className="text-sm">Subcarga ({underloaded.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(215 20% 65%)' }}></div>
          <span className="text-sm">Sem medidores ({noMeters.length})</span>
        </div>
      </div>
      <div ref={mapContainer} className="h-[400px] rounded-lg" />
    </Card>
  );
};
