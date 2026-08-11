-- NovaGen core relational schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('researcher','scientist','doctor','laboratory','admin','pharma');
CREATE TYPE project_status AS ENUM ('planning','active','on_hold','completed','archived');
CREATE TYPE experiment_status AS ENUM ('planned','in_progress','completed','failed','cancelled');
CREATE TYPE prediction_type AS ENUM ('binding_affinity','admet','toxicity','efficacy','generative_molecule');
CREATE TYPE trial_phase AS ENUM ('preclinical','phase_1','phase_2','phase_3','phase_4');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    hashed_password TEXT,                 -- null for OAuth-only accounts
    oauth_provider TEXT,                  -- 'google' | 'microsoft' | null
    role user_role NOT NULL DEFAULT 'researcher',
    organization TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    status project_status NOT NULL DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    disease_ontology_id TEXT,             -- e.g. DOID:xxxx
    description TEXT,
    biomarkers JSONB DEFAULT '[]',
    associated_genes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proteins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    uniprot_id TEXT UNIQUE,
    sequence TEXT,
    structure_file_key TEXT,              -- MinIO object key (PDB/CIF)
    druggability_score NUMERIC(5,4),
    disease_id UUID REFERENCES diseases(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE binding_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protein_id UUID NOT NULL REFERENCES proteins(id),
    residues JSONB NOT NULL,
    pocket_volume NUMERIC,
    confidence NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    smiles TEXT NOT NULL,
    inchi_key TEXT,
    molecular_weight NUMERIC,
    source TEXT,                          -- 'database' | 'generative_ai'
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compound_id UUID NOT NULL REFERENCES compounds(id),
    protein_id UUID REFERENCES proteins(id),
    prediction_type prediction_type NOT NULL,
    model_id UUID,                        -- references model_registry(id)
    result JSONB NOT NULL,                -- e.g. {"binding_affinity_nm": 12.4}
    confidence_score NUMERIC(5,4),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    task prediction_type NOT NULL,
    framework TEXT,                       -- 'pytorch' | 'tensorflow' | 'sklearn'
    artifact_key TEXT,                    -- MinIO object key
    metrics JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, version)
);

CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    compound_id UUID REFERENCES compounds(id),
    title TEXT NOT NULL,
    status experiment_status NOT NULL DEFAULT 'planned',
    protocol JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES experiments(id),
    barcode TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    quality_control JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compound_id UUID NOT NULL REFERENCES compounds(id),
    disease_id UUID REFERENCES diseases(id),
    phase trial_phase NOT NULL DEFAULT 'preclinical',
    patient_cohort JSONB DEFAULT '{}',
    success_prediction NUMERIC(5,4),
    risk_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    title TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'pdf',    -- 'pdf' | 'excel'
    file_key TEXT NOT NULL,                -- MinIO object key
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    bucket TEXT NOT NULL,
    object_key TEXT NOT NULL,
    content_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_predictions_compound ON predictions(compound_id);
CREATE INDEX idx_experiments_project ON experiments(project_id);
CREATE INDEX idx_compounds_project ON compounds(project_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
