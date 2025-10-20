import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (data: any[], fileName: string) => void;
  title: string;
  description: string;
}

export const FileUpload = ({ onFileUpload, title, description }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.error('Arquivo vazio');
      return [];
    }
    
    // Detectar delimitador (Tab, vírgula ou ponto-e-vírgula)
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    }
    
    console.log('Delimitador detectado:', delimiter === '\t' ? 'TAB' : delimiter);
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    console.log('Headers encontrados:', headers);
    
    const data = lines.slice(1).map((line, idx) => {
      const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || null;
        obj[header] = value;
      });
      
      if (idx < 3) {
        console.log('Exemplo de linha:', obj);
      }
      
      return obj;
    }).filter(obj => {
      // Filtrar linhas completamente vazias
      return Object.values(obj).some(v => v !== null && v !== '');
    });
    
    console.log(`Total de linhas parseadas: ${data.length}`);
    return data;
  };

  const transformWideToLong = (data: any[]): any[] => {
    if (data.length === 0) return data;

    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Detectar se é formato largo de medidores: tem colunas "Status XX.XX.XXXX" e "DCU XX.XX.XXXX"
    const statusDateColumns = columns.filter(col => col.startsWith('Status ') && col.match(/\d{2}\.\d{2}\.\d{4}/));
    const dcuDateColumns = columns.filter(col => col.startsWith('DCU ') && col.match(/\d{2}\.\d{2}\.\d{4}/));
    
    // Detectar se é formato largo de DCUs: tem colunas "Meters XX.XX.XXXX"
    const metersDateColumns = columns.filter(col => col.startsWith('Meters ') && col.match(/\d{2}\.\d{2}\.\d{4}/));
    
    if (statusDateColumns.length > 0 && dcuDateColumns.length > 0) {
      // Formato largo de medidores (transformar para longo)
      console.log('Detectado formato largo de medidores - transformando');
      const longData: any[] = [];
      
      statusDateColumns.forEach(statusCol => {
        const dateMatch = statusCol.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (!dateMatch) return;
        
        const date = dateMatch[1];
        const dcuCol = `DCU ${date}`;
        
        data.forEach(row => {
          longData.push({
            'Meter Number': row['Meter Number'],
            'LAT': row['LAT'],
            'LONG': row['LONG'],
            'Status': row[statusCol],
            'DCU': row[dcuCol],
            'Data': date
          });
        });
      });
      
      console.log(`Transformado ${data.length} linhas em ${longData.length} registros`);
      return longData;
    } else if (metersDateColumns.length > 0) {
      // Formato largo de DCUs - MANTER FORMATO LARGO (não transformar)
      console.log('Detectado formato largo de DCUs - mantendo formato largo');
      console.log(`Total de ${data.length} DCUs com ${metersDateColumns.length} datas`);
      return data;
    }
    
    // Se não é formato largo, retornar como está
    console.log('Formato detectado - sem transformação necessária');
    return data;
  };

  const handleFile = async (file: File) => {
    try {
      console.log('Processando arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);
      
      let data: any[] = [];
      
      // Detectar tipo de arquivo
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Processar arquivo Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(firstSheet);
        console.log('Excel parseado com sucesso:', data.length, 'registros');
        console.log('Primeiras 3 linhas:', data.slice(0, 3));
      } else {
        // Processar arquivo CSV/TSV
        const text = await file.text();
        console.log('Primeiras 500 caracteres do arquivo:', text.substring(0, 500));
        data = parseCSV(text);
      }
      
      if (data.length === 0) {
        toast({
          title: "Erro",
          description: "Arquivo vazio ou formato inválido.",
          variant: "destructive",
        });
        return;
      }

      // Transformar formato largo para longo se necessário
      data = transformWideToLong(data);

      console.log('Dados parseados com sucesso:', data.length, 'registros');
      onFileUpload(data, file.name);
      
      toast({
        title: "Sucesso",
        description: `${data.length} registros carregados de ${file.name}`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Arraste o arquivo aqui ou clique para selecionar
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls,.csv,.txt,.tsv';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          Selecionar Arquivo
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Formatos: Excel (.xlsx, .xls), CSV, TSV
        </p>
      </div>
    </Card>
  );
};
