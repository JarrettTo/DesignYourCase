import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';



export async function POST(req: Request) {
  try {
      
    const body = await req.json();
    const userId = body.email;

      // --- Fetch designs based on the user ID ---
      // This is more robust if user_id in designs table is the auth.users UUID
      const { data: designs, error: designsError } = await supabase
        .from('designs')
        .select('id, created_at, user_id, design_data, image_url, phone_model, case_material, case_style')
        .eq('user_id', userId); // Filter by the authenticated user's ID

      if (designsError) {
        console.error('Error fetching designs for user ID:', userId, designsError);
        // Return a server error
        return NextResponse.json({ message: 'Error fetching designs', error: designsError.message }, { status: 500 });
      }

      // Return the array of designs
      // Supabase typically returns the data as JSON objects, so design_data will be a string if saved as text.
      return NextResponse.json(designs, { status: 200 });


  } catch (error: any) {
    console.error('API Error in /api/get-saved-cases:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}