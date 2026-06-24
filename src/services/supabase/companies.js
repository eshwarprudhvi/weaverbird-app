import { supabase } from './client';

export async function getCompanies() {
    const { data, error } = await supabase
        .from('companies')
        .select('*');

    if (error) throw error;

    return data;
}

export async function createCompany(name) {
    const joinCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { data, error } = await supabase
        .from('companies')
        .insert({
            name,
            join_code: joinCode,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}