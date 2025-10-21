import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { AlertCircle } from "lucide-react";
import { AnalyzedData, detectAnomalies } from "./DataAnalyzer";

interface AnalysisPageProps {
  data: any[];
  analysis: AnalyzedData;
}

export const AnalysisPage = ({ data, analysis }: AnalysisPageProps) => {
  // Compare numeric columns
  const numericComparison = analysis.numberColumns.slice(0, 5).map((col) => {
    const values = data.map((row) => Number(row[col])).filter((v) => !isNaN(v));
    return {
      name: col,
      média: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      mínimo: Math.min(...values),
      máximo: Math.max(...values),
    };
  });

  // Detect anomalies
  const anomalies = analysis.numberColumns[0]
    ? detectAnomalies(data, analysis.numberColumns[0])
    : [];

  // Scatter plot data
  const scatterData =
    analysis.numberColumns.length >= 2
      ? data.slice(0, 100).map((row) => ({
          x: Number(row[analysis.numberColumns[0]]) || 0,
          y: Number(row[analysis.numberColumns[1]]) || 0,
        }))
      : [];

  return (
    <div className="space-y-6">
      {/* Numeric Comparison */}
      {numericComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Campos Numéricos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={numericComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Bar dataKey="média" fill="hsl(var(--primary))" />
                <Bar dataKey="mínimo" fill="hsl(var(--secondary))" />
                <Bar dataKey="máximo" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Scatter Plot */}
      {scatterData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Correlação: {analysis.numberColumns[0]} vs {analysis.numberColumns[1]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={analysis.numberColumns[0]} />
                <YAxis dataKey="y" name={analysis.numberColumns[1]} />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Scatter data={scatterData} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Anomalies Detection */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Anomalias Detectadas em {analysis.numberColumns[0]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {anomalies.length} registro(s) com valores fora do padrão (±2 desvios padrão)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {analysis.columns.slice(0, 5).map((col) => (
                      <th key={col.name} className="p-2 text-left font-medium">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anomalies.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b bg-destructive/10">
                      {analysis.columns.slice(0, 5).map((col) => (
                        <td key={col.name} className="p-2">
                          {String(row[col.name] || "-")}
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
    </div>
  );
};