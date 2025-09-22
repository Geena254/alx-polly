import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: pollId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: pollId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = await request.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.from('comments').insert({
      poll_id: pollId,
      user_id: session.user.id,
      content: content.trim(),
    }).select('*, profiles(username, avatar_url)').single();

    if (error) {
      console.error('Error posting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error posting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}