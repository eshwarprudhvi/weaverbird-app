import { CreateCompany, GetCompanies } from './services/supabase/companies.js';

export async function testCompany() {
    try {
        const company = await CreateCompany('My First Company');

        console.log('Created Company:', company);

        const companies = await getCompanies();

        console.log('All Companies:', companies);
    } catch (error) {
        console.error(error);
    }
}

testCompany();