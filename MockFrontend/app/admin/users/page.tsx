"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Plus, UserCog, Mail, Shield, Calendar } from "lucide-react";
import { useState } from "react";

const users = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@lunas.org",
    role: "Admin",
    status: "active",
    lastLogin: "2024-03-18",
  },
  {
    id: "2",
    name: "Case Manager",
    email: "casemanager@lunas.org",
    role: "Staff",
    status: "active",
    lastLogin: "2024-03-17",
  },
  {
    id: "3",
    name: "Counselor Jane",
    email: "jane@lunas.org",
    role: "Staff",
    status: "active",
    lastLogin: "2024-03-16",
  },
  {
    id: "4",
    name: "Volunteer Coordinator",
    email: "volunteer@lunas.org",
    role: "Staff",
    status: "inactive",
    lastLogin: "2024-02-28",
  },
  {
    id: "5",
    name: "Data Entry",
    email: "data@lunas.org",
    role: "Limited",
    status: "active",
    lastLogin: "2024-03-15",
  },
];

function getRoleColor(role: string) {
  switch (role) {
    case "Admin":
      return "bg-red-100 text-red-700";
    case "Staff":
      return "bg-blue-100 text-blue-700";
    case "Limited":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Last Login
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                          <UserCog className="h-5 w-5 text-accent" />
                        </div>
                        <span className="font-medium text-foreground">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getRoleColor(user.role)
                        )}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          getStatusColor(user.status)
                        )}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <UserCog className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
