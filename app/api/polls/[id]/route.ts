import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import DOMPurify from 'dompurify';
import Tokens from 'csrf';

const csrf = new Tokens();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { poll: null, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ poll: data, error: null });
  } catch (error) {
    return NextResponse.json(
      { poll: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a poll." },
        { status: 401 }
      );
    }

    // First check if the poll belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (pollError) {
      return NextResponse.json(
        { error: pollError.message },
        { status: 404 }
      );
    }

    if (!poll) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (poll.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this poll" },
        { status: 403 }
      );
    }

    // Now delete the poll
    const { error } = await supabase.from("polls").delete().eq("id", params.id);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/polls");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();

    // Verify CSRF token
    const csrf_token = formData.get('csrf_token') as string;
    const csrf_secret = await csrf.secret();
    if (!await csrf.verify(csrf_secret, csrf_token)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    if (!question || options.length < 2) {
      return NextResponse.json(
        { error: "Please provide a question and at least two options." },
        { status: 400 }
      );
    }

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 401 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to update a poll." },
        { status: 401 }
      );
    }

    // Only allow updating polls owned by the user
    const { error } = await supabase
      .from("polls")
      .update({ question, options })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}