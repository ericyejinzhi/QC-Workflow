-- Run this in the Supabase SQL Editor.
-- If re-running, uncomment and run the DROP statements at the bottom first.

-- ============================================================
-- 1. USERS
-- Application-managed auth — no dependency on auth.users.
-- ============================================================
CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  full_name     text        NOT NULL DEFAULT '',
  role          text        NOT NULL DEFAULT 'operator'
                            CHECK (role IN ('operator', 'engineer', 'qc_head', 'approver', 'inventory_manager')),
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text  NOT NULL,
  product_type text  NOT NULL
                     CHECK (product_type IN ('fins', 'bottom_roll', 'sleeve', 'case', 'palette')),
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. REJECTIONS
-- ============================================================
CREATE TABLE rejections (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  submitted_by     uuid        NOT NULL REFERENCES users(id),
  product_id       uuid        NOT NULL REFERENCES products(id),
  quantity         integer     NOT NULL CHECK (quantity > 0),
  rejection_reason text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending_disposition'
                               CHECK (status IN ('pending_disposition', 'pending_approval', 'approved', 'rejected'))
);


-- ============================================================
-- 4. DISPOSITIONS
-- ============================================================
CREATE TABLE dispositions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rejection_id     uuid        NOT NULL UNIQUE REFERENCES rejections(id) ON DELETE CASCADE,
  decision         text        NOT NULL
                               CHECK (decision IN ('scrap', 'sort', 'return_to_line')),
  notes            text        NOT NULL DEFAULT '',
  decided_by       uuid        NOT NULL REFERENCES users(id),
  decided_at       timestamptz NOT NULL DEFAULT now(),
  approval_status  text        NOT NULL DEFAULT 'pending'
                               CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

CREATE OR REPLACE FUNCTION on_disposition_inserted()
RETURNS trigger AS $$
BEGIN
  UPDATE rejections SET status = 'pending_approval' WHERE id = NEW.rejection_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_rejection_on_disposition
  AFTER INSERT ON dispositions
  FOR EACH ROW EXECUTE FUNCTION on_disposition_inserted();


-- ============================================================
-- 5. APPROVALS
-- ============================================================
CREATE TABLE approvals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  disposition_id  uuid        NOT NULL REFERENCES dispositions(id) ON DELETE CASCADE,
  reviewed_by     uuid        NOT NULL REFERENCES users(id),
  reviewed_at     timestamptz NOT NULL DEFAULT now(),
  status          text        NOT NULL CHECK (status IN ('approved', 'rejected')),
  comments        text
);

CREATE OR REPLACE FUNCTION on_approval_inserted()
RETURNS trigger AS $$
BEGIN
  UPDATE dispositions
    SET approval_status = NEW.status
    WHERE id = NEW.disposition_id;

  UPDATE rejections
    SET status = NEW.status
    FROM dispositions
    WHERE dispositions.id = NEW.disposition_id
      AND rejections.id = dispositions.rejection_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_status_on_approval
  AFTER INSERT ON approvals
  FOR EACH ROW EXECUTE FUNCTION on_approval_inserted();


-- ============================================================
-- DROP STATEMENTS (run these first if re-running the schema)
-- ============================================================
-- DROP TABLE IF EXISTS approvals CASCADE;
-- DROP TABLE IF EXISTS dispositions CASCADE;
-- DROP TABLE IF EXISTS rejections CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS on_disposition_inserted CASCADE;
-- DROP FUNCTION IF EXISTS on_approval_inserted CASCADE;
