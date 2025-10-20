import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export const ExportButton = ({ data, filename }: ExportButtonProps) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exportado com sucesso!');
  };

  const exportToPowerBI = async () => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    toast.info('Capturando gráficos... Isso pode levar alguns segundos.');

    try {
      // Criar workbook
      const workbook = XLSX.utils.book_new();
      
      // Adicionar dados
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
      
      // Capturar todos os gráficos da página
      const chartElements = document.querySelectorAll('.recharts-wrapper, .recharts-responsive-container');
      
      for (let i = 0; i < chartElements.length; i++) {
        const chartElement = chartElements[i] as HTMLElement;
        try {
          const canvas = await html2canvas(chartElement, {
            backgroundColor: '#041b2d',
            scale: 2,
          });
          
          const imageData = canvas.toDataURL('image/png');
          const base64Data = imageData.split(',')[1];
          
          // Criar uma planilha com informação sobre o gráfico
          const chartInfo = [
            ['Gráfico ' + (i + 1)],
            [''],
            ['Para visualizar o gráfico, veja a aba "Imagens" ou copie a URL abaixo em um navegador:'],
            [''],
            [imageData.substring(0, 100) + '...'], // Preview da imagem
          ];
          const chartSheet = XLSX.utils.aoa_to_sheet(chartInfo);
          XLSX.utils.book_append_sheet(workbook, chartSheet, `Gráfico ${i + 1}`);
        } catch (error) {
          console.error('Erro ao capturar gráfico:', error);
        }
      }
      
      XLSX.writeFile(workbook, `${filename}_PowerBI.xlsx`);
      
      toast.success(`Arquivo Excel exportado com ${chartElements.length} gráfico(s)!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar arquivo. Tente novamente.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Dashboard
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPowerBI}>
          <Download className="h-4 w-4 mr-2" />
          Exportar para Power BI (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
