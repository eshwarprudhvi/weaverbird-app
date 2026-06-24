import { supabase } from './client';

export async function getMaterials(roomId) {
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('room_id', roomId);

    if (error) throw error;

    return data;
}