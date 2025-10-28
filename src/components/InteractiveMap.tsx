import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ExcelData } from "@/types/dashboard";
import { toast } from "sonner";

interface InteractiveMapProps {
  data: ExcelData[];
}

export const InteractiveMap = ({ data }: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapboxToken = "pk.eyJ1IjoiZ3JhemllbGUtbmFuc2VuIiwiYSI6ImNtZ3ozdW9qMDF1M2cyc3B0MXphamhkbmYifQ.JxrSUz5Pd05pK7PXBDg2_w";

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      const validCoords = data.filter(
        (item) => {
          const lat = Number(item.LAT || item.latitude);
          const lng = Number(item.LONG || item.longitude);
          const dcuId = String(item.DCU || '');
          // Excluir DCUs 715 e 642
          if (dcuId === '715' || dcuId === '642') return false;
          // Validar se as coordenadas estão dentro dos limites válidos
          return lat && lng && !isNaN(lat) && !isNaN(lng) && 
                 lat >= -90 && lat <= 90 && 
                 lng >= -180 && lng <= 180 &&
                 lat !== 0 && lng !== 0;
        }
      );

      if (validCoords.length === 0) {
        toast.error("Nenhuma coordenada válida encontrada nos dados");
        return;
      }

      // Validar coordenadas do centro antes de criar o mapa
      const centerLat = Number(validCoords[0].LAT || validCoords[0].latitude);
      const centerLng = Number(validCoords[0].LONG || validCoords[0].longitude);
      
      if (centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
        toast.error("Coordenadas do centro inválidas");
        return;
      }

      const center: [number, number] = [centerLng, centerLat];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      validCoords.forEach((item) => {
        const lat = Number(item.LAT || item.latitude);
        const lng = Number(item.LONG || item.longitude);
        
        // Validação adicional antes de criar o marcador
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn(`Coordenadas inválidas para item: lat=${lat}, lng=${lng}`);
          return;
        }
        
        // Define cor baseada no Status
        let markerColor = "#0ea5e9"; // default
        const status = (item as any).Status;
        
        if (status) {
          switch (status.toLowerCase()) {
            case 'online':
              markerColor = "#22c55e"; // verde
              break;
            case 'offline':
              markerColor = "#ef4444"; // vermelho
              break;
            case 'queda de energia':
              markerColor = "#eab308"; // amarelo
              break;
            case 'desativado':
              markerColor = "#6b7280"; // cinza
              break;
          }
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            ${Object.entries(item)
              .filter(([key]) => key !== "latitude" && key !== "longitude" && key !== "LAT" && key !== "LONG")
              .map(([key, value]) => `<p class="text-sm"><strong>${key}:</strong> ${value}</p>`)
              .join("")}
          </div>`
        );

        // Criar elemento customizado para marcador circular
        const markerEl = document.createElement('div');
        markerEl.style.backgroundColor = markerColor;
        markerEl.style.width = '12px';
        markerEl.style.height = '12px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '2px solid white';
        markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        markerEl.style.cursor = 'pointer';

        new mapboxgl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      toast.success("Mapa carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao inicializar o mapa. Verifique seu token do Mapbox.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (data.length > 0 && mapboxToken && !map.current) {
      initializeMap();
    }
    
    return () => {
      map.current?.remove();
    };
  }, [data]);

  return (
    <div ref={mapContainer} className="w-full h-full min-h-[500px] rounded-lg shadow-xl border border-primary/20" />
  );
};
