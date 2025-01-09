import { ProjectCreate, ProjectUpdateWithId } from "@/services/Project/types";

export interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProjectCreate | ProjectUpdateWithId;
  projectId?: string;
} 