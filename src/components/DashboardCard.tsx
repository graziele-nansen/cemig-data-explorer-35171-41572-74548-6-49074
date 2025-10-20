import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const DashboardCard = ({ title, icon, children, className = "" }: DashboardCardProps) => {
  return (
    <Card className={`backdrop-blur-sm bg-card/80 border-border/50 hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
