'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PollResultsChart } from '@/components/poll-results-chart';
import CommentsSection from '@/components/comments/comments-section';
import { QRCodeDisplay } from '@/components/qr-code-display';
import { sendPollClosingEmail } from '@/app/lib/utils/email';
import { PollWithStats } from '@/app/lib/types';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<PollWithStats | null>(null);
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPoll = async () => {
    setLoadingPoll(true);
    setError(null);
    try {
      const response = await fetch(`/api/polls/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch poll");
      }
      setPoll(data.poll);

      // Check for poll expiration and send email if applicable
      if (data.poll.expires_at && new Date(data.poll.expires_at) < new Date()) {
        // In a real app, you'd likely have a more robust way to get the recipient email
        // For now, we'll use a placeholder or the user's email if available
        const recipientEmail = data.poll.profiles?.email || "admin@example.com";
        sendPollClosingEmail(data.poll, recipientEmail);
      }

    } catch (err: any) {
      setError(err.message);
    }
    setLoadingPoll(false);
  };

  useEffect(() => {
    fetchPoll();
  }, [params.id]);

  if (loadingPoll) {
    return <div className="text-center py-8">Loading poll...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!poll) {
    return <div className="text-center py-8">Poll not found.</div>;
  }

  const totalVotes = poll.total_votes || 0;

  const handleVote = async () => {
    if (selectedOption === null) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/polls/${params.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionIndex: selectedOption }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit vote");
      }
      setHasVoted(true);
      fetchPoll(); // Re-fetch poll to update results
    } catch (err: any) {
      setError(err.message);
    }
    setIsSubmitting(false);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const isPollExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          {isPollExpired && (
            <CardDescription className="text-red-500">This poll has expired.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVoted && !isPollExpired ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === index ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"}`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button
                onClick={handleVote}
                disabled={selectedOption === null || isSubmitting}
                className="mt-4"
              >
                {isSubmitting ? "Submitting..." : "Submit Vote"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              <PollResultsChart
                question={poll.question}
                options={poll.options}
                voteCounts={poll.vote_counts || []}
                totalVotes={totalVotes}
                userVote={poll.user_vote}
              />
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.profiles?.email || "Unknown"}</span>
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <CommentsSection pollId={params.id} />

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex flex-col items-center space-y-4">
          <QRCodeDisplay url={`${process.env.NEXT_PUBLIC_BASE_URL}/polls/${params.id}`} size={200} />
          <div className="flex space-x-2 w-full">
            <Button variant="outline" className="flex-1">
              Copy Link
            </Button>
            <Button variant="outline" className="flex-1">
              Share on Twitter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}