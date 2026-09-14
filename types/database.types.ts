// Generated from supabase/migrations by scripts/db-gen-types.mjs — do not edit by hand.
// Regenerate after every migration: see docs/dashboard-v1/IMPLEMENTATION_LOG.md.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_kind: Database["public"]["Enums"]["actor_kind"]
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: NonNullable<Json>
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_kind: Database["public"]["Enums"]["actor_kind"]
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: NonNullable<Json>
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_kind?: Database["public"]["Enums"]["actor_kind"]
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: NonNullable<Json>
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          counts_toward_allowance: boolean
          created_at: string
          delivered_at: string | null
          description: string | null
          id: string
          metadata: NonNullable<Json>
          organization_id: string
          priority: Database["public"]["Enums"]["change_request_priority"]
          requested_by: string | null
          status: Database["public"]["Enums"]["change_request_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          website_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          counts_toward_allowance?: boolean
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id: string
          priority?: Database["public"]["Enums"]["change_request_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          counts_toward_allowance?: boolean
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id?: string
          priority?: Database["public"]["Enums"]["change_request_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          commit_ref: string | null
          created_at: string
          environment: Database["public"]["Enums"]["deployment_environment"]
          error: Json | null
          finished_at: string | null
          id: string
          metadata: NonNullable<Json>
          organization_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["deployment_status"]
          triggered_by: string | null
          updated_at: string
          url: string | null
          website_id: string
        }
        Insert: {
          commit_ref?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deployment_environment"]
          error?: Json | null
          finished_at?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["deployment_status"]
          triggered_by?: string | null
          updated_at?: string
          url?: string | null
          website_id: string
        }
        Update: {
          commit_ref?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deployment_environment"]
          error?: Json | null
          finished_at?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["deployment_status"]
          triggered_by?: string | null
          updated_at?: string
          url?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          auto_renew: boolean | null
          connected_at: string | null
          created_at: string
          dns_ok: boolean | null
          expires_at: string | null
          hostname: string
          id: string
          kind: Database["public"]["Enums"]["domain_kind"]
          last_checked_at: string | null
          metadata: NonNullable<Json>
          organization_id: string
          registrant: NonNullable<Json>
          registrar: string | null
          source: Database["public"]["Enums"]["domain_source"]
          ssl_ok: boolean | null
          status: Database["public"]["Enums"]["domain_status"]
          status_reason: string | null
          updated_at: string
          verification: NonNullable<Json>
          verified_at: string | null
          website_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          connected_at?: string | null
          created_at?: string
          dns_ok?: boolean | null
          expires_at?: string | null
          hostname: string
          id?: string
          kind?: Database["public"]["Enums"]["domain_kind"]
          last_checked_at?: string | null
          metadata?: NonNullable<Json>
          organization_id: string
          registrant?: NonNullable<Json>
          registrar?: string | null
          source?: Database["public"]["Enums"]["domain_source"]
          ssl_ok?: boolean | null
          status?: Database["public"]["Enums"]["domain_status"]
          status_reason?: string | null
          updated_at?: string
          verification?: NonNullable<Json>
          verified_at?: string | null
          website_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          connected_at?: string | null
          created_at?: string
          dns_ok?: boolean | null
          expires_at?: string | null
          hostname?: string
          id?: string
          kind?: Database["public"]["Enums"]["domain_kind"]
          last_checked_at?: string | null
          metadata?: NonNullable<Json>
          organization_id?: string
          registrant?: NonNullable<Json>
          registrar?: string | null
          source?: Database["public"]["Enums"]["domain_source"]
          ssl_ok?: boolean | null
          status?: Database["public"]["Enums"]["domain_status"]
          status_reason?: string | null
          updated_at?: string
          verification?: NonNullable<Json>
          verified_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlement_overrides: {
        Row: {
          created_at: string
          expires_at: string | null
          feature_code: string
          granted_by: string | null
          id: string
          organization_id: string
          reason: string | null
          value: NonNullable<Json>
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_code: string
          granted_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          value: NonNullable<Json>
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_code?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          value?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_overrides_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "entitlement_overrides_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          code: string
          created_at: string
          default_value: NonNullable<Json>
          description: string | null
          name: string
          updated_at: string
          value_kind: Database["public"]["Enums"]["feature_value_kind"]
        }
        Insert: {
          code: string
          created_at?: string
          default_value: NonNullable<Json>
          description?: string | null
          name: string
          updated_at?: string
          value_kind: Database["public"]["Enums"]["feature_value_kind"]
        }
        Update: {
          code?: string
          created_at?: string
          default_value?: NonNullable<Json>
          description?: string | null
          name?: string
          updated_at?: string
          value_kind?: Database["public"]["Enums"]["feature_value_kind"]
        }
        Relationships: []
      }
      leads: {
        Row: {
          contact: NonNullable<Json>
          created_at: string
          id: string
          message: string | null
          metadata: NonNullable<Json>
          organization_id: string
          received_at: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          website_id: string | null
        }
        Insert: {
          contact?: NonNullable<Json>
          created_at?: string
          id?: string
          message?: string | null
          metadata?: NonNullable<Json>
          organization_id: string
          received_at?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          contact?: NonNullable<Json>
          created_at?: string
          id?: string
          message?: string | null
          metadata?: NonNullable<Json>
          organization_id?: string
          received_at?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          organization_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          organization_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          organization_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: NonNullable<Json>
          billing_email: string | null
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: NonNullable<Json>
          billing_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: NonNullable<Json>
          billing_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          feature_code: string
          plan_id: string
          updated_at: string
          value: NonNullable<Json>
        }
        Insert: {
          feature_code: string
          plan_id: string
          updated_at?: string
          value: NonNullable<Json>
        }
        Update: {
          feature_code?: string
          plan_id?: string
          updated_at?: string
          value?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_prices: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string
          id: string
          interval: Database["public"]["Enums"]["billing_interval"]
          is_active: boolean
          plan_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          plan_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_prices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          tagline: string | null
          tier_rank: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          tagline?: string | null
          tier_rank: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          tagline?: string | null
          tier_rank?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brief: NonNullable<Json>
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["project_kind"]
          launch_target: string | null
          launched_at: string | null
          name: string
          organization_id: string
          source_ref: string | null
          status: Database["public"]["Enums"]["project_status"]
          template_slug: string | null
          updated_at: string
        }
        Insert: {
          brief?: NonNullable<Json>
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["project_kind"]
          launch_target?: string | null
          launched_at?: string | null
          name: string
          organization_id: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          template_slug?: string | null
          updated_at?: string
        }
        Update: {
          brief?: NonNullable<Json>
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["project_kind"]
          launch_target?: string | null
          launched_at?: string | null
          name?: string
          organization_id?: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          template_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          external_id: string
          id: string
          metadata: NonNullable<Json>
          provider: Database["public"]["Enums"]["provider"]
          resource_kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          external_id: string
          id?: string
          metadata?: NonNullable<Json>
          provider: Database["public"]["Enums"]["provider"]
          resource_kind: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          external_id?: string
          id?: string
          metadata?: NonNullable<Json>
          provider?: Database["public"]["Enums"]["provider"]
          resource_kind?: string
          updated_at?: string
        }
        Relationships: []
      }
      provisioning_jobs: {
        Row: {
          attempts: number
          created_at: string
          created_by: string | null
          domain_id: string | null
          error: Json | null
          finished_at: string | null
          id: string
          idempotency_key: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          organization_id: string | null
          payload: NonNullable<Json>
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          website_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          domain_id?: string | null
          error?: Json | null
          finished_at?: string | null
          id?: string
          idempotency_key: string
          kind: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          organization_id?: string | null
          payload?: NonNullable<Json>
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          domain_id?: string | null
          error?: Json | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string
          kind?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          organization_id?: string | null
          payload?: NonNullable<Json>
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_jobs_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_jobs_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: NonNullable<Json>
          organization_id: string
          plan_id: string
          plan_price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
          website_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id: string
          plan_id: string
          plan_price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: NonNullable<Json>
          organization_id?: string
          plan_id?: string
          plan_price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_price_id_fkey"
            columns: ["plan_price_id"]
            isOneToOne: false
            referencedRelation: "plan_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_website_fk"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string
          feature_code: string
          id: string
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          source: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string
          feature_code: string
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          source?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string
          feature_code?: string
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          source?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_website_fk"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      virtue_settings: {
        Row: {
          created_at: string
          enabled: boolean
          organization_id: string
          settings: NonNullable<Json>
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          organization_id: string
          settings?: NonNullable<Json>
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          organization_id?: string
          settings?: NonNullable<Json>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtue_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: Json | null
          event_id: string
          event_type: string
          id: string
          payload: NonNullable<Json>
          processed_at: string | null
          provider: Database["public"]["Enums"]["provider"]
          received_at: string
          status: Database["public"]["Enums"]["webhook_status"]
        }
        Insert: {
          error?: Json | null
          event_id: string
          event_type: string
          id?: string
          payload: NonNullable<Json>
          processed_at?: string | null
          provider: Database["public"]["Enums"]["provider"]
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_status"]
        }
        Update: {
          error?: Json | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: NonNullable<Json>
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["provider"]
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_status"]
        }
        Relationships: []
      }
      websites: {
        Row: {
          code_ownership: Database["public"]["Enums"]["code_ownership"]
          created_at: string
          export_eligible: boolean
          health_ok: boolean | null
          hosting_mode: string | null
          id: string
          last_deployed_at: string | null
          last_health_at: string | null
          live_url: string | null
          metadata: NonNullable<Json>
          name: string
          organization_id: string
          preview_url: string | null
          primary_domain_id: string | null
          project_id: string | null
          repository_ref: string | null
          status: Database["public"]["Enums"]["website_status"]
          status_reason: string | null
          template_slug: string | null
          updated_at: string
        }
        Insert: {
          code_ownership?: Database["public"]["Enums"]["code_ownership"]
          created_at?: string
          export_eligible?: boolean
          health_ok?: boolean | null
          hosting_mode?: string | null
          id?: string
          last_deployed_at?: string | null
          last_health_at?: string | null
          live_url?: string | null
          metadata?: NonNullable<Json>
          name: string
          organization_id: string
          preview_url?: string | null
          primary_domain_id?: string | null
          project_id?: string | null
          repository_ref?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          status_reason?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Update: {
          code_ownership?: Database["public"]["Enums"]["code_ownership"]
          created_at?: string
          export_eligible?: boolean
          health_ok?: boolean | null
          hosting_mode?: string | null
          id?: string
          last_deployed_at?: string | null
          last_health_at?: string | null
          live_url?: string | null
          metadata?: NonNullable<Json>
          name?: string
          organization_id?: string
          preview_url?: string | null
          primary_domain_id?: string | null
          project_id?: string | null
          repository_ref?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          status_reason?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_primary_domain_fk"
            columns: ["primary_domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_pending_invites: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      claim_jobs: {
        Args: { p_lease_seconds?: number; p_limit?: number; p_worker: string }
        Returns: {
          attempts: number
          created_at: string
          created_by: string | null
          domain_id: string | null
          error: Json | null
          finished_at: string | null
          id: string
          idempotency_key: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          organization_id: string | null
          payload: NonNullable<Json>
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          website_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "provisioning_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_org?: string
        }
        Returns: number
      }
      resolve_entitlements: {
        Args: { p_org: string }
        Returns: {
          feature_code: string
          plan_code: string
          source: string
          value: Json
        }[]
      }
    }
    Enums: {
      actor_kind: "user" | "staff" | "system" | "provider"
      billing_interval: "month" | "year"
      change_request_priority: "low" | "normal" | "high"
      change_request_status:
        | "draft"
        | "submitted"
        | "triaged"
        | "in_progress"
        | "delivered"
        | "closed"
        | "declined"
      code_ownership: "customer_owned" | "vigil_owned"
      deployment_environment: "production" | "preview"
      deployment_status: "queued" | "building" | "ready" | "error" | "canceled"
      domain_kind: "apex" | "subdomain"
      domain_source: "purchased_via_vigil" | "customer_owned" | "vigil_managed"
      domain_status:
        | "pending"
        | "verifying"
        | "connected"
        | "error"
        | "expired"
        | "released"
      feature_value_kind: "boolean" | "limit" | "text"
      job_status: "queued" | "running" | "succeeded" | "failed" | "canceled"
      lead_status: "new" | "contacted" | "qualified" | "won" | "lost" | "spam"
      membership_status: "active" | "suspended"
      org_role: "owner" | "manager" | "member"
      organization_status: "active" | "suspended" | "offboarding" | "closed"
      project_kind: "express" | "professional" | "custom"
      project_status:
        | "draft"
        | "intake"
        | "in_progress"
        | "review"
        | "approved"
        | "launched"
        | "closed"
        | "cancelled"
      provider: "stripe" | "vercel" | "cloudflare" | "resend" | "other"
      staff_role: "staff" | "admin"
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "unpaid"
        | "paused"
        | "canceled"
      webhook_status: "received" | "processed" | "failed" | "ignored"
      website_status:
        | "provisioning"
        | "building"
        | "live"
        | "paused"
        | "suspended"
        | "archived"
        | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  vigil: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invites_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      claim_jobs: {
        Args: { p_lease_seconds?: number; p_limit?: number; p_worker: string }
        Returns: Database["public"]["Tables"]["provisioning_jobs"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "provisioning_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_org_role: {
        Args: {
          p_org: string
          p_roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_kind?: Database["public"]["Enums"]["actor_kind"]
          p_after?: Json
          p_before?: Json
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_org?: string
        }
        Returns: number
      }
      org_role: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      resolve_entitlements: {
        Args: { p_org: string }
        Returns: {
          feature_code: string
          plan_code: string
          source: string
          value: Json
        }[]
      }
      shares_org_with: { Args: { p_user: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      actor_kind: ["user", "staff", "system", "provider"],
      billing_interval: ["month", "year"],
      change_request_priority: ["low", "normal", "high"],
      change_request_status: [
        "draft",
        "submitted",
        "triaged",
        "in_progress",
        "delivered",
        "closed",
        "declined",
      ],
      code_ownership: ["customer_owned", "vigil_owned"],
      deployment_environment: ["production", "preview"],
      deployment_status: ["queued", "building", "ready", "error", "canceled"],
      domain_kind: ["apex", "subdomain"],
      domain_source: ["purchased_via_vigil", "customer_owned", "vigil_managed"],
      domain_status: [
        "pending",
        "verifying",
        "connected",
        "error",
        "expired",
        "released",
      ],
      feature_value_kind: ["boolean", "limit", "text"],
      job_status: ["queued", "running", "succeeded", "failed", "canceled"],
      lead_status: ["new", "contacted", "qualified", "won", "lost", "spam"],
      membership_status: ["active", "suspended"],
      org_role: ["owner", "manager", "member"],
      organization_status: ["active", "suspended", "offboarding", "closed"],
      project_kind: ["express", "professional", "custom"],
      project_status: [
        "draft",
        "intake",
        "in_progress",
        "review",
        "approved",
        "launched",
        "closed",
        "cancelled",
      ],
      provider: ["stripe", "vercel", "cloudflare", "resend", "other"],
      staff_role: ["staff", "admin"],
      subscription_status: [
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "unpaid",
        "paused",
        "canceled",
      ],
      webhook_status: ["received", "processed", "failed", "ignored"],
      website_status: [
        "provisioning",
        "building",
        "live",
        "paused",
        "suspended",
        "archived",
        "error",
      ],
    },
  },
  vigil: {
    Enums: {},
  },
} as const
