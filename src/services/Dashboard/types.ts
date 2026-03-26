export interface DashboardStats {
  projects: {
    total: number;
    by_status: {
      pending: number;
      in_progress: number;
      completed: number;
    };
  };
  objects: {
    total: number;
    by_status: {
      pending: number;
      in_progress: number;
      completed: number;
    };
  };
  phases: Record<string, {
    completed: number;
    total: number;
    label: string;
  }>;
  projects_detail: {
    name: string;
    total_objects: number;
    completed_objects: number;
  }[];
  recent_activity: {
    project_name: string;
    object_name: string;
    action: string;
    timestamp: string;
  }[];
  objects_by_month: {
    label: string;
    value: number;
  }[];
}
