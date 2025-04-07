import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log(body);
        const { data: design, error } = await supabase
            .from("design")
            .select(
                `id, design_file, phone_model, 
             design_images(image_id, images(image_link))`
            )
            .eq("user_email", body.email);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        return NextResponse.json({ design }, { status: 200 });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
