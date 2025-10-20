import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DCUDashboard } from '@/components/DCUDashboard';
import { NansenHeader } from '@/components/NansenHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [dcuData, setDcuData] = useState<any[]>([]);

  return (
    <div className="min-h-screen">
      <NansenHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Monitoração da rede AMI CEMIG
          </h2>
          <p className="text-muted-foreground mt-2">Equipe de I-NOC Nansen</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="dcus">DCUs</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload
              title="CARGA-DAS-DCUS"
              description="Upload do arquivo de carga das DCUs (formato TSV/CSV)"
              onFileUpload={(data, fileName) => {
                setDcuData(data);
                console.log('DCU data loaded:', data.length, 'records');
              }}
            />

            {dcuData.length > 0 && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <p className="text-success font-medium">
                  ✓ Dados carregados com sucesso! Use a aba DCUs acima para visualizar o dashboard.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dcus">
            <DCUDashboard data={dcuData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
