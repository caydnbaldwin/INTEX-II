"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { residents } from "@/lib/mock-data";
import { ArrowLeft, User, Save } from "lucide-react";
import Link from "next/link";

export default function ResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resident = residents.find((r) => r.id === params.id);

  const [formData, setFormData] = useState({
    firstName: resident?.firstName || "",
    lastName: resident?.lastName || "",
    dateOfBirth: resident?.dateOfBirth || "",
    dateEnrolled: resident?.dateEnrolled || "",
    riskLevel: resident?.riskLevel || "Low",
    urgencyScore: resident?.urgencyScore?.toString() || "1",
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!resident) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Resident not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The resident you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/admin/residents">Back to Residents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push("/admin/residents");
  };

  const handleCancel = () => {
    router.push("/admin/residents");
  };

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/admin/residents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Residents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Resident Record
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and edit resident information
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Image Column */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-muted">
                  <User className="h-20 w-20 text-muted-foreground" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  ID: {resident.id}
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Upload Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEnrolled">Date Enrolled</Label>
                  <Input
                    id="dateEnrolled"
                    type="date"
                    value={formData.dateEnrolled}
                    onChange={(e) =>
                      setFormData({ ...formData, dateEnrolled: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, riskLevel: value })
                    }
                  >
                    <SelectTrigger id="riskLevel">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgencyScore">Urgency Score (1-10)</Label>
                  <Select
                    value={formData.urgencyScore}
                    onValueChange={(value) =>
                      setFormData({ ...formData, urgencyScore: value })
                    }
                  >
                    <SelectTrigger id="urgencyScore">
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
