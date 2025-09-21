"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Check if user is admin
export async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // Check user role in profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

// Get all users (admin only)
export async function getAllUsers() {
  const supabase = await createClient();
  
  if (!(await isAdmin())) {
    return { users: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return { users: [], error: error.message };
  return { users: data ?? [], error: null };
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: "admin" | "user") {
  const supabase = await createClient();
  
  if (!(await isAdmin())) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  
  revalidatePath("/admin");
  return { error: null };
}

// Get all polls (admin only)
export async function getAllPolls() {
  const supabase = await createClient();
  
  if (!(await isAdmin())) {
    return { polls: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      profiles!polls_user_id_fkey(email)
    `)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// Delete any poll (admin only)
export async function adminDeletePoll(pollId: string) {
  const supabase = await createClient();
  
  if (!(await isAdmin())) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", pollId);

  if (error) return { error: error.message };
  
  revalidatePath("/admin");
  revalidatePath("/polls");
  return { error: null };
}

// Get platform statistics (admin only)
export async function getPlatformStats() {
  const supabase = await createClient();
  
  if (!(await isAdmin())) {
    return { stats: null, error: "Unauthorized" };
  }

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get total polls
  const { count: totalPolls } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true });

  // Get total votes
  const { count: totalVotes } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  // Get polls created in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: recentPolls } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  return {
    stats: {
      totalUsers: totalUsers || 0,
      totalPolls: totalPolls || 0,
      totalVotes: totalVotes || 0,
      recentPolls: recentPolls || 0,
    },
    error: null,
  };
}
