"use server";

import { createClient }  from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import DOMPurify from 'dompurify';
import Tokens from 'csrf';

const csrf = new Tokens();

// CREATE POLL
export async function generateCsrfToken() {
  return csrf.secret();
}

export async function createPoll(formData: FormData) {
  // Verify CSRF token
  const csrf_token = formData.get("csrf_token") as string;
  const csrf_secret = await csrf.secret();
  if (!csrf.verify(csrf_secret, csrf_token)) {
    return { error: 'Invalid CSRF token' };
  }

  const supabase = await createClient();
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate input
  if (!question || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  
  if (question.length > 255) {
    return { error: "Question is too long (maximum 255 characters)." };
  }

  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  // Validate each option
  // In both createPoll and updatePoll functions:
  const forbiddenChars = /[<>"'&]/;
  if (forbiddenChars.test(question)) {
    return { error: "Question contains invalid characters" };
  }
  
  for (const option of options) {
    if (forbiddenChars.test(option)) {
      return { error: "Options contain invalid characters" };
    }
  }

  if (options.length > 100) {
    return { error: "Options are too long (maximum 100 characters)." };
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
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
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
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to vote.' };
  
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
      return { error: 'Voting too fast. Please wait before voting again.' };
    }
  }

  // Check if user has already voted on this poll
  const { data: existingVote } = await supabase
    .from("votes")
    .select()
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();
    
  if (existingVote) {
    return { error: "You have already voted on this poll" };
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }
  
  // First check if the poll belongs to the user
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (pollError) {
    return { error: pollError.message };
  }
  
  if (!poll) {
    return { error: "Poll not found" };
  }
  
  // Verify ownership
  if (poll.user_id !== user.id) {
    return { error: "You don't have permission to delete this poll" };
  }
  
  // Now delete the poll
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  // Verify CSRF token
  const csrf_token = formData.get('csrf_token') as string;
  const csrf_secret = await csrf.secret();
  if (!await csrf.verify(csrf_secret, csrf_token)) {
    return { error: 'Invalid CSRF token' };
  }

  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

interface PollActionResponse {
  error: string | null;
  [key: string]: any; // Additional response properties
}

// Update all function signatures to explicitly return PollActionResponse
