import { getAllUsers, getAllPolls, getPlatformStats, isAdmin } from "@/app/lib/actions/admin-actions";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect("/polls");
  }

  // Fetch admin data
  const [usersResult, pollsResult, statsResult] = await Promise.all([
    getAllUsers(),
    getAllPolls(),
    getPlatformStats(),
  ]);

  return (
    <AdminDashboard
      users={usersResult.users}
      polls={pollsResult.polls}
      stats={statsResult.stats}
      errors={{
        users: usersResult.error,
        polls: pollsResult.error,
        stats: statsResult.error,
      }}
    />
  );
}
