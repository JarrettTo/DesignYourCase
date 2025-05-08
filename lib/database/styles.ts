import { supabase } from '../supabaseClient';
import { Database } from './types';

export type CaseType = 'Transparent' | 'Colored';

export type CaseStyle = Database['public']['Tables']['case_styles']['Row'] & {
    mockup?: string | null;
};

/**
 * Get all case styles for a specific phone brand
 * @param brand - The phone brand to search for (e.g., 'iPhone', 'Samsung')
 * @returns An array of case styles or null if there was an error
 */
export async function getDesignsByBrand(brand: string): Promise<CaseStyle[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_designs_by_brand', { p_brand: brand });

        if (error) {
            console.error('Error fetching designs:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getDesignsByBrand:', error);
        return [];
    }
}
