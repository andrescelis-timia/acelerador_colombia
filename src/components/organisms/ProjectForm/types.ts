import { ProjectCreate, ProjectUpdateWithId } from "@/services/Project/types";

export interface ProjectFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  initialData?: ProjectCreate | ProjectUpdateWithId;
  projectId?: string;
} 