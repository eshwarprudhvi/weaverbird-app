import { supabase } from './client';

export async function getRooms(projectId) {
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('project_id', projectId);

    if (error) throw error;

    return data;
}