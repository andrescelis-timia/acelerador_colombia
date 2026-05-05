export interface Column {
  header: string;
  accessor: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  truncate?: boolean;
  maxWidth?: string;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  renderActions?: (item: T) => React.ReactNode;
} 