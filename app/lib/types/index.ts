export interface Poll {
  id: string;
  user_id: string;
  question: string;
  options: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  expires_at?: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  poll_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
  };
}

export interface PollWithStats extends Poll {
  vote_counts: number[];
  total_votes: number;
  user_vote?: number;
  comments?: Comment[];
}

export interface EmailNotification {
  id: string;
  user_id: string;
  poll_id: string;
  type: 'poll_closing' | 'new_comment' | 'poll_created';
  sent_at: string;
  email: string;
}
