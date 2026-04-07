"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Heart, Mail, Calendar } from "lucide-react";
import { useState } from "react";

const donors = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    totalDonated: 2500,
    lastDonation: "2024-03-15",
    donationCount: 12,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@example.com",
    totalDonated: 5000,
    lastDonation: "2024-03-10",
    donationCount: 24,
  },
  {
    id: "3",
    name: "Emily Williams",
    email: "emily@example.com",
    totalDonated: 1200,
    lastDonation: "2024-02-28",
    donationCount: 6,
  },
  {
    id: "4",
    name: "David Martinez",
    email: "david@example.com",
    totalDonated: 3800,
    lastDonation: "2024-03-18",
    donationCount: 15,
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa@example.com",
    totalDonated: 950,
    lastDonation: "2024-01-20",
    donationCount: 4,
  },
];

export default function DonorsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDonors = donors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Donors
          </h1>
          <p className="mt-2 text-muted-foreground">
            View and manage donor information
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Donor
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search donors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Donors ({filteredDonors.length})</CardTitle>
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
                    Total Donated
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Donations
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Last Donation
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((donor) => (
                  <tr
                    key={donor.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                          <Heart className="h-5 w-5 text-accent" />
                        </div>
                        <span className="font-medium text-foreground">
                          {donor.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {donor.email}
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-foreground">
                      ${donor.totalDonated.toLocaleString()}
                    </td>
                    <td className="py-4 text-foreground">
                      {donor.donationCount}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(donor.lastDonation).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDonors.length === 0 && (
              <div className="py-12 text-center">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No donors found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
