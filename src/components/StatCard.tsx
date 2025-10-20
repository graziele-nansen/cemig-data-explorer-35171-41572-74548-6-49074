import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export const StatCard = ({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) => {
  const variantClasses = {
    default: 'border-primary/20',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
    success: 'border-success/30 bg-success/5',
  };

  const iconClasses = {
    default: 'text-primary',
    warning: 'text-warning',
    danger: 'text-destructive',
    success: 'text-success',
  };

  return (
    <Card className={`p-6 ${variantClasses[variant]} bg-card/50 backdrop-blur`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className={trend.value > 0 ? 'text-success' : 'text-destructive'}>
                {trend.value > 0 ? '+' : ''}{trend.value}
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-background/50 ${iconClasses[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
