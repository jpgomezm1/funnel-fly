-- Allow all authenticated users to read user_roles (for team member assignment in To-Do module)
-- Supabase combines permissive policies with OR, so this won't affect existing restrictive policies
CREATE POLICY "authenticated_read_all_user_roles"
  ON user_roles FOR SELECT TO authenticated USING (true);
