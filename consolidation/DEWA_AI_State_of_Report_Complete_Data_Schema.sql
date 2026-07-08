CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE public.ai_applications (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    application_name character varying(500) NOT NULL,
    department_service_area character varying(500),
    date_deployed character varying(100),
    description text,
    ai_technology_used text,
    user_adoption text,
    user_satisfaction text,
    user_trust text,
    accuracy_reliability text,
    time_saved text,
    cost_saved text,
    compliance_ai_principles text,
    cost_incurred text,
    social_economic_environmental_impact text,
    scalability_potential text,
    supporting_evidence text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025,
    productivity_gain_percentage character varying(100),
    productivity_gain_details text,
    time_saved_formula text,
    cost_saved_formula text,
    strategic_alignment text,
    status character varying(50) DEFAULT 'Active'::character varying,
    entry_date character varying(20),
    division_name character varying(200)
);

CREATE TABLE public.ai_budget_items (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    budget_category character varying(100) NOT NULL,
    value_2023 numeric(15,2),
    value_2024 numeric(15,2),
    value_2025 numeric(15,2),
    notes_assumptions text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    value_2026 numeric(15,2),
    value_2027 numeric(15,2),
    value_2028 numeric(15,2),
    value_2029 numeric(15,2),
    value_2030 numeric(15,2)
);

CREATE TABLE public.ai_miscellaneous (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    title character varying(500) NOT NULL,
    category_suggestion character varying(255),
    description text,
    extracted_insights text,
    report_inclusion_notes text,
    is_reviewed boolean,
    review_notes text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025
);

CREATE TABLE public.ai_training_programs (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    program_name character varying(500) NOT NULL,
    sessions_2023 integer,
    sessions_2024 integer,
    sessions_2025 integer,
    total_hours numeric(10,2),
    total_participants integer,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    sessions_2026 integer,
    sessions_2027 integer,
    sessions_2028 integer,
    sessions_2029 integer,
    sessions_2030 integer,
    hours_2023 numeric(10,2),
    hours_2024 numeric(10,2),
    hours_2025 numeric(10,2),
    hours_2026 numeric(10,2),
    hours_2027 numeric(10,2),
    hours_2028 numeric(10,2),
    hours_2029 numeric(10,2),
    hours_2030 numeric(10,2),
    participants_2023 integer,
    participants_2024 integer,
    participants_2025 integer,
    participants_2026 integer,
    participants_2027 integer,
    participants_2028 integer,
    participants_2029 integer,
    participants_2030 integer,
    notes_hours text,
    notes_participants text,
    duration_of_session character varying(500)
);

CREATE TABLE public.ai_workforce_roles (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    role_category character varying(255) NOT NULL,
    fte_2023 integer,
    fte_2024 integer,
    fte_2025 integer,
    notes_assumptions text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    fte_2026 integer,
    fte_2027 integer,
    fte_2028 integer,
    fte_2029 integer,
    fte_2030 integer
);

CREATE TABLE public.app_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.compliance_kpis (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    kpi_code character varying(20) NOT NULL,
    what_it_measures text,
    entity_response text,
    notes_evidence text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025
);

