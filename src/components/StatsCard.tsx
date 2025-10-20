import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  gradient?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend, gradient = "from-primary to-primary-glow" }: StatsCardProps) => {
  return (
    <Card className="relative overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <p className={`text-xs font-medium ${trend >= 0 ? "text-secondary" : "text-destructive"}`}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
