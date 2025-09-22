"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comment } from '@/app/lib/types';

interface CommentsSectionProps {
  pollId: string;
}

export default function CommentsSection({ pollId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [pollId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/polls/${pollId}/comments`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }
      setComments(data.comments);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/polls/${pollId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }
      setComments((prev) => [data.comment, ...prev]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
      console.error('Error posting comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Comments</h3>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {isLoading && comments.length === 0 && <p>Loading comments...</p>}
      
      <div className="space-y-4 mb-6">
        {comments.length === 0 && !isLoading && !error ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={comment.profiles?.avatar_url || 'https://github.com/shadcn.png'} />
                  <AvatarFallback>{comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{comment.profiles?.username || 'Anonymous'}</p>
                <p className="text-sm text-gray-500 ml-auto">{new Date(comment.created_at).toLocaleString()}</p>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <Textarea
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isLoading}
        ></Textarea>
        <Button 
          onClick={handlePostComment} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={isLoading || !newComment.trim()}
        >
          {isLoading ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </div>
  );
}