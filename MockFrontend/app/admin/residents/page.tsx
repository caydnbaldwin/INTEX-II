"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { residents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Search, Plus, Edit, User } from "lucide-react";
import { useState } from "react";

function getRiskLevelColor(riskLevel: string) {
  switch (riskLevel) {
    case "Low":
      return "bg-green-100 text-green-700";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "High":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getUrgencyColor(score: number) {
  if (score <= 3) return "text-green-600";
  if (score <= 6) return "text-yellow-600";
  return "text-red-600";
}

export default function ResidentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResidents = residents.filter(
    (resident) =>
      resident.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Residents Database
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and view all resident records
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resident
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search residents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Residents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Residents ({filteredResidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Full Name
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Date Enrolled
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Risk Level
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Urgency Score
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => (
                  <tr
                    key={resident.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {resident.firstName} {resident.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            DOB:{" "}
                            {new Date(resident.dateOfBirth).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-foreground">
                      {new Date(resident.dateEnrolled).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getRiskLevelColor(resident.riskLevel)
                        )}
                      >
                        {resident.riskLevel}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "font-semibold",
                          getUrgencyColor(resident.urgencyScore)
                        )}
                      >
                        {resident.urgencyScore}/10
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/residents/${resident.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResidents.length === 0 && (
              <div className="py-12 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No residents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
