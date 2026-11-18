-- 002: the product was renamed from Stellar Pulse to Pyxis. Rename the brand-bearing database objects.
-- Migration 001 is frozen (its checksum is recorded), so the rename is a forward migration.
-- Policies and grants refer to functions and roles by id, so renaming keeps them intact.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pulse_app')
     AND NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pyxis_app') THEN
    ALTER ROLE pulse_app RENAME TO pyxis_app;
  END IF;
  -- A brand-new database (no users yet) gets the documented development password.
  -- A database that already has users keeps its password. Deployments replace it with `npm run db:role`.
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    ALTER ROLE pyxis_app PASSWORD 'pyxis_app';
  END IF;
END $$;

ALTER FUNCTION pulse_add_arrays(BIGINT[], BIGINT[]) RENAME TO pyxis_add_arrays;
ALTER FUNCTION pulse_tenant() RENAME TO pyxis_tenant;
ALTER FUNCTION pulse_is_operator() RENAME TO pyxis_is_operator;
ALTER FUNCTION pulse_resolve_api_key(TEXT) RENAME TO pyxis_resolve_api_key;
ALTER FUNCTION pulse_user_projects(UUID) RENAME TO pyxis_user_projects;
ALTER FUNCTION pulse_user_role(UUID, UUID) RENAME TO pyxis_user_role;
ALTER FUNCTION pulse_create_project(UUID, TEXT, TEXT) RENAME TO pyxis_create_project;
ALTER FUNCTION pulse_operator_projects() RENAME TO pyxis_operator_projects;
