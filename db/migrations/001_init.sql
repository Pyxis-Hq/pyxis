-- Stellar Pulse schema v1 (MVP). Owner role runs migrations; runtime uses pulse_app (no BYPASSRLS, not owner).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pulse_app') THEN
    CREATE ROLE pulse_app LOGIN PASSWORD 'pulse_app' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stellar_account TEXT NOT NULL UNIQUE CHECK (stellar_account ~ '^G[A-Z2-7]{55}$'),
  is_operator BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_challenges (
  nonce TEXT PRIMARY KEY,
  stellar_account TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','developer','analyst','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX project_members_user_idx ON project_members (user_id);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  umami_website_id TEXT,
  verification_token TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, domain)
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL CHECK (char_length(service_name) BETWEEN 1 AND 80),
  environment TEXT NOT NULL CHECK (char_length(environment) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, service_name, environment)
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE endpoint_metric_buckets (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bucket_start TIMESTAMPTZ NOT NULL,
  bucket_seconds INTEGER NOT NULL DEFAULT 60 CHECK (bucket_seconds > 0),
  service_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  http_method TEXT NOT NULL,
  normalized_route TEXT NOT NULL,
  status_code SMALLINT NOT NULL CHECK (status_code BETWEEN 100 AND 599),
  request_count BIGINT NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  duration_sum_ms DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (duration_sum_ms >= 0),
  histogram_version SMALLINT NOT NULL DEFAULT 1,
  -- NON-cumulative counts per bucket; boundaries defined by histogram_version (see src/server/ingest/histogram.ts)
  histogram_counts BIGINT[] NOT NULL CHECK (array_length(histogram_counts, 1) = 12),
  PRIMARY KEY (project_id, bucket_start, bucket_seconds, service_name, environment, http_method, normalized_route, status_code)
);
CREATE INDEX endpoint_metrics_project_time_idx ON endpoint_metric_buckets (project_id, bucket_start DESC);

CREATE TABLE wallet_event_buckets (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bucket_start TIMESTAMPTZ NOT NULL,
  event_name TEXT NOT NULL,
  provider_category TEXT NOT NULL DEFAULT 'other',
  network TEXT NOT NULL DEFAULT 'testnet',
  event_count BIGINT NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  PRIMARY KEY (project_id, bucket_start, event_name, provider_category, network)
);

CREATE TABLE ingestion_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted','rejected','dropped')),
  reason_code TEXT,
  data_point_count INTEGER NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ingestion_audit_project_time_idx ON ingestion_audit (project_id, received_at DESC);

CREATE TABLE operator_audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Element-wise array add for mergeable histograms.
CREATE FUNCTION pulse_add_arrays(a BIGINT[], b BIGINT[]) RETURNS BIGINT[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT array_agg(COALESCE(x,0) + COALESCE(y,0) ORDER BY i)
  FROM unnest(a, b) WITH ORDINALITY AS t(x, y, i)
$$;

-- Tenant context helpers. Both are set transaction-locally (set_config(..., true)).
CREATE FUNCTION pulse_tenant() RETURNS UUID LANGUAGE sql STABLE AS
  $$ SELECT NULLIF(current_setting('app.project_id', true), '')::uuid $$;
CREATE FUNCTION pulse_is_operator() RETURNS BOOLEAN LANGUAGE sql STABLE AS
  $$ SELECT COALESCE(current_setting('app.is_operator', true), '') = 'on' $$;

-- RLS on every tenant-owned table. Operators get read-only aggregate access to metric tables only.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['project_members','sites','services','api_keys','endpoint_metric_buckets','wallet_event_buckets','ingestion_audit']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY tenant_all ON %I USING (project_id = pulse_tenant()) WITH CHECK (project_id = pulse_tenant())$p$, t);
  END LOOP;
END $$;

CREATE POLICY operator_read ON endpoint_metric_buckets FOR SELECT USING (pulse_is_operator());
CREATE POLICY operator_read ON wallet_event_buckets FOR SELECT USING (pulse_is_operator());
CREATE POLICY operator_read ON ingestion_audit FOR SELECT USING (pulse_is_operator());
CREATE POLICY operator_read ON api_keys FOR SELECT USING (pulse_is_operator());

-- projects: visible if tenant context matches, member context handled by app via pulse_member_of(), or operator.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
CREATE POLICY projects_tenant ON projects USING (id = pulse_tenant() OR pulse_is_operator())
  WITH CHECK (id = pulse_tenant() OR pulse_is_operator());

-- Pre-tenant lookups run through narrow SECURITY DEFINER functions so the runtime role never needs BYPASSRLS.
CREATE FUNCTION pulse_resolve_api_key(p_key_id TEXT)
RETURNS TABLE (id UUID, project_id UUID, secret_hash TEXT, scopes TEXT[], expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, project_status TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT k.id, k.project_id, k.secret_hash, k.scopes, k.expires_at, k.revoked_at, p.status
  FROM api_keys k JOIN projects p ON p.id = k.project_id WHERE k.key_id = p_key_id
$$;

CREATE FUNCTION pulse_user_projects(p_user UUID)
RETURNS TABLE (project_id UUID, name TEXT, status TEXT, role TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.status, m.role FROM project_members m JOIN projects p ON p.id = m.project_id WHERE m.user_id = p_user ORDER BY p.created_at
$$;

CREATE FUNCTION pulse_user_role(p_user UUID, p_project UUID) RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM project_members WHERE user_id = p_user AND project_id = p_project
$$;

CREATE FUNCTION pulse_create_project(p_user UUID, p_name TEXT, p_desc TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  INSERT INTO projects(name, description) VALUES (p_name, p_desc) RETURNING id INTO pid;
  INSERT INTO project_members(project_id, user_id, role) VALUES (pid, p_user, 'owner');
  RETURN pid;
END $$;

CREATE FUNCTION pulse_operator_projects()
RETURNS TABLE (id UUID, name TEXT, status TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, status, created_at FROM projects ORDER BY created_at
$$;

-- Tables without tenant column: only the runtime role may touch them, via app code.
REVOKE ALL ON FUNCTION pulse_resolve_api_key, pulse_user_projects, pulse_user_role, pulse_create_project, pulse_operator_projects FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pulse_resolve_api_key, pulse_user_projects, pulse_user_role, pulse_create_project, pulse_operator_projects, pulse_add_arrays, pulse_tenant, pulse_is_operator TO pulse_app;

GRANT USAGE ON SCHEMA public TO pulse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, auth_challenges, sessions, projects, project_members, sites, services, api_keys,
  endpoint_metric_buckets, wallet_event_buckets, ingestion_audit TO pulse_app;
GRANT SELECT, INSERT ON operator_audit_events TO pulse_app;
