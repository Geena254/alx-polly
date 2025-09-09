import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import DOMPurify from 'dompurify';
import Tokens from 'csrf';

const csrf = new Tokens();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Verify CSRF token
    const csrf_token = formData.get("csrf_token") as string;
    const csrf_secret = await csrf.secret();
    if (!csrf.verify(csrf_secret, csrf_token)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const question = formData.get("question") as string;
    const options = formData.getAll("options").filter(Boolean) as string[];

    // Validate input
    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a valid question." },
        { status: 400 }
      );
    }

    if (question.length > 255) {
      return NextResponse.json(
        { error: "Question is too long (maximum 255 characters)." },
        { status: 400 }
      );
    }

    if (options.length < 2) {
      return NextResponse.json(
        { error: "Please provide at least two options." },
        { status: 400 }
      );
    }

    // Validate each option
    const forbiddenChars = /[<>"'&]/;
    if (forbiddenChars.test(question)) {
      return NextResponse.json(
        { error: "Question contains invalid characters" },
        { status: 400 }
      );
    }

    for (const option of options) {
      if (forbiddenChars.test(option)) {
        return NextResponse.json(
          { error: "Options contain invalid characters" },
          { status: 400 }
        );
      }
    }

    if (options.length > 100) {
      return NextResponse.json(
        { error: "Options are too long (maximum 100 characters)." },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedQuestion = DOMPurify.sanitize(question);
    const sanitizedOptions = options.map((opt: string) => DOMPurify.sanitize(opt));

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
        { error: "You must be logged in to create a poll." },
        { status: 401 }
      );
    }

    // Insert poll into database
    const { error } = await supabase.from("polls").insert([
      {
        user_id: user.id,
        question: sanitizedQuestion,
        options: sanitizedOptions,
      },
    ]);

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