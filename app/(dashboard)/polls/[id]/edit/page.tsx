import { notFound } from 'next/navigation';
// Import the client component
import EditPollForm from './EditPollForm';

export default async function EditPollPage({ params }: { params: { id: string } }) {
  let poll = null;
  let error = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/polls/${params.id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch poll');
    }

    const data = await response.json();
    poll = data.poll;
    error = data.error;
  } catch (err) {
    error = 'Failed to load poll';
    console.error('Error fetching poll:', err);
  }

  if (error || !poll) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}