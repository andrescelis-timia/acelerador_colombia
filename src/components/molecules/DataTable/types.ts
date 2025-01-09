export interface Column {
  header: string;
  accessor: string;
  render?: (value: unknown) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  renderActions?: (item: T) => React.ReactNode;
} 