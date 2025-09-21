"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserRole, adminDeletePoll } from "@/app/lib/actions/admin-actions";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}

interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
  profiles?: {
    email: string;
  };
}

interface Stats {
  totalUsers: number;
  totalPolls: number;
  totalVotes: number;
  recentPolls: number;
}

interface AdminDashboardProps {
  users: User[];
  polls: Poll[];
  stats: Stats | null;
  errors: {
    users: string | null;
    polls: string | null;
    stats: string | null;
  };
}

export default function AdminDashboard({ users, polls, stats, errors }: AdminDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleUpdate = async (userId: string, newRole: "admin" | "user") => {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);
    
    if (result.error) {
      alert(`Error updating role: ${result.error}`);
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    
    setLoading(pollId);
    const result = await adminDeletePoll(pollId);
    
    if (result.error) {
      alert(`Error deleting poll: ${result.error}`);
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolls}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Polls (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentPolls}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="polls">Poll Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.users ? (
                <div className="text-red-500">Error loading users: {errors.users}</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, user.role === "admin" ? "user" : "admin")}
                          disabled={loading === user.id}
                        >
                          {loading === user.id ? "Updating..." : `Make ${user.role === "admin" ? "User" : "Admin"}`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Polls</CardTitle>
              <CardDescription>View and manage all polls</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.polls ? (
                <div className="text-red-500">Error loading polls: {errors.polls}</div>
              ) : (
                <div className="space-y-4">
                  {polls.map((poll) => (
                    <div key={poll.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{poll.question}</h3>
                          <div className="text-sm text-gray-500">
                            Created by: {poll.profiles?.email || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {new Date(poll.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePoll(poll.id)}
                          disabled={loading === poll.id}
                        >
                          {loading === poll.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Options:</div>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {poll.options.map((option, index) => (
                            <li key={index}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
