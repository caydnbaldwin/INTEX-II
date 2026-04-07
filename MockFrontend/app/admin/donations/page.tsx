"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, DollarSign, Calendar, User } from "lucide-react";
import { useState } from "react";

const donations = [
  {
    id: "1",
    donorName: "Sarah Johnson",
    amount: 250,
    date: "2024-03-18",
    status: "completed",
    method: "Credit Card",
  },
  {
    id: "2",
    donorName: "Michael Chen",
    amount: 500,
    date: "2024-03-17",
    status: "completed",
    method: "PayPal",
  },
  {
    id: "3",
    donorName: "Emily Williams",
    amount: 100,
    date: "2024-03-16",
    status: "pending",
    method: "Bank Transfer",
  },
  {
    id: "4",
    donorName: "David Martinez",
    amount: 1000,
    date: "2024-03-15",
    status: "completed",
    method: "Credit Card",
  },
  {
    id: "5",
    donorName: "Lisa Thompson",
    amount: 75,
    date: "2024-03-14",
    status: "completed",
    method: "PayPal",
  },
  {
    id: "6",
    donorName: "Anonymous",
    amount: 200,
    date: "2024-03-13",
    status: "completed",
    method: "Credit Card",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function DonationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDonations = donations.filter((donation) =>
    donation.donorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Donations
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and manage all donation transactions
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total This Month</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <User className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Donations</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredDonations.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Donation</p>
              <p className="text-2xl font-bold text-foreground">
                ${Math.round(totalAmount / filteredDonations.length || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search donations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Donor
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Method
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((donation) => (
                  <tr
                    key={donation.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-4 font-medium text-foreground">
                      {donation.donorName}
                    </td>
                    <td className="py-4 font-semibold text-foreground">
                      ${donation.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(donation.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {donation.method}
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          getStatusColor(donation.status)
                        )}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDonations.length === 0 && (
              <div className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No donations found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
