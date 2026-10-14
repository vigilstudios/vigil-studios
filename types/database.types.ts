export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
      build_prices: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["project_kind"]
          name: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["project_kind"]
          name: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["project_kind"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_request_attachments: {
        Row: {
          bucket_id: string
          change_request_id: string
          content_type: string
          created_at: string
          file_name: string
          id: string
          object_path: string
          organization_id: string
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          bucket_id?: string
          change_request_id: string
          content_type: string
          created_at?: string
          file_name: string
          id?: string
          object_path: string
          organization_id: string
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          change_request_id?: string
          content_type?: string
          created_at?: string
          file_name?: string
          id?: string
          object_path?: string
          organization_id?: string
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_request_attachments_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_request_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
      creative_workspaces: {
        Row: {
          asset_counts: Json
          commit_sha: string | null
          created_at: string
          error: Json | null
          finished_at: string | null
          generated_at: string | null
          generated_files: Json
          id: string
          idempotency_key: string | null
          intelligence: Json | null
          intelligence_at: string | null
          intelligence_usage: Json | null
          model_id: string | null
          organization_id: string
          project_id: string | null
          prompt_version: number | null
          schema_version: number | null
          source_checksum: string | null
          started_at: string | null
          status: string
          template_version: number | null
          updated_at: string
          warnings: Json
          website_id: string
          workflow_version: number
        }
        Insert: {
          asset_counts?: Json
          commit_sha?: string | null
          created_at?: string
          error?: Json | null
          finished_at?: string | null
          generated_at?: string | null
          generated_files?: Json
          id?: string
          idempotency_key?: string | null
          intelligence?: Json | null
          intelligence_at?: string | null
          intelligence_usage?: Json | null
          model_id?: string | null
          organization_id: string
          project_id?: string | null
          prompt_version?: number | null
          schema_version?: number | null
          source_checksum?: string | null
          started_at?: string | null
          status?: string
          template_version?: number | null
          updated_at?: string
          warnings?: Json
          website_id: string
          workflow_version?: number
        }
        Update: {
          asset_counts?: Json
          commit_sha?: string | null
          created_at?: string
          error?: Json | null
          finished_at?: string | null
          generated_at?: string | null
          generated_files?: Json
          id?: string
          idempotency_key?: string | null
          intelligence?: Json | null
          intelligence_at?: string | null
          intelligence_usage?: Json | null
          model_id?: string | null
          organization_id?: string
          project_id?: string | null
          prompt_version?: number | null
          schema_version?: number | null
          source_checksum?: string | null
          started_at?: string | null
          status?: string
          template_version?: number | null
          updated_at?: string
          warnings?: Json
          website_id?: string
          workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_workspaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_workspaces_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_deletion_log: {
        Row: {
          archived_at: string | null
          billing_email: string | null
          cleanup: Json
          deleted_at: string
          deleted_by: string | null
          former_organization_id: string
          id: string
          organization_name: string
          organization_slug: string
          snapshot: Json
        }
        Insert: {
          archived_at?: string | null
          billing_email?: string | null
          cleanup?: Json
          deleted_at?: string
          deleted_by?: string | null
          former_organization_id: string
          id?: string
          organization_name: string
          organization_slug: string
          snapshot?: Json
        }
        Update: {
          archived_at?: string | null
          billing_email?: string | null
          cleanup?: Json
          deleted_at?: string
          deleted_by?: string | null
          former_organization_id?: string
          id?: string
          organization_name?: string
          organization_slug?: string
          snapshot?: Json
        }
        Relationships: []
      }
      deployments: {
        Row: {
          commit_ref: string | null
          created_at: string
          environment: Database["public"]["Enums"]["deployment_environment"]
          error: Json | null
          finished_at: string | null
          id: string
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
      design_workspaces: {
        Row: {
          created_at: string
          engine_version: string
          generated_files: Json
          id: string
          organization_id: string
          pending_files: Json
          project_id: string
          repository_commit: string | null
          repository_revision: number | null
          revision: number
          site_definition: Json
          sync_error: string | null
          sync_token: string | null
          sync_until: string | null
          updated_at: string
          updated_by: string | null
          website_id: string
        }
        Insert: {
          created_at?: string
          engine_version: string
          generated_files?: Json
          id?: string
          organization_id: string
          pending_files?: Json
          project_id: string
          repository_commit?: string | null
          repository_revision?: number | null
          revision?: number
          site_definition: Json
          sync_error?: string | null
          sync_token?: string | null
          sync_until?: string | null
          updated_at?: string
          updated_by?: string | null
          website_id: string
        }
        Update: {
          created_at?: string
          engine_version?: string
          generated_files?: Json
          id?: string
          organization_id?: string
          pending_files?: Json
          project_id?: string
          repository_commit?: string | null
          repository_revision?: number | null
          revision?: number
          site_definition?: Json
          sync_error?: string | null
          sync_token?: string | null
          sync_until?: string | null
          updated_at?: string
          updated_by?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_workspaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_workspaces_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_workspaces_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
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
          metadata: Json
          organization_id: string
          registrant: Json
          registrar: string | null
          source: Database["public"]["Enums"]["domain_source"]
          ssl_ok: boolean | null
          status: Database["public"]["Enums"]["domain_status"]
          status_reason: string | null
          updated_at: string
          verification: Json
          verification_token: string
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
          metadata?: Json
          organization_id: string
          registrant?: Json
          registrar?: string | null
          source?: Database["public"]["Enums"]["domain_source"]
          ssl_ok?: boolean | null
          status?: Database["public"]["Enums"]["domain_status"]
          status_reason?: string | null
          updated_at?: string
          verification?: Json
          verification_token?: string
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
          metadata?: Json
          organization_id?: string
          registrant?: Json
          registrar?: string | null
          source?: Database["public"]["Enums"]["domain_source"]
          ssl_ok?: boolean | null
          status?: Database["public"]["Enums"]["domain_status"]
          status_reason?: string | null
          updated_at?: string
          verification?: Json
          verification_token?: string
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
          value: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_code: string
          granted_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_code?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          value?: Json
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
      express_variants: {
        Row: {
          archived_at: string | null
          created_at: string
          draft: Json
          id: string
          published: Json | null
          published_revision: number | null
          revision: number
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          draft: Json
          id?: string
          published?: Json | null
          published_revision?: number | null
          revision?: number
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          draft?: Json
          id?: string
          published?: Json | null
          published_revision?: number | null
          revision?: number
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "express_variants_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          code: string
          created_at: string
          default_value: Json
          description: string | null
          name: string
          updated_at: string
          value_kind: Database["public"]["Enums"]["feature_value_kind"]
        }
        Insert: {
          code: string
          created_at?: string
          default_value: Json
          description?: string | null
          name: string
          updated_at?: string
          value_kind: Database["public"]["Enums"]["feature_value_kind"]
        }
        Update: {
          code?: string
          created_at?: string
          default_value?: Json
          description?: string | null
          name?: string
          updated_at?: string
          value_kind?: Database["public"]["Enums"]["feature_value_kind"]
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          actor_user_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          lead_id: string
          organization_id: string
        }
        Insert: {
          actor_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          organization_id: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notifications: {
        Row: {
          attempts: number
          first_attempt_at: string | null
          last_error: string | null
          lead_id: string
          message: Json | null
          organization_id: string
          provider_id: string | null
          recipient: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          first_attempt_at?: string | null
          last_error?: string | null
          lead_id: string
          message?: Json | null
          organization_id: string
          provider_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          first_attempt_at?: string | null
          last_error?: string | null
          lead_id?: string
          message?: Json | null
          organization_id?: string
          provider_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contact: Json
          created_at: string
          id: string
          message: string | null
          metadata: Json
          organization_id: string
          read_at: string | null
          received_at: string
          search_document: unknown
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          submission_hash: string | null
          submission_key: string | null
          updated_at: string
          website_id: string | null
        }
        Insert: {
          contact?: Json
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          organization_id: string
          read_at?: string | null
          received_at?: string
          search_document?: unknown
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_hash?: string | null
          submission_key?: string | null
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          contact?: Json
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          organization_id?: string
          read_at?: string | null
          received_at?: string
          search_document?: unknown
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_hash?: string | null
          submission_key?: string | null
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
      legacy_clients: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          profile_id: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          profile_id?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "legacy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_onboarding_steps: {
        Row: {
          completed_at: string | null
          description: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          step_order: number
          title: string
        }
        Insert: {
          completed_at?: string | null
          description: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          step_order: number
          title: string
        }
        Update: {
          completed_at?: string | null
          description?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "legacy_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      legacy_project_files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          created_at: string
          file_name: string
          file_path: string
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["file_category"]
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "legacy_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "legacy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_project_phase_progress: {
        Row: {
          id: string
          phase: Database["public"]["Enums"]["project_phase"]
          progress: number
          project_id: string
        }
        Insert: {
          id?: string
          phase: Database["public"]["Enums"]["project_phase"]
          progress?: number
          project_id: string
        }
        Update: {
          id?: string
          phase?: Database["public"]["Enums"]["project_phase"]
          progress?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phase_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "legacy_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_projects: {
        Row: {
          client_id: string
          created_at: string
          current_phase: Database["public"]["Enums"]["project_phase"]
          domain: string | null
          hosting_provider: string | null
          id: string
          launch_window: string | null
          live_url: string | null
          next_step_description: string
          next_step_title: string
          package_name: string
          project_name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["project_phase"]
          domain?: string | null
          hosting_provider?: string | null
          id?: string
          launch_window?: string | null
          live_url?: string | null
          next_step_description?: string
          next_step_title?: string
          package_name: string
          project_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["project_phase"]
          domain?: string | null
          hosting_provider?: string | null
          id?: string
          launch_window?: string | null
          live_url?: string | null
          next_step_description?: string
          next_step_title?: string
          package_name?: string
          project_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "legacy_clients"
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
      orders: {
        Row: {
          build_amount_cents: number | null
          build_price_id: string | null
          business_name: string
          checkout_token: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          email: string
          error: Json | null
          expires_at: string | null
          id: string
          metadata: Json
          organization_id: string | null
          paid_at: string | null
          plan_amount_cents: number | null
          plan_id: string | null
          plan_price_id: string | null
          project_id: string | null
          project_kind: Database["public"]["Enums"]["project_kind"]
          provisioned_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subscription_id: string | null
          template_slug: string | null
          updated_at: string
        }
        Insert: {
          build_amount_cents?: number | null
          build_price_id?: string | null
          business_name: string
          checkout_token?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email: string
          error?: Json | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          paid_at?: string | null
          plan_amount_cents?: number | null
          plan_id?: string | null
          plan_price_id?: string | null
          project_id?: string | null
          project_kind?: Database["public"]["Enums"]["project_kind"]
          provisioned_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subscription_id?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Update: {
          build_amount_cents?: number | null
          build_price_id?: string | null
          business_name?: string
          checkout_token?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string
          error?: Json | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          paid_at?: string | null
          plan_amount_cents?: number | null
          plan_id?: string | null
          plan_price_id?: string | null
          project_id?: string | null
          project_kind?: Database["public"]["Enums"]["project_kind"]
          provisioned_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subscription_id?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_build_price_id_fkey"
            columns: ["build_price_id"]
            isOneToOne: false
            referencedRelation: "build_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_price_id_fkey"
            columns: ["plan_price_id"]
            isOneToOne: false
            referencedRelation: "plan_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          requires_acceptance: boolean
          revoked_at: string | null
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          declined_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          requires_acceptance?: boolean
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          declined_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          requires_acceptance?: boolean
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
          address: Json
          archive_snapshot: Json | null
          archived_at: string | null
          billing_email: string | null
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: Json
          archive_snapshot?: Json | null
          archived_at?: string | null
          billing_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: Json
          archive_snapshot?: Json | null
          archived_at?: string | null
          billing_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name?: string
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
          value: Json
        }
        Insert: {
          feature_code: string
          plan_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          feature_code?: string
          plan_id?: string
          updated_at?: string
          value?: Json
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
          interval_count: number
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
          interval_count?: number
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
          interval_count?: number
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
      project_assets: {
        Row: {
          bucket_id: string
          caption: string | null
          checksum: string | null
          content_type: string
          created_at: string
          file_name: string
          id: string
          kind: Database["public"]["Enums"]["project_asset_kind"]
          object_path: string
          organization_id: string
          project_id: string
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          bucket_id?: string
          caption?: string | null
          checksum?: string | null
          content_type: string
          created_at?: string
          file_name: string
          id?: string
          kind?: Database["public"]["Enums"]["project_asset_kind"]
          object_path: string
          organization_id: string
          project_id: string
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          caption?: string | null
          checksum?: string | null
          content_type?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["project_asset_kind"]
          object_path?: string
          organization_id?: string
          project_id?: string
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_review_attachments: {
        Row: {
          bucket_id: string
          content_type: string
          created_at: string
          file_name: string
          id: string
          object_path: string
          organization_id: string
          response_id: string
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          bucket_id?: string
          content_type: string
          created_at?: string
          file_name: string
          id?: string
          object_path: string
          organization_id: string
          response_id: string
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          content_type?: string
          created_at?: string
          file_name?: string
          id?: string
          object_path?: string
          organization_id?: string
          response_id?: string
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_review_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_attachments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "project_review_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_review_responses: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          kind: Database["public"]["Enums"]["review_response_kind"]
          organization_id: string
          project_id: string
          responded_at: string
          responded_by: string | null
          round_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          kind: Database["public"]["Enums"]["review_response_kind"]
          organization_id: string
          project_id: string
          responded_at?: string
          responded_by?: string | null
          round_id: string
          submission_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["review_response_kind"]
          organization_id?: string
          project_id?: string
          responded_at?: string
          responded_by?: string | null
          round_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_review_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_responses_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_responses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "project_review_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_responses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "project_review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_review_rounds: {
        Row: {
          approved_submission_id: string | null
          created_at: string
          current_submission_id: string | null
          id: string
          organization_id: string
          phase: Database["public"]["Enums"]["review_phase"]
          project_id: string
          round_number: number
          status: Database["public"]["Enums"]["review_round_status"]
          updated_at: string
        }
        Insert: {
          approved_submission_id?: string | null
          created_at?: string
          current_submission_id?: string | null
          id?: string
          organization_id: string
          phase: Database["public"]["Enums"]["review_phase"]
          project_id: string
          round_number: number
          status?: Database["public"]["Enums"]["review_round_status"]
          updated_at?: string
        }
        Update: {
          approved_submission_id?: string | null
          created_at?: string
          current_submission_id?: string | null
          id?: string
          organization_id?: string
          phase?: Database["public"]["Enums"]["review_phase"]
          project_id?: string
          round_number?: number
          status?: Database["public"]["Enums"]["review_round_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_review_rounds_approved_submission_fk"
            columns: ["approved_submission_id"]
            isOneToOne: false
            referencedRelation: "project_review_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_rounds_current_submission_fk"
            columns: ["current_submission_id"]
            isOneToOne: false
            referencedRelation: "project_review_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_rounds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_rounds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_review_submissions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          preview_url: string
          project_id: string
          published_at: string
          published_by: string | null
          round_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          preview_url: string
          project_id: string
          published_at?: string
          published_by?: string | null
          round_id: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          preview_url?: string
          project_id?: string
          published_at?: string
          published_by?: string | null
          round_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_review_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_submissions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_review_submissions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "project_review_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brief: Json
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          intake_completed_at: string | null
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
          brief?: Json
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intake_completed_at?: string | null
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
          brief?: Json
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intake_completed_at?: string | null
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
          payload: Json
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
          payload?: Json
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
          payload?: Json
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
      staff_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          organization_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          organization_id?: string
          settings?: Json
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
          payload: Json
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
          payload: Json
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
          payload?: Json
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["provider"]
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_status"]
        }
        Relationships: []
      }
      website_blog_image_refs: {
        Row: {
          image_id: string
          post_id: string
        }
        Insert: {
          image_id: string
          post_id: string
        }
        Update: {
          image_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_blog_image_refs_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "website_blog_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_blog_image_refs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "website_blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      website_blog_images: {
        Row: {
          height: number
          id: string
          object_path: string
          organization_id: string
          website_id: string
          width: number
        }
        Insert: {
          height: number
          id: string
          object_path: string
          organization_id: string
          website_id: string
          width: number
        }
        Update: {
          height?: number
          id?: string
          object_path?: string
          organization_id?: string
          website_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "website_blog_images_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "project_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_blog_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_blog_images_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_blog_posts: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          excerpt: string
          id: string
          media: Json
          organization_id: string
          published_at: string | null
          published_snapshot: Json | null
          review_sample: boolean
          slug: string
          status: string
          title: string
          updated_at: string
          website_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          excerpt?: string
          id?: string
          media?: Json
          organization_id: string
          published_at?: string | null
          published_snapshot?: Json | null
          review_sample?: boolean
          slug: string
          status?: string
          title: string
          updated_at?: string
          website_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          excerpt?: string
          id?: string
          media?: Json
          organization_id?: string
          published_at?: string | null
          published_snapshot?: Json | null
          review_sample?: boolean
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_blog_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_blog_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_blog_posts_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_contact_automation: {
        Row: {
          automatic: boolean
          generation: number
          last_error: string | null
          organization_id: string
          status: string
          updated_at: string
          website_id: string
        }
        Insert: {
          automatic?: boolean
          generation?: number
          last_error?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          website_id: string
        }
        Update: {
          automatic?: boolean
          generation?: number
          last_error?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_contact_automation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_contact_automation_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_contact_settings: {
        Row: {
          allowed_origins: string[]
          booking_url: string | null
          daily_limit: number
          enabled: boolean
          notification_email: string
          organization_id: string
          updated_at: string
          website_id: string
        }
        Insert: {
          allowed_origins?: string[]
          booking_url?: string | null
          daily_limit?: number
          enabled?: boolean
          notification_email: string
          organization_id: string
          updated_at?: string
          website_id: string
        }
        Update: {
          allowed_origins?: string[]
          booking_url?: string | null
          daily_limit?: number
          enabled?: boolean
          notification_email?: string
          organization_id?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_contact_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_contact_settings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_addresses: {
        Row: {
          collection_id: string
          record_id: string
          slug: string
        }
        Insert: {
          collection_id: string
          record_id: string
          slug: string
        }
        Update: {
          collection_id?: string
          record_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_addresses_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "website_content_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_collections: {
        Row: {
          adapter: string
          config: Json
          draft: Json
          enabled: boolean
          field: string
          id: string
          key: string
          label: string
          module: string
          organization_id: string
          page_id: string
          published: Json
          published_revision: number | null
          revision: number
          section_id: string
          updated_at: string
          updated_by: string | null
          version: number
          website_id: string
        }
        Insert: {
          adapter: string
          config?: Json
          draft?: Json
          enabled?: boolean
          field: string
          id?: string
          key: string
          label: string
          module: string
          organization_id: string
          page_id: string
          published?: Json
          published_revision?: number | null
          revision?: number
          section_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          website_id: string
        }
        Update: {
          adapter?: string
          config?: Json
          draft?: Json
          enabled?: boolean
          field?: string
          id?: string
          key?: string
          label?: string
          module?: string
          organization_id?: string
          page_id?: string
          published?: Json
          published_revision?: number | null
          revision?: number
          section_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_collections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_collections_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_history: {
        Row: {
          actor_id: string | null
          collection_id: string
          created_at: string
          id: string
          intent: string
          organization_id: string
          records: Json
          revision: number
          website_id: string
        }
        Insert: {
          actor_id?: string | null
          collection_id: string
          created_at?: string
          id?: string
          intent: string
          organization_id: string
          records: Json
          revision: number
          website_id: string
        }
        Update: {
          actor_id?: string | null
          collection_id?: string
          created_at?: string
          id?: string
          intent?: string
          organization_id?: string
          records?: Json
          revision?: number
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_history_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "website_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_history_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_media: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          ready: boolean
          type: string
          website_id: string
        }
        Insert: {
          created_at?: string
          id: string
          organization_id: string
          ready?: boolean
          type: string
          website_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          ready?: boolean
          type?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_media_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "project_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_media_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_media_refs: {
        Row: {
          collection_id: string
          media_id: string
        }
        Insert: {
          collection_id: string
          media_id: string
        }
        Update: {
          collection_id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_media_refs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "website_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_media_refs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "website_content_media"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content_runtimes: {
        Row: {
          binding_keys: string[]
          created_at: string
          created_by: string | null
          engine_version: string
          id: string
          organization_id: string
          site_definition: Json
          website_id: string
        }
        Insert: {
          binding_keys: string[]
          created_at?: string
          created_by?: string | null
          engine_version: string
          id: string
          organization_id: string
          site_definition: Json
          website_id: string
        }
        Update: {
          binding_keys?: string[]
          created_at?: string
          created_by?: string | null
          engine_version?: string
          id?: string
          organization_id?: string
          site_definition?: Json
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_content_runtimes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_runtimes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_content_runtimes_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
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
      published_express_variants: {
        Row: {
          published: Json | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          published?: Json | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          published?: Json | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: { Args: { p_invite: string }; Returns: string }
      accept_pending_invites: { Args: never; Returns: number }
      acknowledge_lead_notification: {
        Args: { p_lead: string; p_org: string; p_provider: string }
        Returns: undefined
      }
      add_lead_note: {
        Args: { p_lead: string; p_note: string }
        Returns: undefined
      }
      allocate_order_project: {
        Args: {
          p_customer_ref?: string
          p_order_id: string
          p_provider: Database["public"]["Enums"]["provider"]
          p_slug: string
        }
        Returns: Json
      }
      apply_provider_subscription: {
        Args: {
          p_customer_ref: string
          p_external_id: string
          p_price_ref: string
          p_provider: Database["public"]["Enums"]["provider"]
          p_snapshot: Json
        }
        Returns: Json
      }
      archive_customer: {
        Args: { p_actor_id: string; p_organization_id: string }
        Returns: undefined
      }
      capture_website_lead: {
        Args: {
          p_contact: Json
          p_hash: string
          p_key: string
          p_message: string
          p_origin: string
          p_page: string
          p_source: string
          p_website: string
        }
        Returns: string
      }
      claim_contact_setup: {
        Args: { p_generation: number; p_token: string; p_website: string }
        Returns: Json
      }
      claim_design_sync: {
        Args: { p_project_id: string; p_token: string }
        Returns: boolean
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
          payload: Json
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
      configure_website_contact: {
        Args: {
          p_booking?: string
          p_enabled?: boolean
          p_origins?: string[]
          p_recipient: string
          p_website: string
        }
        Returns: undefined
      }
      contact_setup_failed: {
        Args: {
          p_error: string
          p_generation: number
          p_status: string
          p_token: string
          p_website: string
        }
        Returns: undefined
      }
      contact_widget_credentials: { Args: { p_website: string }; Returns: Json }
      decline_invitation: { Args: { p_invite: string }; Returns: undefined }
      finish_contact_setup: {
        Args: {
          p_account: string
          p_generation: number
          p_origins: string[]
          p_secret: string
          p_sitekey: string
          p_token: string
          p_website: string
        }
        Returns: boolean
      }
      list_my_invitations: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          invited_by_name: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["org_role"]
        }[]
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_user_id?: string
          p_after?: Json
          p_before?: Json
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_org?: string
        }
        Returns: number
      }
      mark_contact_widget_creation: {
        Args: { p_token: string; p_website: string }
        Returns: undefined
      }
      notify_review_staff: {
        Args: {
          p_body?: string
          p_href?: string
          p_round: string
          p_title: string
        }
        Returns: undefined
      }
      purge_customer: {
        Args: {
          p_cleanup: Json
          p_deleted_by: string
          p_organization_id: string
          p_snapshot: Json
        }
        Returns: undefined
      }
      rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      reconcile_contact_setup: { Args: { p_limit?: number }; Returns: number }
      reserve_content_media: {
        Args: {
          p_collection: string
          p_id: string
          p_name: string
          p_size: number
          p_type: string
        }
        Returns: string
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
      resolve_website_entitlements: {
        Args: { p_website: string }
        Returns: {
          feature_code: string
          plan_code: string
          source: string
          value: Json
        }[]
      }
      restore_customer: {
        Args: { p_actor_id: string; p_organization_id: string }
        Returns: undefined
      }
      save_content_design_workspace: {
        Args: {
          p_actor: string
          p_collections: Json
          p_engine: string
          p_expected: number
          p_project: string
          p_site: Json
        }
        Returns: number
      }
      save_website_blog_post: {
        Args: {
          p_body: string
          p_excerpt: string
          p_expected?: string
          p_media?: Json
          p_post?: string
          p_publish: boolean
          p_slug: string
          p_title: string
          p_website: string
        }
        Returns: string
      }
      save_website_content: {
        Args: {
          p_actor: string
          p_collection: string
          p_expected: number
          p_intent: string
          p_records: Json
        }
        Returns: number
      }
      set_website_blog_post_deleted: {
        Args: {
          p_deleted: boolean
          p_expected: string
          p_post: string
          p_website: string
        }
        Returns: string
      }
      set_website_blog_requested: {
        Args: { p_requested: boolean; p_website: string }
        Returns: undefined
      }
      set_website_contact_automation: {
        Args: { p_automatic: boolean; p_website: string }
        Returns: undefined
      }
      unpublish_website_blog_post: {
        Args: { p_expected: string; p_post: string; p_website: string }
        Returns: string
      }
      website_blog_available: { Args: { p_website: string }; Returns: boolean }
      website_blog_delivery: {
        Args: { p_review?: boolean; p_website: string }
        Returns: boolean
      }
      website_content_access: { Args: { p_website: string }; Returns: boolean }
      website_content_delivery: {
        Args: { p_review?: boolean; p_website: string }
        Returns: boolean
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
      file_category: "brand_asset" | "document" | "content" | "deliverable"
      job_status: "queued" | "running" | "succeeded" | "failed" | "canceled"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "won"
        | "lost"
        | "spam"
        | "booked"
      membership_status: "active" | "suspended"
      order_status:
        | "pending"
        | "paid"
        | "provisioned"
        | "failed"
        | "refunded"
        | "expired"
      org_role: "owner" | "manager" | "member"
      organization_status: "active" | "suspended" | "offboarding" | "closed"
      project_asset_kind: "logo" | "photo" | "document" | "other" | "video"
      project_kind: "express" | "professional" | "custom"
      project_phase:
        | "onboarding"
        | "design"
        | "development"
        | "review"
        | "launch"
        | "maintenance"
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
      review_phase: "design_direction" | "full_site"
      review_response_kind: "changes_requested" | "approved"
      review_round_status:
        | "pending"
        | "awaiting_feedback"
        | "changes_requested"
        | "revision_in_progress"
        | "approved"
      staff_role: "staff" | "admin"
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "unpaid"
        | "paused"
        | "canceled"
      task_status: "not_started" | "in_progress" | "completed"
      user_role: "admin" | "client"
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
      contact_secret_refs: {
        Row: {
          creation_started_at: string | null
          lease_token: string | null
          lease_until: string | null
          vault_secret_id: string | null
          website_id: string
        }
        Insert: {
          creation_started_at?: string | null
          lease_token?: string | null
          lease_until?: string | null
          vault_secret_id?: string | null
          website_id: string
        }
        Update: {
          creation_started_at?: string | null
          lease_token?: string | null
          lease_until?: string | null
          vault_secret_id?: string | null
          website_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_invite: string }; Returns: string }
      accept_invites_for_current_user: { Args: never; Returns: number }
      archive_organization: {
        Args: { p_actor_id: string; p_organization_id: string }
        Returns: undefined
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
      contact_service_only: { Args: never; Returns: undefined }
      contact_verified_origins: {
        Args: { p_website: string }
        Returns: string[]
      }
      content_access: { Args: { p_website: string }; Returns: boolean }
      current_email: { Args: never; Returns: string }
      decline_invitation: { Args: { p_invite: string }; Returns: undefined }
      ensure_contact_recipient: {
        Args: { p_website: string }
        Returns: boolean
      }
      has_org_role: {
        Args: {
          p_org: string
          p_roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      list_my_invitations: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          invited_by_name: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["org_role"]
        }[]
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_kind?: Database["public"]["Enums"]["actor_kind"]
          p_actor_user_id?: string
          p_after?: Json
          p_before?: Json
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_org?: string
        }
        Returns: number
      }
      notify_review_staff: {
        Args: {
          p_body: string
          p_href: string
          p_round: string
          p_title: string
        }
        Returns: undefined
      }
      org_role: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      path_organization: { Args: { p_name: string }; Returns: string }
      purge_organization: {
        Args: {
          p_cleanup: Json
          p_deleted_by: string
          p_organization_id: string
          p_snapshot: Json
        }
        Returns: undefined
      }
      queue_contact_setup: { Args: { p_website: string }; Returns: undefined }
      rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
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
      restore_organization: {
        Args: { p_actor_id: string; p_organization_id: string }
        Returns: undefined
      }
      shares_org_with: { Args: { p_user: string }; Returns: boolean }
      validate_content_records: {
        Args: {
          p_module: string
          p_publish: boolean
          p_rows: Json
          p_website: string
        }
        Returns: undefined
      }
      website_blog_enabled: { Args: { p_website: string }; Returns: boolean }
      website_features: {
        Args: { p_website: string }
        Returns: {
          feature_code: string
          plan_code: string
          source: string
          value: Json
        }[]
      }
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
      file_category: ["brand_asset", "document", "content", "deliverable"],
      job_status: ["queued", "running", "succeeded", "failed", "canceled"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "won",
        "lost",
        "spam",
        "booked",
      ],
      membership_status: ["active", "suspended"],
      order_status: [
        "pending",
        "paid",
        "provisioned",
        "failed",
        "refunded",
        "expired",
      ],
      org_role: ["owner", "manager", "member"],
      organization_status: ["active", "suspended", "offboarding", "closed"],
      project_asset_kind: ["logo", "photo", "document", "other", "video"],
      project_kind: ["express", "professional", "custom"],
      project_phase: [
        "onboarding",
        "design",
        "development",
        "review",
        "launch",
        "maintenance",
      ],
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
      review_phase: ["design_direction", "full_site"],
      review_response_kind: ["changes_requested", "approved"],
      review_round_status: [
        "pending",
        "awaiting_feedback",
        "changes_requested",
        "revision_in_progress",
        "approved",
      ],
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
      task_status: ["not_started", "in_progress", "completed"],
      user_role: ["admin", "client"],
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
