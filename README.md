# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

---

# Security Audit Findings and Fixes

This document outlines the security vulnerabilities discovered in the Polling Application and the proposed steps to remedy them.

## 1. Missing Authorization Check in `deletePoll` Function

**Vulnerability:** The `deletePoll` function (`app/lib/actions/poll-actions.ts`) currently allows any authenticated user to delete any poll by simply knowing its ID. There is no check to verify if the user is the owner of the poll.

**Remedy:** Implement an authorization check within the `deletePoll` function to ensure that only the poll owner or an authorized administrator can delete a poll. This involves fetching the user's session and comparing their `user_id` with the `user_id` associated with the poll.

**Proposed Fix:**

```typescript
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
```

## 2. Admin Page Lacks Access Control

**Vulnerability:** The admin page (`app/(dashboard)/admin/page.tsx`) allows any user to view and delete all polls in the system. There is no check to verify if the user has administrative privileges.

**Remedy:** Implement proper role-based access control for the admin page. Only users with an 'admin' role should be able to access this page and its functionalities. This requires a mechanism to assign and check user roles, potentially through a `user_roles` table in Supabase.

**Proposed Fix:**

```typescript:%2Fhome%2Fgeorgina_kim%2Falx-polly%2Fapp%2F(dashboard)%2Fadmin%2Fpage.tsx
// Add at the beginning of the component
const { user } = useAuth();

// Add after the component declaration
useEffect(() => {
  // Check if user has admin role
  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (error || !data || data.role !== 'admin') {
      router.push('/polls'); // Redirect non-admins
    } else {
      fetchAllPolls();
    }
  };
  
  checkAdminAccess();
}, [user]);
```

## 3. CSRF Protection Missing

**Vulnerability:** The application does not implement CSRF protection for form submissions, making it vulnerable to cross-site request forgery attacks. An attacker could trick a logged-in user into performing unintended actions.

**Remedy:** Implement CSRF protection for all form submissions, especially those that perform state-changing operations (e.g., creating polls, voting, deleting). This typically involves generating and validating a unique, unpredictable token with each form submission.

**Proposed Fix:**

```typescript
// Add to server actions
import { csrf } from '@/lib/csrf';

export async function createPoll(formData: FormData) {
  // Verify CSRF token
  const csrfToken = formData.get('csrf_token') as string;
  if (!await csrf.verify(csrfToken)) {
    return { error: 'Invalid CSRF token' };
  }
  
  // Rest of the function
  // ...
}
```

## 4. XSS Vulnerability in Poll Sharing

**Vulnerability:** The `vulnerable-share.tsx` component does not properly sanitize user input (e.g., poll title) before including it in share links and messages. This could lead to Cross-Site Scripting (XSS) attacks if malicious scripts are injected into the poll title and then shared.

**Remedy:** Sanitize all user-generated content before it is rendered on the page or included in URLs for sharing. Libraries like `DOMPurify` can be used for effective HTML sanitization.

**Proposed Fix:**

```typescript:%2Fhome%2Fgeorgina_kim%2Falx-polly%2Fapp%2F(dashboard)%2Fpolls%2Fvulnerable-share.tsx
// Update the sharing functions
const shareOnTwitter = () => {
  // Sanitize the poll title
  const sanitizedTitle = DOMPurify.sanitize(pollTitle);
  const text = encodeURIComponent(`Check out this poll: ${sanitizedTitle}`);
  const url = encodeURIComponent(shareUrl);
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    "_blank",
  );
};
```

## 5. Voting Without Authentication and Rate Limiting

**Vulnerability:** The `submitVote` function allows anonymous voting, which could lead to vote manipulation, ballot stuffing, or other forms of abuse. Additionally, there is no rate limiting, making the voting system susceptible to automated attacks.

**Remedy:** Implement authentication requirements for voting to ensure that only logged-in users can cast votes. Furthermore, add rate limiting to prevent a single user or IP address from submitting an excessive number of votes within a short period.

**Proposed Fix:**

```typescript:%2Fhome%2Fgeorgina_kim%2Falx-polly%2Fapp%2Flib%2Factions%2Fpoll-actions.ts
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require login to vote
  if (!user) return { error: 'You must be logged in to vote.' };
  
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
```

## 6. Password Strength Requirements

**Vulnerability:** The registration form does not enforce password strength requirements, allowing users to set weak passwords that are easily guessable or susceptible to brute-force attacks.

**Remedy:** Implement client-side and server-side password strength validation during user registration. This should include checks for minimum length, presence of uppercase and lowercase letters, numbers, and special characters.

**Proposed Fix:**

```typescript:%2Fhome%2Fgeorgina_kim%2Falx-polly%2Fapp%2F(auth)%2Fregister%2Fpage.tsx
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setLoading(true);
  setError(null);
  const formData = new FormData(event.currentTarget);
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }
  
  // Password strength validation
  if (password.length < 8) {
    setError('Password must be at least 8 characters long');
    setLoading(false);
    return;
  }
  
  // Check for complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    setError('Password must include uppercase, lowercase, numbers, and special characters');
    setLoading(false);
    return;
  }

  const result = await register({ name, email, password });
  // Rest of the function
};
```

## 7. Input Validation for Poll Creation/Editing

**Vulnerability:** The poll creation and editing functions do not properly validate and sanitize user input. This can lead to various vulnerabilities, including SQL injection (if not using parameterized queries, though Supabase helps here), XSS, and data integrity issues.

**Remedy:** Implement robust input validation and sanitization for all user-provided data, such as poll questions and options. This includes checking for length constraints, data types, and sanitizing any potentially malicious characters.

**Proposed Fix:**

```typescript:%2Fhome%2Fgeorgina_kim%2Falx-polly%2Fapp%2Flib%2Factions%2Fpoll-actions.ts
export async function createPoll(formData: FormData) {
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
  for (const option of options) {
    if (option.trim().length === 0) {
      return { error: "Options cannot be empty." };
    }
    if (option.length > 100) {
      return { error: "Options are too long (maximum 100 characters)." };
    }
  }
  
  // Sanitize inputs
  const sanitizedQuestion = DOMPurify.sanitize(question);
  const sanitizedOptions = options.map(opt => DOMPurify.sanitize(opt));

  // Rest of the function
  // ...
}
```

## Summary

These security fixes address the most critical vulnerabilities in the application by:

1.  Adding proper authorization checks for poll deletion.
2.  Implementing role-based access control for admin pages.
3.  Adding CSRF protection for form submissions.
4.  Fixing XSS vulnerabilities in poll sharing.
5.  Adding authentication requirements and rate limiting for voting.
6.  Implementing password strength requirements.
7.  Adding proper input validation and sanitization.

Implementing these changes will significantly improve the security posture of the application by preventing unauthorized access, data manipulation, and various injection attacks.
