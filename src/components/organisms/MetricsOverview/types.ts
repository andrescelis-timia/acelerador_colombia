export interface Metric {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  color: string;
}

export interface MetricsOverviewProps {
  metrics: Metric[];
  className?: string;
} 