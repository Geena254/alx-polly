import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { EmailNotification, Poll } from "@/app/lib/types";

export async function sendPollClosingEmail(poll: Poll, recipientEmail: string, supabaseClient?: any) {
  const supabase = supabaseClient || await createSupabaseClient();

  // In a real application, you would integrate with an email service here (e.g., SendGrid, Nodemailer).
  // For this example, we'll just log the email content and store a notification record.
  console.log(`Sending poll closing email to ${recipientEmail} for poll: ${poll.question}`);
  console.log(`Poll ID: ${poll.id}`);
  console.log(`Expires At: ${poll.expires_at}`);

  // Store a record of the sent notification
  const { error } = await supabase.from("email_notifications").insert({
    user_id: poll.created_at,
    poll_id: poll.id,
    type: "poll_closing",
    email: recipientEmail,
  });

  if (error) {
    console.error("Error storing email notification record:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}