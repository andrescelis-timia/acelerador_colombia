import { ObjectTableData } from "@/services/Object/types";

export interface ObjectContentProps {
  data: ObjectTableData[];
  onSearch: (term: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  currentPage: number;
  setCurrentPage: (value: number | ((prevValue: number) => number)) => void;
  itemsPerPage: number;
  totalItems: number;
  projectId?: string | null;
} 