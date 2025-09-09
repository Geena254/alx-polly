import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { polls: [], error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { polls: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ polls: data ?? [], error: null });
  } catch (error) {
    return NextResponse.json(
      { polls: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}