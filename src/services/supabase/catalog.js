import { supabase } from './client';

export async function getCatalogItems(companyId) {
    const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .eq('company_id', companyId);

    if (error) throw error;

    return data;
}