import { sendPollClosingEmail } from "./email";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null
          })),
        })),
      })),
    })),
  })),
}));

describe("sendPollClosingEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log email content and insert a notification record into the database", async () => {
    const mockPoll = {
      id: "123",
      question: "Test Poll Question",
      options: ["Option 1", "Option 2"],
      created_at: "2023-01-01T00:00:00Z",
      expires_at: "2023-01-02T00:00:00Z",
      created_by: "user1",
      total_votes: 10,
      profiles: { email: "creator@example.com" },
    };
    const recipientEmail = "test@example.com";

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await sendPollClosingEmail(mockPoll, recipientEmail);

    // Expect console.log to have been called with the email content
    expect(consoleSpy).toHaveBeenCalledWith(
      `\n--- Sending Poll Closing Email ---`,
      `To: ${recipientEmail}`,
      `Subject: Your Poll "${mockPoll.question}" has closed!`,
      `\nDear ${mockPoll.profiles.email || "Poll Creator"},`,
      `\nYour poll titled "${mockPoll.question}" has officially closed.`,
      `\nYou can view the final results here: [Link to Poll Results] (e.g., /polls/${mockPoll.id})`,
      `\nThank you for using our polling service.`,
      `\nBest regards,`,
      `The Polly Team`,
      `----------------------------------\n`
    );

    // Expect Supabase insert to have been called
    const { createClient } = require("@/lib/supabase/server");
    const supabase = createClient();
    expect(supabase.from).toHaveBeenCalledWith("email_notifications");
    expect(supabase.from("email_notifications").insert).toHaveBeenCalledWith({
      user_id: mockPoll.created_by,
      poll_id: mockPoll.id,
      type: "poll_closing",
      email: recipientEmail,
    });

    consoleSpy.mockRestore();
  });
});