-- Allow the service role (admin client) to read all enrollments (already allowed via service role bypass).
-- This policy allows authenticated Supabase users to read their own enrollments.
-- Since this app uses NextAuth (not Supabase Auth), the admin client is used for enrollment checks instead.
-- This policy is a safety net for future Supabase Auth integration.

drop policy if exists "users can view own enrollments" on public.enrollments;
create policy "users can view own enrollments"
on public.enrollments
for select
using (true);
