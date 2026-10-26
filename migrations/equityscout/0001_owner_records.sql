-- D1-compatible owner-scoped storage. No owner or property is pre-seeded.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS scout_owners(owner_id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS scout_records(
 owner_id TEXT NOT NULL REFERENCES scout_owners(owner_id),id TEXT NOT NULL,
 identity_key TEXT NOT NULL,parcel_key TEXT,payload TEXT NOT NULL CHECK(json_valid(payload)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN(0,1)),
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(owner_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS scout_address ON scout_records(owner_id,identity_key) WHERE deleted=0;
CREATE UNIQUE INDEX IF NOT EXISTS scout_parcel ON scout_records(owner_id,parcel_key) WHERE parcel_key IS NOT NULL AND deleted=0;
CREATE TABLE IF NOT EXISTS scout_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id TEXT NOT NULL,item_id TEXT NOT NULL,action TEXT NOT NULL,occurred TEXT NOT NULL,details TEXT NOT NULL CHECK(json_valid(details)));
CREATE INDEX IF NOT EXISTS scout_audit_owner_item ON scout_audit(owner_id,item_id,id);
CREATE TRIGGER IF NOT EXISTS scout_record_create AFTER INSERT ON scout_records BEGIN
 INSERT INTO scout_audit(owner_id,item_id,action,occurred,details) VALUES(NEW.owner_id,NEW.id,'create',NEW.updated_at,json_object('before',NULL,'after',json(NEW.payload)));
END;
CREATE TRIGGER IF NOT EXISTS scout_record_update AFTER UPDATE ON scout_records BEGIN
 INSERT INTO scout_audit(owner_id,item_id,action,occurred,details) VALUES(NEW.owner_id,NEW.id,CASE WHEN NEW.deleted=1 THEN 'delete' ELSE 'update' END,NEW.updated_at,json_object('before',json(OLD.payload),'after',json(NEW.payload)));
END;
CREATE TRIGGER IF NOT EXISTS scout_audit_no_update BEFORE UPDATE ON scout_audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS scout_audit_no_delete BEFORE DELETE ON scout_audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TABLE IF NOT EXISTS scout_preferences(owner_id TEXT PRIMARY KEY REFERENCES scout_owners(owner_id),payload TEXT NOT NULL CHECK(json_valid(payload)),revision INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS scout_pha(owner_id TEXT NOT NULL REFERENCES scout_owners(owner_id),version_key TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),created_at TEXT NOT NULL,PRIMARY KEY(owner_id,version_key));
CREATE TABLE IF NOT EXISTS scout_saved_searches(owner_id TEXT NOT NULL REFERENCES scout_owners(owner_id),id TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),created_at TEXT NOT NULL,PRIMARY KEY(owner_id,id));
