import { supabase } from './supabase';

export async function loadSessionProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, eco_points')
    .eq('id', user.id)
    .maybeSingle();
  return { user, profile };
}

export async function loadReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReport(payload) {
  const withCategory = { ...payload };
  let { error } = await supabase.from('reports').insert(withCategory);
  if (error && withCategory.category) {
    const { category, description, ...rest } = withCategory;
    ({ error } = await supabase.from('reports').insert({
      ...rest,
      description: `[${category}] ${description}`,
    }));
  }
  if (error) throw error;
}
