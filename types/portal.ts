export type ProjectPhase =
  | "onboarding"
  | "design"
  | "development"
  | "review"
  | "launch"
  | "maintenance";

export type TaskStatus = "not_started" | "in_progress" | "completed";

export type FileCategory =
  | "brand_asset"
  | "document"
  | "content"
  | "deliverable";

export type ClientProfile = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
};

export type ClientProject = {
  id: string;
  client_id: string;
  project_name: string;
  package_name: string;
  current_phase: ProjectPhase;
  launch_window: string | null;
  next_step_title: string;
  next_step_description: string;
  domain: string | null;
  live_url: string | null;
  hosting_provider: string | null;
};

export type PhaseProgress = {
  phase: ProjectPhase;
  progress: number;
};

export type OnboardingStep = {
  id: string;
  step_order: number;
  title: string;
  description: string;
  status: TaskStatus;
  completed_at: string | null;
};

export type ProjectFile = {
  id: string;
  category: FileCategory;
  file_name: string;
  file_path: string;
  created_at: string;
};