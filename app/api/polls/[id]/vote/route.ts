import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { optionIndex } = await request.json();

    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid option index' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to vote.' },
        { status: 401 }
      );
    }

    // Check rate limiting
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentVotes && recentVotes.length >= 5) {
      const oldestVote = new Date(recentVotes[4].created_at);
      const timeDiff = (new Date().getTime() - oldestVote.getTime()) / 1000;
      if (timeDiff < 60) { // 5 votes per minute
        return NextResponse.json(
          { error: 'Voting too fast. Please wait before voting again.' },
          { status: 429 }
        );
      }
    }

    // Check if user has already voted on this poll
    const { data: existingVote } = await supabase
      .from("votes")
      .select()
      .eq("poll_id", params.id)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("votes").insert([
      {
        poll_id: params.id,
        user_id: user.id,
        option_index: optionIndex,
      },
    ]);

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