import { useEffect, useMemo, useState } from 'react'
import { Mail, Save, Eye, Braces } from 'lucide-react'
import { toast } from 'sonner'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/lib/api'

type Template = {
  templateId: string
  name: string
  description: string
  trigger: string
  subject: string
  body: string
  lastEdited: string | null
  lastEditedBy: string | null
}

type PreviewResponse = {
  subjectRendered: string
  bodyRendered: string
  donorUsed: { displayName: string }
}

function fmtDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString()
}

function templateBadgeClass(id: string) {
  if (id === 'loyal') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'
  if (id === 'first_time') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
  if (id === 'win_back') return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
  return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
}

function triggerLabel(t: Template) {
  if (t.templateId === 'loyal') return 'Sent to returning donors with 3+ gifts'
  if (t.templateId === 'first_time') return 'Sent to new donors with 1-2 gifts'
  if (t.templateId === 'win_back') return 'Sent to donors with 90+ days since last gift'
  return t.trigger || 'Custom trigger'
}

function TemplateEditorCard({
  template,
  onSave,
  onPreview,
}: {
  template: Template
  onSave: (id: string, subject: string, body: string) => Promise<void>
  onPreview: (id: string) => Promise<void>
}) {
  const [subject, setSubject] = useState(template.subject)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: template.body.replace(/\n/g, '<br/>'),
    editorProps: { attributes: { class: 'min-h-[240px] p-3 outline-none prose prose-sm dark:prose-invert max-w-none' } },
  })

  useEffect(() => {
    setSubject(template.subject)
    editor?.commands.setContent(template.body.replace(/\n/g, '<br/>'))
  }, [template, editor])

  const bodyText = useMemo(() => editor?.getText({ blockSeparator: '\n\n' }) ?? template.body, [editor, template.body])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <Badge variant="outline" className={cn('text-xs', templateBadgeClass(template.templateId))}>
            {template.templateId === 'loyal' ? 'Loyal' : template.templateId === 'first_time' ? 'First-time' : 'Win-back'}
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
          {['first_name', 'frequency', 'program_area', 'tenure_years', 'monetary_total', 'recency_days'].map((ph) => (
            <Button
              key={ph}
              size="sm"
              variant="outline"
              onClick={() => editor?.chain().focus().insertContent(`{{${ph}}}`).run()}
            >
              {'{{' + ph + '}}'}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Last edited: {fmtDate(template.lastEdited)}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onPreview(template.templateId)}>
              <Eye className="size-4" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setSaving(true)
                try {
                  await onSave(template.templateId, subject, bodyText)
                } finally {
                  setSaving(false)
                }
              }}
            >
              <Save className="size-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmailTemplates() {
  usePageTitle('Email Templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  async function loadTemplates() {
    const data = await api.get<Template[]>('/api/email-automation/templates')
    setTemplates(data)
  }

  useEffect(() => {
    loadTemplates().catch(() => toast.error('Failed to load templates'))
  }, [])

  async function saveTemplate(id: string, subject: string, body: string) {
    try {
      await api.put(`/api/email-automation/templates/${id}`, { subject, body, editedBy: 'admin' })
      toast.success('Template saved')
      await loadTemplates()
    } catch {
      toast.error('Save failed')
    }
  }

  async function handlePreview(templateId: string) {
    const template = templates.find((t) => t.templateId === templateId) || null
    setPreviewTemplate(template)
    try {
      const data = await api.get<PreviewResponse>(`/api/email-automation/templates/${templateId}/preview`)
      setPreview(data)
    } catch {
      toast.error('Preview failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Manage and customize donor outreach email templates.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((t) => (
          <TemplateEditorCard key={t.templateId} template={t} onSave={saveTemplate} onPreview={handlePreview} />
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
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{first_name}}'}</code> — Donor's first name</p>
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{frequency}}'}</code> — Number of donations</p>
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{program_area}}'}</code> — Program their money funded</p>
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{tenure_years}}'}</code> — Years since first donation</p>
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{monetary_total}}'}</code> — Lifetime giving in PHP</p>
          <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'{{recency_days}}'}</code> — Days since last donation</p>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Previewing with: {preview?.donorUsed?.displayName ?? 'Sample donor'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" variant={showRaw ? 'outline' : 'default'} onClick={() => setShowRaw(false)}>Rendered</Button>
            <Button size="sm" variant={showRaw ? 'default' : 'outline'} onClick={() => setShowRaw(true)}>Raw Template</Button>
          </div>
          {showRaw ? (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">{previewTemplate?.subject}</div>
              <pre className="rounded-md border p-3 text-sm whitespace-pre-wrap">{previewTemplate?.body}</pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">{preview?.subjectRendered}</div>
              <pre className="rounded-md border p-3 text-sm whitespace-pre-wrap">{preview?.bodyRendered}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
