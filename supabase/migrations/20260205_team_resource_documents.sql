-- Create child table for multiple documents per resource
CREATE TABLE team_resource_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('link', 'file')),
  url TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_link_has_url CHECK (document_type != 'link' OR url IS NOT NULL),
  CONSTRAINT chk_file_has_path CHECK (document_type != 'file' OR file_path IS NOT NULL)
);

CREATE INDEX idx_resource_documents_resource_id ON team_resource_documents(resource_id);

-- RLS
ALTER TABLE team_resource_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_team_resource_documents" ON team_resource_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate existing data from team_resources into the new documents table
INSERT INTO team_resource_documents (resource_id, document_type, url, file_path, file_name, file_size, mime_type, sort_order, created_at)
SELECT id, resource_type, url, file_path, file_name, file_size, mime_type, 0, created_at
FROM team_resources
WHERE resource_type IS NOT NULL;
