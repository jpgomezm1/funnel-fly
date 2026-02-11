-- ============================================================
-- MODULO TO-DO LIST - Migracion completa
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Labels disponibles
CREATE TABLE todo_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE todo_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_labels" ON todo_labels FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO todo_labels (name, color) VALUES
  ('Personal', '#3B82F6'), ('Equipo', '#8B5CF6'), ('Urgente', '#EF4444'),
  ('Reunion', '#F59E0B'), ('Seguimiento', '#10B981'), ('Documentacion', '#6366F1'),
  ('Cliente', '#EC4899');

-- 2. Tabla principal de tareas
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  parent_todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_parent ON todos(parent_todo_id);
CREATE INDEX idx_todos_created_by ON todos(created_by);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todos" ON todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Asignaciones (many-to-many para tareas compartidas)
CREATE TABLE todo_assignees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_display_name TEXT,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by TEXT,
  UNIQUE(todo_id, user_id)
);

CREATE INDEX idx_todo_assignees_todo ON todo_assignees(todo_id);
CREATE INDEX idx_todo_assignees_user ON todo_assignees(user_id);

ALTER TABLE todo_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_assignees" ON todo_assignees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Junction table Todo-Label
CREATE TABLE todo_label_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES todo_labels(id) ON DELETE CASCADE,
  UNIQUE(todo_id, label_id)
);

CREATE INDEX idx_todo_label_todo ON todo_label_assignments(todo_id);

ALTER TABLE todo_label_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_label_assignments" ON todo_label_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Comentarios en tareas
CREATE TABLE todo_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_todo_comments_todo ON todo_comments(todo_id);

ALTER TABLE todo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_comments" ON todo_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Archivos adjuntos
CREATE TABLE todo_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by TEXT,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_todo_attachments_todo ON todo_attachments(todo_id);

ALTER TABLE todo_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_attachments" ON todo_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Preferencias de notificacion por usuario
CREATE TABLE todo_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  notify_on_assignment BOOLEAN DEFAULT true,
  notify_on_comment BOOLEAN DEFAULT true,
  notify_on_due_date BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  due_date_reminder_hours INT DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE todo_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_todo_notification_settings" ON todo_notification_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Storage bucket para adjuntos
INSERT INTO storage.buckets (id, name, public) VALUES ('todo-attachments', 'todo-attachments', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "auth_todo_storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'todo-attachments') WITH CHECK (bucket_id = 'todo-attachments');
