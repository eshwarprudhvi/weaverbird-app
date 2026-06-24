import { supabase } from './client';

export async function getWorks(roomId) {
    const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('room_id', roomId);

    if (error) throw error;

    return data;
}