CREATE TABLE public.division_mappings (
    id uuid NOT NULL,
    entra_group_id character varying(255),
    email_pattern character varying(255),
    division_code character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.divisions (
    code character varying(10) NOT NULL,
    name_en character varying(100) NOT NULL,
    name_ar character varying(100) NOT NULL,
    description_en text,
    description_ar text,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

CREATE TABLE public.document_embeddings (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    source_type character varying(50) NOT NULL,
    source_id character varying(255),
    source_section character varying(50),
    content text NOT NULL,
    chunk_index integer,
    embedding public.vector(3072),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.entity_kpis (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    kpi_code character varying(20) NOT NULL,
    value_2023 text,
    value_2024 text,
    value_2025 text,
    unit character varying(50),
    notes_source text,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025,
    value_2026 text,
    value_2027 text,
    value_2028 text,
    value_2029 text,
    value_2030 text
);

CREATE TABLE public.file_extractions (
    id uuid NOT NULL,
    file_upload_id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    target_section character varying(50) NOT NULL,
    extracted_text text,
    extracted_data jsonb,
    status character varying(20),
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);

CREATE TABLE public.file_uploads (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    original_filename character varying(500) NOT NULL,
    stored_filename character varying(500) NOT NULL,
    file_path character varying(1000) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    target_section character varying(50),
    status character varying(20),
    error_message text,
    uploaded_by character varying(255) NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

CREATE TABLE public.insight_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    category character varying(50) NOT NULL,
    title character varying(500) NOT NULL,
    description text NOT NULL,
    reasoning text,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    affected_divisions jsonb,
    suggested_action text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    status_note text,
    status_changed_at timestamp with time zone,
    status_changed_by character varying(255),
    model_used character varying(100) DEFAULT 'google/gemini-2.5-pro'::character varying NOT NULL,
    generated_by character varying(255) NOT NULL,
    generated_at timestamp with time zone DEFAULT now(),
    data_snapshot_hash character varying(64)
);

CREATE TABLE public.leadership_thought_pieces (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    entity_name character varying(255),
    leader_full_name character varying(255) NOT NULL,
    leader_title character varying(255) NOT NULL,
    thought_piece_text text NOT NULL,
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025
);

CREATE TABLE public.private_sector_contributions (
    id uuid NOT NULL,
    division_code character varying(10) NOT NULL,
    company_name character varying(500) NOT NULL,
    sector character varying(500),
    ai_solution_name character varying(500),
    description text,
    date_deployed character varying(100),
    impact_productivity_gains text,
    impact_user_metrics text,
    scalability_gov_integration text,
    supporting_data_case_study text,
    publication_consent_obtained character varying(500),
    submitted_by character varying(255) NOT NULL,
    submission_date character varying(50),
    submitted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reporting_year integer DEFAULT 2025
);

CREATE TABLE public.users (
    id uuid NOT NULL,
    entra_id character varying(255),
    email character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255),
    division_code character varying(10) NOT NULL,
    role character varying(20),
    is_active boolean,
    first_login_at timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE ONLY public.ai_applications ADD CONSTRAINT ai_applications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_budget_items ADD CONSTRAINT ai_budget_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_miscellaneous ADD CONSTRAINT ai_miscellaneous_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_training_programs ADD CONSTRAINT ai_training_programs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_workforce_roles ADD CONSTRAINT ai_workforce_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.compliance_kpis ADD CONSTRAINT compliance_kpis_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.division_mappings ADD CONSTRAINT division_mappings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.divisions ADD CONSTRAINT divisions_pkey PRIMARY KEY (code);

ALTER TABLE ONLY public.document_embeddings ADD CONSTRAINT document_embeddings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_kpis ADD CONSTRAINT entity_kpis_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.file_extractions ADD CONSTRAINT file_extractions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.file_uploads ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.insight_recommendations ADD CONSTRAINT insight_recommendations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.leadership_thought_pieces ADD CONSTRAINT leadership_thought_pieces_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.private_sector_contributions ADD CONSTRAINT private_sector_contributions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_entra_id_key UNIQUE (entra_id);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY public.ai_applications ADD CONSTRAINT ai_applications_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.ai_budget_items ADD CONSTRAINT ai_budget_items_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.ai_miscellaneous ADD CONSTRAINT ai_miscellaneous_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.ai_training_programs ADD CONSTRAINT ai_training_programs_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.ai_workforce_roles ADD CONSTRAINT ai_workforce_roles_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.compliance_kpis ADD CONSTRAINT compliance_kpis_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.division_mappings ADD CONSTRAINT division_mappings_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.document_embeddings ADD CONSTRAINT document_embeddings_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.entity_kpis ADD CONSTRAINT entity_kpis_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.file_extractions ADD CONSTRAINT file_extractions_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.file_extractions ADD CONSTRAINT file_extractions_file_upload_id_fkey FOREIGN KEY (file_upload_id) REFERENCES public.file_uploads(id);

ALTER TABLE ONLY public.file_uploads ADD CONSTRAINT file_uploads_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.leadership_thought_pieces ADD CONSTRAINT leadership_thought_pieces_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.private_sector_contributions ADD CONSTRAINT private_sector_contributions_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_division_code_fkey FOREIGN KEY (division_code) REFERENCES public.divisions(code);

CREATE INDEX idx_insight_batch ON public.insight_recommendations USING btree (batch_id);

CREATE INDEX idx_insight_generated ON public.insight_recommendations USING btree (generated_at DESC);

CREATE INDEX idx_insight_status ON public.insight_recommendations USING btree (status);