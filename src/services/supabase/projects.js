import { supabase } from './client';

export async function getProjects(companyId) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null);

    if (error) throw error;

    return data;
}

export async function createProject(payload) {
    const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}