import { ProjectTableData } from '@/services/Project/types';

export interface ProjectContentProps {
  data: ProjectTableData[];
  onSearch: (term: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  currentPage: number;
  setCurrentPage: (value: number | ((prevValue: number) => number)) => void;
  itemsPerPage: number;
  totalItems: number;
} 
