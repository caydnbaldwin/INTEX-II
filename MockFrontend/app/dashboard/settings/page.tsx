"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { donors } from "@/lib/mock-data";
import { User, Mail, Bell, CreditCard, Shield } from "lucide-react";

type Donor = (typeof donors)[0];

export default function DonorSettingsPage() {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [monthlyUpdates, setMonthlyUpdates] = useState(true);
  const [impactReports, setImpactReports] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const foundDonor = donors.find((d) => d.id === userId);
    if (foundDonor) {
      setDonor(foundDonor);
    } else {
      setDonor(donors[0]);
    }
  }, []);

  if (!donor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account preferences and notification settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={donor.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={donor.lastName} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={donor.email} />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose what updates you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive donation receipts and confirmations
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Monthly Updates</p>
                <p className="text-sm text-muted-foreground">
                  Get a monthly summary of your impact
                </p>
              </div>
              <Switch
                checked={monthlyUpdates}
                onCheckedChange={setMonthlyUpdates}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Impact Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive quarterly reports on organizational impact
                </p>
              </div>
              <Switch
                checked={impactReports}
                onCheckedChange={setImpactReports}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your saved payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                  VISA
                </div>
                <div>
                  <p className="font-medium text-foreground">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/27</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
            <Button variant="outline" className="mt-4">
              Add Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
