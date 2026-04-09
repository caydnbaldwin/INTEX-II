import { useEffect, useMemo, useState } from "react";
import { Mail, Save, Eye, Braces } from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const API_BASE = "http://localhost:5050";

type Template = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  note?: string;
  subject: string;
  body: string;
  placeholders: string[];
  last_edited: string | null;
  last_edited_by: string | null;
};

type PreviewResponse = {
  subject_rendered: string;
  body_rendered: string;
  donor_used: { supporter_id: number; display_name: string; first_name: string };
};

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

function templateBadgeClass(id: string) {
  if (id === "vip") return "bg-purple-50 text-purple-700 border-purple-200";
  if (id === "mid_tier") return "bg-blue-50 text-blue-700 border-blue-200";
  if (id === "first_time") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-orange-50 text-orange-700 border-orange-200";
}

function triggerLabel(t: Template) {
  if (t.id === "vip") return "Sent to donors with 8+ gifts";
  if (t.id === "mid_tier") return "Sent to donors with 3-7 gifts";
  if (t.id === "first_time") return "Sent to donors with 1-2 gifts";
  return "Sent to donors with 90+ days since last gift";
}

function TemplateEditorCard({
  template,
  onSave,
  onPreview,
}: {
  template: Template;
  onSave: (id: string, subject: string, body: string) => Promise<void>;
  onPreview: (id: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: template.body.replace(/\n/g, "<br/>"),
    editorProps: { attributes: { class: "min-h-[240px] p-3 outline-none" } },
  });

  useEffect(() => {
    setSubject(template.subject);
    editor?.commands.setContent(template.body.replace(/\n/g, "<br/>"));
  }, [template, editor]);

  const bodyText = useMemo(() => editor?.getText({ blockSeparator: "\n\n" }) ?? template.body, [editor, template.body]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <Badge variant="outline" className={cn("text-xs", templateBadgeClass(template.id))}>
            {template.id === "vip" ? "VIP" : template.id === "mid_tier" ? "Mid" : template.id === "first_time" ? "First-time" : "Win-back"}
          </Badge>
        </div>
        <CardDescription>{triggerLabel(template)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div className="rounded-md border">
          <EditorContent editor={editor} />
        </div>
        <div className="flex flex-wrap gap-2">
          {["first_name", "frequency", "program_area", "tenure_years", "monetary_total", "recency_days"].map((ph) => (
            <Button
              key={ph}
              size="sm"
              variant="outline"
              onClick={() => editor?.chain().focus().insertContent(`{{${ph}}}`).run()}
            >
              {"{{" + ph + "}}"}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Last edited: {fmtDate(template.last_edited)}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onPreview(template.id)}>
              <Eye className="size-4" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(template.id, subject, bodyText);
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailTemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function loadTemplates() {
    const res = await fetch(`${API_BASE}/api/templates`);
    const data = await res.json();
    setTemplates(data.templates ?? []);
  }

  useEffect(() => {
    loadTemplates().catch(() => toast.error("Failed to load templates"));
  }, []);

  async function saveTemplate(id: string, subject: string, body: string) {
    const res = await fetch(`${API_BASE}/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, edited_by: "admin" }),
    });
    if (!res.ok) {
      toast.error("Save failed");
      return;
    }
    toast.success("Template saved");
    await loadTemplates();
  }

  async function previewTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId) || null;
    setPreviewTemplate(template);
    const res = await fetch(`${API_BASE}/api/templates/${templateId}/preview`);
    if (!res.ok) {
      toast.error("Preview failed");
      return;
    }
    const data = await res.json();
    setPreview(data);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Email Templates</h1>
          </div>
          <p className="text-muted-foreground mt-2">Manage and customize donor outreach templates</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((t) => (
          <TemplateEditorCard key={t.id} template={t} onSave={saveTemplate} onPreview={previewTemplate} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Braces className="size-4" />
            Placeholder Reference
          </CardTitle>
          <CardDescription>Available variables for all templates</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><code>{"{{first_name}}"}</code> — Donor&apos;s first name</p>
          <p><code>{"{{frequency}}"}</code> — Number of donations</p>
          <p><code>{"{{program_area}}"}</code> — Program their money funded</p>
          <p><code>{"{{tenure_years}}"}</code> — Years since first donation</p>
          <p><code>{"{{monetary_total}}"}</code> — Lifetime giving in PHP</p>
          <p><code>{"{{recency_days}}"}</code> — Days since last donation</p>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Previewing with: {preview?.donor_used?.display_name ?? "Sample donor"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" variant={showRaw ? "outline" : "default"} onClick={() => setShowRaw(false)}>Rendered</Button>
            <Button size="sm" variant={showRaw ? "default" : "outline"} onClick={() => setShowRaw(true)}>Raw Template</Button>
          </div>
          {showRaw ? (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">{previewTemplate?.subject}</div>
              <pre className="rounded-md border p-3 text-sm whitespace-pre-wrap">{previewTemplate?.body}</pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">{preview?.subject_rendered}</div>
              <pre className="rounded-md border p-3 text-sm whitespace-pre-wrap">{preview?.body_rendered}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

