/**
 * DonorAutomationView.tsx
 *
 * Self-contained React component for the Donor Outreach automation page.
 * Designed to be copied into Frontend/src/pages/ when ready to integrate.
 *
 * Calls the Flask API at API_BASE (default http://localhost:5050).
 * Swap API_BASE to the .NET backend URL when migrating.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Mail,
  Play,
  SendHorizonal,
  ChevronDown,
  Eye,
  Activity,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:5050";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationState {
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  runs: RunEntry[];
  scheduler_running: boolean;
  emails_this_week: number;
}

interface RunEntry {
  timestamp: string;
  candidates_found: number;
  emails_sent: number;
  model_accuracy: number;
  p75_threshold: number;
  triggered_by?: string;
}

interface Donor {
  rank: number;
  supporter_id: number;
  display_name: string;
  first_name: string;
  email: string;
  email_masked: string;
  upgrade_score: "High" | "Medium" | "Low";
  upgrade_candidate: number;
  upgrade_probability: number;
  Monetary_avg: number;
  Monetary_total: number;
  Frequency: number;
  Recency: number;
  latest_donation: string;
  acquisition_channel: string;
}

interface ConfigResponse {
  env: "development" | "production";
  from_email: string;
  reply_to: string;
  from_name: string;
}

interface DonorResponse {
  donors: Donor[];
  accuracy: number;
  p75: number;
  total: number;
  candidates: number;
  error?: string;
}

interface EmailEntry {
  donor_id: number;
  donor_name: string;
  email: string;
  timestamp: string;
  subject: string;
  body: string;
  status: string;
  triggered_by: string;
  message_id?: string;
  template_id?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtPHP(n: number) {
  return `₱${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtRelativeFromNow(iso: string | null) {
  if (!iso) return "Never";
  const now = new Date();
  const then = new Date(iso);
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((now.getTime() - then.getTime()) / dayMs);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function scoreBadge(score: Donor["upgrade_score"]) {
  const map = {
    High: "bg-primary/10 text-primary border-primary/20",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-muted text-muted-foreground border-border",
  } as const;
  return (
    <Badge variant="outline" className={cn("text-xs", map[score])}>
      {score}
    </Badge>
  );
}

function templateBadge(templateId?: string) {
  const id = (templateId || "").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    vip: { label: "VIP", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    mid_tier: { label: "Mid-tier", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    first_time: { label: "First-time", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    win_back: { label: "Win-back", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  };
  const item = map[id];
  if (!item) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <Badge variant="outline" className={cn("text-xs", item.cls)}>
      {item.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-serif text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DonorAutomationView() {
  const [state, setState] = useState<AutomationState | null>(null);
  const [donorData, setDonorData] = useState<DonorResponse | null>(null);
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [automationOn, setAutomationOn] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  /** Email log section starts collapsed */
  const [logOpen, setLogOpen] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<EmailEntry | null>(null);
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  // ── Fetch all data ──────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [stateRes, donorRes, emailRes, configRes] = await Promise.all([
        fetch(`${API_BASE}/api/state`),
        fetch(`${API_BASE}/api/donors`),
        fetch(`${API_BASE}/api/email-log`),
        fetch(`${API_BASE}/api/config`),
      ]);

      if (!stateRes.ok || !donorRes.ok || !emailRes.ok) {
        throw new Error("One or more API requests failed");
      }

      const [stateJson, donorJson, emailJson] = await Promise.all([
        stateRes.json(),
        donorRes.json(),
        emailRes.json(),
      ]);

      if (configRes.ok) {
        const configJson = await configRes.json();
        setConfig(configJson);
      }

      setState(stateJson);
      setDonorData(donorJson);
      setEmails(emailJson);
      setAutomationOn(stateJson.enabled ?? false);
      setError(donorJson.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Actions ─────────────────────────────────────────────────────────────

  async function toggleAutomation(checked: boolean) {
    setToggling(true);
    try {
      const endpoint = checked ? "/api/automate/on" : "/api/automate/off";
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
      if (!res.ok) throw new Error("Toggle failed");
      setAutomationOn(checked);
      toast.success(checked ? "Automation enabled" : "Automation disabled");
      await fetchAll();
    } catch {
      toast.error("Could not toggle automation");
    } finally {
      setToggling(false);
    }
  }

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/run-now`, { method: "POST" });
      if (!res.ok) throw new Error("Run failed");
      toast.success("Pipeline refreshed — outreach run triggered");
      setTimeout(fetchAll, 2000);
    } catch {
      toast.error("Pipeline run failed");
    } finally {
      setRunning(false);
    }
  }

  async function sendTestEmail() {
    setSendingTest(true);
    try {
      const res = await fetch(`${API_BASE}/api/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ethansmithxela23@gmail.com" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Test email sent! ID: ${data.message_id}`);
      } else {
        toast.error(`Send failed: ${data.error}`);
      }
      await fetchAll();
    } catch {
      toast.error("Could not send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function sendInvite(donor: Donor) {
    setSendingId(donor.supporter_id);
    try {
      const res = await fetch(`${API_BASE}/api/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_id: donor.supporter_id }),
      });
      const data = await res.json();
      if (data.success) {
        const masked = donor.email_masked || donor.email;
        toast.success(`Email sent to ${masked}`);
      } else {
        toast.error(`Failed: ${data.error}`);
      }
      await fetchAll();
    } catch {
      toast.error("Could not send email");
    } finally {
      setSendingId(null);
    }
  }

  if (error && !donorData) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-12 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Could not reach the donor automation API at {API_BASE}. Make sure{" "}
            <code className="rounded bg-muted px-1 text-xs">app.py</code> is
            running.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const emailsSentCount = emails.filter((e) => e.status === "sent").length;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-12 lg:px-8">
      {/* ── ENV BANNER ─────────────────────────────────────────────────── */}
      {config?.env === "development" && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertCircle className="size-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Development Mode</AlertTitle>
          <AlertDescription className="text-amber-700">
            All emails are being redirected to the test address. No real donors
            will be contacted.
          </AlertDescription>
        </Alert>
      )}
      {config?.env === "production" && (
        <Alert className="border-red-300 bg-red-50 text-red-900">
          <AlertCircle className="size-4 text-red-600" />
          <AlertTitle className="text-red-800">Production Mode</AlertTitle>
          <AlertDescription className="text-red-700">
            Emails will be sent to real donor addresses.
          </AlertDescription>
        </Alert>
      )}

      {/* ── PAGE HEADER (matches site section heading pattern) ──────── */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
          Administration
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          Donor Outreach
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Identify and contact your best upgrade candidates automatically
        </p>
      </div>

      {/* ── 1. AUTOMATION CONTROL CARD ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <CardTitle className="font-serif text-xl font-semibold tracking-tight">
                  Weekly Automation
                </CardTitle>
                <CardDescription>
                  Automated pipeline runs and donor outreach scheduling
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={automationOn}
                  onCheckedChange={toggleAutomation}
                  disabled={toggling}
                />
                <span className="text-sm font-medium">Enabled</span>
                {automationOn ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                  >
                    <span className="mr-1 inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timing info */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              Last run:{" "}
              <span className="font-medium text-foreground">
                {fmtDate(state?.last_run ?? null)}
              </span>
            </span>
            <span>
              Next scheduled:{" "}
              <span className="font-medium text-foreground">
                {automationOn ? fmtDate(state?.next_run ?? null) : "—"}
              </span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={runNow} disabled={running} size="sm">
              <Play className="size-4" />
              {running ? "Running…" : "Run Now"}
            </Button>
            <Button
              onClick={sendTestEmail}
              disabled={sendingTest}
              variant="outline"
              size="sm"
            >
              <SendHorizonal className="size-4" />
              {sendingTest ? "Sending…" : "Send Test Email"}
            </Button>
          </div>

          {/* Stats row */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Donors In Outreach"
                value={donorData?.total ?? 0}
                icon={Users}
              />
              <StatCard
                label="Emails Sent"
                value={emailsSentCount}
                icon={SendHorizonal}
              />
              <StatCard
                label="Model Accuracy"
                value={`${donorData?.accuracy ?? 0}%`}
                icon={TrendingUp}
              />
              <StatCard
                label="Emails This Week"
                value={state?.emails_this_week ?? 0}
                icon={Activity}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {(donorData?.total ?? 0)} donors in outreach | last run: {fmtDate(state?.last_run ?? null)} | next run: {automationOn ? fmtDate(state?.next_run ?? null) : "—"}
          </p>
        </CardContent>
      </Card>

      {/* ── 2. DONOR TABLE ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Scored Donors</CardTitle>
          <CardDescription>
            {donorData
              ? `${donorData.total} donors scored · ${donorData.total} in outreach`
              : "Loading donor data…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : donorData?.donors.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Avg Gift</TableHead>
                  <TableHead className="text-right">Total Given</TableHead>
                  <TableHead className="text-right"># Gifts</TableHead>
                  <TableHead className="text-right">Days Since Last</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Last Emailed</TableHead>
                  <TableHead>Template Used</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donorData.donors.map((d) => {
                  const lastEmail = emails.find(
                    (e) => e.donor_id === d.supporter_id,
                  );
                  const hasEmail = !!d.email;
                  const canSend = hasEmail && sendingId !== d.supporter_id;
                  return (
                    <TableRow key={d.supporter_id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {d.rank}
                      </TableCell>
                      <TableCell className="font-medium">
                        {d.display_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {hasEmail ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default text-muted-foreground">
                                  {d.email_masked}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{d.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No email
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{scoreBadge(d.upgrade_score)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtPHP(d.Monetary_avg)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtPHP(d.Monetary_total)}
                      </TableCell>
                      <TableCell className="text-right">{d.Frequency}</TableCell>
                      <TableCell className="text-right">{d.Recency}</TableCell>
                      <TableCell className="text-xs">
                        {d.acquisition_channel}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lastEmail ? fmtRelativeFromNow(lastEmail.timestamp) : "Never"}
                      </TableCell>
                      <TableCell>{templateBadge(lastEmail?.template_id)}</TableCell>
                      <TableCell className="text-right">
                        {!hasEmail ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" variant="outline" disabled className="opacity-40">
                                    No Email
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>No email address on file</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!canSend}
                            onClick={() => sendInvite(d)}
                          >
                            {sendingId === d.supporter_id
                              ? "Sending…"
                              : "Send Invite"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Alert variant="destructive" className="mx-4">
              <AlertCircle className="size-4" />
              <AlertTitle>No donor data</AlertTitle>
              <AlertDescription>
                {donorData?.error
                  ? `API error: ${donorData.error}`
                  : "No donor data returned from API — check that the Flask server is running and CSVs are accessible."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── 3. EMAIL LOG (collapsible) ──────────────────────────────────── */}
      <Card>
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform",
                      logOpen && "rotate-180",
                    )}
                  />
                  <CardTitle className="font-serif text-lg">Email Log</CardTitle>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {emailsSentCount} email{emailsSentCount !== 1 ? "s" : ""} sent
                  </Badge>
                </div>
              </button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {emails.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No emails logged yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right w-[100px]">Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.slice(0, 10).map((e, i) => (
                      <TableRow key={`${e.donor_id}-${e.timestamp}-${i}`}>
                        <TableCell className="font-medium">
                          {e.donor_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(e.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs">
                          {e.subject}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewEmail(e)}
                          >
                            <Eye className="size-4" />
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Email preview dialog */}
      <Dialog
        open={!!previewEmail}
        onOpenChange={(open) => !open && setPreviewEmail(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewEmail?.subject}</DialogTitle>
            <DialogDescription>
              To: {previewEmail?.donor_name} &lt;{previewEmail?.email}&gt; ·{" "}
              {fmtDate(previewEmail?.timestamp ?? null)}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
            {previewEmail?.body}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
