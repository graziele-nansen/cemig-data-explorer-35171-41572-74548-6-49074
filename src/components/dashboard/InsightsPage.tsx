import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertTriangle, CheckCircle2, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InsightsPageProps {
  data: any[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const InsightsPage = ({ data }: InsightsPageProps) => {
  const [showOnlyWithComments, setShowOnlyWithComments] = useState(false);

  // Find DCU column (case insensitive)
  const dcuColumn = Object.keys(data[0] || {}).find(
    (key) => key.toLowerCase().includes("dcu")
  );

  // Find Status column
  const statusColumn = Object.keys(data[0] || {}).find(
    (key) => key.toLowerCase() === "status"
  );

  // Find Meter Number column
  const meterColumn = Object.keys(data[0] || {}).find(
    (key) => key.toLowerCase().includes("meter")
  );

  // Find Comentário column
  const commentColumn = Object.keys(data[0] || {}).find(
    (key) => key.toLowerCase().includes("comentário") || key.toLowerCase().includes("comentario")
  );

  // Piores casos de carga DCU (> 850 ou < 50 meters)
  const worstCases = dcuColumn
    ? data.filter((row) => {
        const dcuValue = Number(row[dcuColumn]);
        return !isNaN(dcuValue) && (dcuValue > 850 || dcuValue < 50);
      })
    : [];

  // Agrupar por status
  const statusData = statusColumn
    ? Object.entries(
        data.reduce((acc: any, row) => {
          const status = row[statusColumn] || "Sem Status";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Filtrar dados com comentários
  const filteredData = showOnlyWithComments && commentColumn
    ? data.filter((row) => row[commentColumn] && row[commentColumn] !== null && row[commentColumn] !== "")
    : data;

  const dataWithComments = commentColumn
    ? data.filter((row) => row[commentColumn] && row[commentColumn] !== null && row[commentColumn] !== "")
    : [];

  return (
    <div className="space-y-6">
      {/* Piores Casos de Carga DCU */}
      {worstCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Piores Casos de Carga DCU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {worstCases.length} DCU(s) com carga crítica (&gt; 850 ou &lt; 50 meters)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {Object.keys(worstCases[0] || {}).slice(0, 6).map((key) => (
                      <th key={key} className="text-left p-3 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {worstCases.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      {Object.keys(worstCases[0]).slice(0, 6).map((key) => (
                        <td key={key} className="p-3">
                          {key === dcuColumn && (
                            <span className={Number(row[key]) > 850 || Number(row[key]) < 50 ? "text-destructive font-semibold" : ""}>
                              {String(row[key])}
                            </span>
                          )}
                          {key !== dcuColumn && String(row[key] || "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Pizza - Status dos Medidores */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center">
                <h4 className="font-semibold mb-4">Resumo por Status</h4>
                <div className="space-y-2">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold">{String(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro de Comentários */}
      {commentColumn && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Comentários
            </CardTitle>
            <Button
              variant={showOnlyWithComments ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyWithComments(!showOnlyWithComments)}
            >
              {showOnlyWithComments ? "Mostrar Todos" : "Apenas com Comentários"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {dataWithComments.length} registro(s) com comentários
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {Object.keys(filteredData[0] || {}).map((key) => (
                      <th key={key} className="text-left p-3 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      {Object.keys(filteredData[0]).map((key, i) => (
                        <td key={`${key}-${i}`} className="p-3">
                          {key === commentColumn && row[key] ? (
                            <span className="text-primary font-medium">{String(row[key])}</span>
                          ) : (
                            <>{String(row[key] || "-")}</>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Mostrando 10 de {filteredData.length} registros
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
