ALTER TABLE consultations ADD COLUMN next_path TEXT NOT NULL DEFAULT 'service';
ALTER TABLE consultations ADD COLUMN next_path_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE consultations ADD COLUMN owner_agreed TEXT NOT NULL DEFAULT 'no';
