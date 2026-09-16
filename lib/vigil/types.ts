import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Any typed client: the request-scoped RLS client or the service-role client. */
export type DbClient = SupabaseClient<Database>;

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Profile = Tables<"profiles">;
export type Organization = Tables<"organizations">;
export type OrganizationMember = Tables<"organization_members">;
export type OrganizationInvite = Tables<"organization_invites">;
export type StaffMember = Tables<"staff_members">;
export type Plan = Tables<"plans">;
export type PlanPrice = Tables<"plan_prices">;
export type Feature = Tables<"features">;
export type PlanFeature = Tables<"plan_features">;
export type Subscription = Tables<"subscriptions">;
export type Project = Tables<"projects">;
export type Website = Tables<"websites">;
export type Domain = Tables<"domains">;
export type Deployment = Tables<"deployments">;
export type ProviderLink = Tables<"provider_links">;
export type ProvisioningJob = Tables<"provisioning_jobs">;
export type AuditEvent = Tables<"audit_events">;
export type WebhookEvent = Tables<"webhook_events">;
export type Notification = Tables<"notifications">;
export type ChangeRequest = Tables<"change_requests">;
export type Lead = Tables<"leads">;
export type ProjectReviewRound = Tables<"project_review_rounds">;
export type ProjectReviewSubmission = Tables<"project_review_submissions">;
export type ProjectReviewResponse = Tables<"project_review_responses">;
export type ProjectReviewAttachment = Tables<"project_review_attachments">;

export type OrgRole = Enums<"org_role">;
export type StaffRole = Enums<"staff_role">;
export type ProjectStatus = Enums<"project_status">;
export type WebsiteStatus = Enums<"website_status">;
export type DomainStatus = Enums<"domain_status">;
export type DeploymentStatus = Enums<"deployment_status">;
export type SubscriptionStatus = Enums<"subscription_status">;
export type JobStatus = Enums<"job_status">;
export type ChangeRequestStatus = Enums<"change_request_status">;
export type ReviewPhase = Enums<"review_phase">;
export type ReviewRoundStatus = Enums<"review_round_status">;
export type ReviewResponseKind = Enums<"review_response_kind">;
export type Provider = Enums<"provider">;
