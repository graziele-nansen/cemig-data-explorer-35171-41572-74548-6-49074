import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DCUData {
  DCU: string;
  'Taxa de coleta'?: string;
  LAT: string;
  LONG: string;
  [key: string]: string | undefined;
}

interface CollectionRateMapProps {
  data: DCUData[];
  latestMeterColumn: string;
  mapboxToken: string;
}

export const CollectionRateMap = ({ data, latestMeterColumn, mapboxToken }: CollectionRateMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !data) return;

    // Filtrar DCUs com coordenadas válidas e taxa de coleta
    const dcusWithCoords = data.filter(d => {
      const lat = parseFloat(d.LAT);
      const long = parseFloat(d.LONG);
      const hasValidCoords = !isNaN(lat) && !isNaN(long) && 
             lat >= -90 && lat <= 90 && 
             long >= -180 && long <= 180 &&
             lat !== 0 && long !== 0;
      const hasCollectionRate = d['Taxa de coleta'] && d['Taxa de coleta'] !== '' && d['Taxa de coleta'] !== '#N/D';
      return hasValidCoords && hasCollectionRate;
    });

    if (dcusWithCoords.length === 0) return;

    // Inicializar mapa
    mapboxgl.accessToken = mapboxToken;
    
    const initialLat = parseFloat(dcusWithCoords[0].LAT);
    const initialLong = parseFloat(dcusWithCoords[0].LONG);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [initialLong, initialLat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcadores
    dcusWithCoords.forEach(dcu => {
      const lat = parseFloat(dcu.LAT);
      const long = parseFloat(dcu.LONG);
      
      if (lat < -90 || lat > 90 || long < -180 || long > 180) {
        console.warn(`Coordenadas inválidas para DCU ${dcu.DCU}: lat=${lat}, long=${long}`);
        return;
      }
      
      const collectionRate = parseFloat(dcu['Taxa de coleta']?.replace('%', '') || '0');
      
      let color = 'hsl(var(--success))'; // >= 95% (verde)
      if (collectionRate < 90) {
        color = 'hsl(var(--destructive))'; // < 90% (vermelho)
      } else if (collectionRate < 95) {
        color = 'hsl(var(--warning))'; // 90-95% (amarelo)
      }

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = color;
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const meters = dcu[latestMeterColumn] || '0';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 12px; min-width: 180px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">DCU: ${dcu.DCU}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Taxa de Coleta: ${collectionRate.toFixed(1)}%</div>
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
  }, [data, latestMeterColumn, mapboxToken]);

  return <div ref={mapContainer} className="h-[400px] rounded-lg" />;
};
