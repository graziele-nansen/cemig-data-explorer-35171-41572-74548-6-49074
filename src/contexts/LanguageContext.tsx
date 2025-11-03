import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Header
    'header.tagline': 'A ENERGIA QUE MOVE O BRASIL\nPASSA PELA NOSSA TECNOLOGIA',
    'header.title': 'Monitoração da Rede AMI CEMIG',
    'header.subtitle': 'Equipe de I-NOC Nansen',
    
    // Loading
    'loading': 'Carregando dados...',
    'no-data.title': 'Nenhum dado carregado',
    'no-data.description': 'Envie os dados de DCUs via chat para visualizar o dashboard',
    
    // Status Analysis
    'status.title': 'Análise de Status',
    'status.description': 'Esta seção apresenta o status atual das DCUs, permitindo a análise da saúde da rede AMI. São destacados os dispositivos com comportamento fora do esperado, como DCUs offline, não registradas ou online sem medidores. Também é possível acessar os relatórios da equipe I-NOC Nansen relacionados aos casos em análise.',
    'status.last-update': 'Última atualização',
    'status.total-dcus': 'Total de DCUs',
    'status.online-dcus': 'DCUs Online',
    'status.online-no-meters': 'Online sem Medidores',
    'status.location-title': 'Localização das DCUs',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.not-registered': 'Não Registrado',
    'status.dcus-by-status': 'DCUs por Status',
    'status.attention-cases': 'Casos de Atenção',
    'status.offline-dcus': 'DCUs Offline',
    'status.not-registered-dcus': 'DCUs Não registradas',
    'status.online-no-meters-dcus': 'DCUs Online sem medidores',
    'status.attention-percentage': 'Casos de atenção representam',
    'status.of-network': 'da rede',
    'status.cases-in-analysis': 'Casos em Análise',
    'status.report': 'Relatório',
    'status.identified': 'Identificado',
    'status.in-analysis': 'Em análise',
    'status.awaiting-action': 'Aguardando atuação',
    'status.solved': 'Solucionado',
    'status.no-cases': 'Nenhum caso',
    'status.normalized': 'Comportamento normalizado',
    'status.reason.not-registered': 'Status da DCU é não registrado',
    'status.reason.offline': 'Status da DCU é offline',
    'status.reason.online-no-meters': 'Status da DCU é online mas não contém medidores',
    'status.reason.unknown': 'Motivo não identificado',
    
    // Load Analysis
    'load.title': 'Análise de Carga',
    'load.description': 'Esta seção exibe a carga atual das DCUs, destacando aquelas que estão sobrecarregadas, subcarregadas ou sem medidores vinculados. Também são apresentados os casos em análise, com acesso aos relatórios técnicos correspondentes.',
    'load.critical-dcus': 'DCUs Críticas',
    'load.overload': 'Sobrecarga',
    'load.underload': 'Subcarga',
    'load.no-meters': 'Sem medidores',
    'load.dcus-in-analysis': 'DCUs em Análise',
    'load.total-in-analysis': 'Total de DCUs em Análise',
    'load.critical-dcus-map': 'Mapa de DCUs Críticas',
    'load.overloaded': 'Sobrecarregadas',
    'load.underloaded': 'Subcarregadas',
    'load.overloaded-title': 'Sobrecarregadas (>850 medidores)',
    'load.underloaded-title': 'Subcarregadas (<50 medidores)',
    'load.no-meters-title': 'Sem medidores',
    'load.more': 'mais',
    
    // Historical Analysis
    'history.title': 'Análise Histórica',
    'history.description': 'Esta seção apresenta uma análise histórica da carga nas DCUs, com foco nos 10 dispositivos que registraram maior variação ao longo do tempo. A visualização permite identificar padrões de oscilação e avaliar a estabilidade da rede.',
    'history.variation-title': 'Variação Histórica - Top 10 DCUs',
    'history.top-deviations': 'Top 10 Desvios',
    'history.click-to-filter': 'Clique no ID da DCU para filtrar',
    'history.show-all': 'Voltar (mostrar todas)',
    
    // Collection Rate Analysis
    'collection.title': 'Análise de Taxa de Coleta Diária',
    'collection.description': 'Esta seção apresenta a taxa de coleta diária reportada pelo MDC. A falha ou sucesso de cada medidor impacta diretamente na taxa da DCU à qual ele está conectado.',
    'collection.map-title': 'Mapa de Taxa de Coleta',
    'collection.distribution-title': 'Distribuição de Taxa de Coleta',
    'collection.indicators-title': 'Indicadores de Taxa de Coleta',
    'collection.below-95': 'Taxa de sucesso abaixo de 95%',
    'collection.between-95-98': 'Taxa de sucesso entre 95% e 98%',
    'collection.above-98': 'Taxa de sucesso acima de 98%',
    'collection.dcus': 'DCUs',
    'collection.no-data': 'Dados de taxa de coleta não disponíveis',
    'collection.scatter-title': 'Dispersão: Carga vs Taxa de Coleta',
    'collection.filter-overloaded': 'Região de DCUs sobrecarregadas (>850)',
    'collection.filter-low-rate': 'Região de taxa de coleta baixa (<95%)',
    'collection.reset-graph': 'Voltar ao gráfico original',
    'collection.x-axis': 'Taxa de coleta (% sucessos)',
    'collection.y-axis': 'Carga (Qtd. medidores)',
    'collection.rate': 'Taxa',
    'collection.load': 'Carga',
    'collection.meters': 'medidores',
    
    // Reviewers
    'reviewers.title': 'Revisores',
    'reviewers.reviewed-by': 'Revisado por',
  },
  en: {
    // Header
    'header.tagline': 'THE ENERGY THAT MOVES BRAZIL\nGOES THROUGH OUR TECHNOLOGY',
    'header.title': 'CEMIG AMI Network Monitoring',
    'header.subtitle': 'I-NOC Nansen Team',
    
    // Loading
    'loading': 'Loading data...',
    'no-data.title': 'No data loaded',
    'no-data.description': 'Send DCU data via chat to view the dashboard',
    
    // Status Analysis
    'status.title': 'Status Analysis',
    'status.description': 'This section presents the current status of DCUs, allowing analysis of AMI network health. Devices with unexpected behavior are highlighted, such as offline DCUs, unregistered, or online without meters. Reports from the I-NOC Nansen team related to cases under analysis are also accessible.',
    'status.last-update': 'Last update',
    'status.total-dcus': 'Total DCUs',
    'status.online-dcus': 'Online DCUs',
    'status.online-no-meters': 'Online without Meters',
    'status.location-title': 'DCU Location',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.not-registered': 'Not Registered',
    'status.dcus-by-status': 'DCUs by Status',
    'status.attention-cases': 'Attention Cases',
    'status.offline-dcus': 'Offline DCUs',
    'status.not-registered-dcus': 'Unregistered DCUs',
    'status.online-no-meters-dcus': 'Online DCUs without meters',
    'status.attention-percentage': 'Attention cases represent',
    'status.of-network': 'of the network',
    'status.cases-in-analysis': 'Cases Under Analysis',
    'status.report': 'Report',
    'status.identified': 'Identified',
    'status.in-analysis': 'Under Analysis',
    'status.awaiting-action': 'Awaiting Action',
    'status.solved': 'Solved',
    'status.no-cases': 'No cases',
    'status.normalized': 'Behavior normalized',
    'status.reason.not-registered': 'DCU status is not registered',
    'status.reason.offline': 'DCU status is offline',
    'status.reason.online-no-meters': 'DCU status is online but contains no meters',
    'status.reason.unknown': 'Reason not identified',
    
    // Load Analysis
    'load.title': 'Load Analysis',
    'load.description': 'This section displays the current load of DCUs, highlighting those that are overloaded, underloaded, or without linked meters. Cases under analysis are also presented, with access to corresponding technical reports.',
    'load.critical-dcus': 'Critical DCUs',
    'load.overload': 'Overload',
    'load.underload': 'Underload',
    'load.no-meters': 'No meters',
    'load.dcus-in-analysis': 'DCUs Under Analysis',
    'load.total-in-analysis': 'Total DCUs Under Analysis',
    'load.critical-dcus-map': 'Critical DCUs Map',
    'load.overloaded': 'Overloaded',
    'load.underloaded': 'Underloaded',
    'load.overloaded-title': 'Overloaded (>850 meters)',
    'load.underloaded-title': 'Underloaded (<50 meters)',
    'load.no-meters-title': 'No meters',
    'load.more': 'more',
    
    // Historical Analysis
    'history.title': 'Historical Analysis',
    'history.description': 'This section presents a historical analysis of DCU load, focusing on the 10 devices that recorded the greatest variation over time. The visualization allows identifying oscillation patterns and evaluating network stability.',
    'history.variation-title': 'Historical Variation - Top 10 DCUs',
    'history.top-deviations': 'Top 10 Deviations',
    'history.click-to-filter': 'Click on DCU ID to filter',
    'history.show-all': 'Back (show all)',
    
    // Collection Rate Analysis
    'collection.title': 'Daily Collection Rate Analysis',
    'collection.description': 'This section presents the daily collection rate reported by the MDC. The failure or success of each meter directly impacts the rate of the DCU to which it is connected.',
    'collection.map-title': 'Collection Rate Map',
    'collection.distribution-title': 'Collection Rate Distribution',
    'collection.indicators-title': 'Collection Rate Indicators',
    'collection.below-95': 'Success rate below 95%',
    'collection.between-95-98': 'Success rate between 95% and 98%',
    'collection.above-98': 'Success rate above 98%',
    'collection.dcus': 'DCUs',
    'collection.no-data': 'Collection rate data not available',
    'collection.scatter-title': 'Scatter: Load vs Collection Rate',
    'collection.filter-overloaded': 'Overloaded DCU region (>850)',
    'collection.filter-low-rate': 'Low collection rate region (<95%)',
    'collection.reset-graph': 'Back to original graph',
    'collection.x-axis': 'Collection rate (% success)',
    'collection.y-axis': 'Load (Qty. meters)',
    'collection.rate': 'Rate',
    'collection.load': 'Load',
    'collection.meters': 'meters',
    
    // Reviewers
    'reviewers.title': 'Reviewers',
    'reviewers.reviewed-by': 'Reviewed by',
  }
};
