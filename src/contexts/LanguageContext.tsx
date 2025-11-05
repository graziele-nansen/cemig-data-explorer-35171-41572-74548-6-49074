import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'pt' | 'en' | 'zh';

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
  },
  zh: {
    // Header
    'header.tagline': '推动巴西的能源\n通过我们的技术',
    'header.title': 'CEMIG AMI 网络监控',
    'header.subtitle': 'I-NOC Nansen 团队',
    
    // Loading
    'loading': '加载数据中...',
    'no-data.title': '未加载数据',
    'no-data.description': '通过聊天发送 DCU 数据以查看仪表板',
    
    // Status Analysis
    'status.title': '状态分析',
    'status.description': '本节介绍 DCU 的当前状态，允许分析 AMI 网络健康状况。突出显示具有意外行为的设备，例如离线 DCU、未注册或在线但无仪表。还可以访问与分析中的案例相关的 I-NOC Nansen 团队报告。',
    'status.last-update': '最后更新',
    'status.total-dcus': '总 DCU 数',
    'status.online-dcus': '在线 DCU',
    'status.online-no-meters': '在线无仪表',
    'status.location-title': 'DCU 位置',
    'status.online': '在线',
    'status.offline': '离线',
    'status.not-registered': '未注册',
    'status.dcus-by-status': '按状态分类的 DCU',
    'status.attention-cases': '注意案例',
    'status.offline-dcus': '离线 DCU',
    'status.not-registered-dcus': '未注册 DCU',
    'status.online-no-meters-dcus': '在线无仪表 DCU',
    'status.attention-percentage': '注意案例占',
    'status.of-network': '的网络',
    'status.cases-in-analysis': '分析中的案例',
    'status.report': '报告',
    'status.identified': '已识别',
    'status.in-analysis': '分析中',
    'status.awaiting-action': '等待行动',
    'status.solved': '已解决',
    'status.no-cases': '无案例',
    'status.normalized': '行为正常化',
    'status.reason.not-registered': 'DCU 状态未注册',
    'status.reason.offline': 'DCU 状态离线',
    'status.reason.online-no-meters': 'DCU 状态在线但不包含仪表',
    'status.reason.unknown': '原因未识别',
    
    // Load Analysis
    'load.title': '负载分析',
    'load.description': '本节显示 DCU 的当前负载，突出显示那些过载、负载不足或没有链接仪表的 DCU。还介绍了分析中的案例，并可访问相应的技术报告。',
    'load.critical-dcus': '关键 DCU',
    'load.overload': '过载',
    'load.underload': '负载不足',
    'load.no-meters': '无仪表',
    'load.dcus-in-analysis': '分析中的 DCU',
    'load.total-in-analysis': '分析中的 DCU 总数',
    'load.critical-dcus-map': '关键 DCU 地图',
    'load.overloaded': '过载',
    'load.underloaded': '负载不足',
    'load.overloaded-title': '过载 (>850 仪表)',
    'load.underloaded-title': '负载不足 (<50 仪表)',
    'load.no-meters-title': '无仪表',
    'load.more': '更多',
    
    // Historical Analysis
    'history.title': '历史分析',
    'history.description': '本节介绍 DCU 负载的历史分析，重点关注随时间变化最大的 10 个设备。该可视化允许识别波动模式并评估网络稳定性。',
    'history.variation-title': '历史变化 - 前 10 名 DCU',
    'history.top-deviations': '前 10 名偏差',
    'history.click-to-filter': '点击 DCU ID 进行筛选',
    'history.show-all': '返回（显示全部）',
    
    // Collection Rate Analysis
    'collection.title': '每日采集率分析',
    'collection.description': '本节介绍 MDC 报告的每日采集率。每个仪表的失败或成功直接影响其连接的 DCU 的率。',
    'collection.map-title': '采集率地图',
    'collection.distribution-title': '采集率分布',
    'collection.indicators-title': '采集率指标',
    'collection.below-95': '成功率低于 95%',
    'collection.between-95-98': '成功率在 95% 和 98% 之间',
    'collection.above-98': '成功率高于 98%',
    'collection.dcus': 'DCU',
    'collection.no-data': '采集率数据不可用',
    'collection.scatter-title': '散点图：负载 vs 采集率',
    'collection.filter-overloaded': '过载 DCU 区域 (>850)',
    'collection.filter-low-rate': '低采集率区域 (<95%)',
    'collection.reset-graph': '返回原始图表',
    'collection.x-axis': '采集率（% 成功）',
    'collection.y-axis': '负载（数量 仪表）',
    'collection.rate': '率',
    'collection.load': '负载',
    'collection.meters': '仪表',
    
    // Reviewers
    'reviewers.title': '审阅者',
    'reviewers.reviewed-by': '审阅者',
  }
};
