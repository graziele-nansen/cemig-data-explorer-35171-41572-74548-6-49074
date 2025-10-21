import { useState, useEffect } from 'react';
import { DCUDashboard } from '@/components/DCUDashboard';
import { NansenHeader } from '@/components/NansenHeader';
import { loadDCUData } from '@/utils/loadDCUData';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [dcuData, setDcuData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do arquivo Excel
    loadDCUData().then(data => {
      setDcuData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NansenHeader />
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-lg text-muted-foreground">
                Carregando dados...
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NansenHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Monitoração da Rede AMI CEMIG
          </h1>
          <p className="text-lg text-muted-foreground">Equipe de I-NOC Nansen</p>
        </div>

        <DCUDashboard data={dcuData} />
      </div>
    </div>
  );
};

export default Index;
