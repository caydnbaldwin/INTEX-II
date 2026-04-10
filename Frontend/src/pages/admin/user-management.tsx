import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronDown, Loader2, MoreHorizontal, UserX, UserCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TablePagination } from '@/components/TablePagination'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface ApiUser {
  id: string
  email: string | null
  userName: string | null
  displayName: string
  roles: string[]
  isActive: boolean
}

const ALL_ROLES = ['Admin', 'Staff', 'Donor'] as const
type Role = (typeof ALL_ROLES)[number]

// ── Badge styling ────────────────────────────────────────────────────────────
function roleBadgeClass(role: string): string {
  switch (role) {
    case 'Admin':
      return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
    case 'Staff':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
    case 'Donor':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    default:
      return ''
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export function UserManagement() {
  usePageTitle('User Management')

  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string[]>([])
  const [roleFilterOpen, setRoleFilterOpen] = useState(false)
  const [draftFilterRole, setDraftFilterRole] = useState<string[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<ApiUser[]>('/api/users')
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users', err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (u.email?.toLowerCase().includes(q) ?? false) ||
      (u.userName?.toLowerCase().includes(q) ?? false) ||
      u.displayName.toLowerCase().includes(q)
    const matchesRole =
      filterRole.length === 0 ||
      filterRole.some((r) => u.roles.includes(r))
    return matchesSearch && matchesRole
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterRole])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // ── Role update ────────────────────────────────────────────────────────────
  async function handleRoleChange(userId: string, newRole: Role) {
    setUpdatingId(userId)
    try {
      const updated = await api.put<ApiUser>(`/api/users/${userId}/roles`, {
        roles: [newRole],
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: updated.roles } : u)),
      )
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      console.error('Failed to update role', err)
      toast.error('Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Deactivate / Activate ─────────────────────────────────────────────────
  async function handleToggleActive(user: ApiUser) {
    setUpdatingId(user.id)
    const action = user.isActive ? 'deactivate' : 'activate'
    try {
      await api.post(`/api/users/${user.id}/${action}`, {})
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
      )
      toast.success(`Account ${user.isActive ? 'deactivated' : 'activated'}`)
    } catch (err) {
      console.error(`Failed to ${action} user`, err)
      toast.error(`Failed to ${action} account`)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setUpdatingId(deleteTarget.id)
    try {
      await api.delete(`/api/users/${deleteTarget.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      toast.success('Account deleted')
    } catch (err) {
      console.error('Failed to delete user', err)
      toast.error('Failed to delete account')
    } finally {
      setUpdatingId(null)
      setDeleteTarget(null)
    }
  }

  // ── Filter helpers ─────────────────────────────────────────────────────────
  function toggleSelection(value: string) {
    setDraftFilterRole((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    )
  }

  function handleRoleFilterOpenChange(open: boolean) {
    if (open) {
      setDraftFilterRole(filterRole)
      setRoleFilterOpen(true)
      return
    }
    setFilterRole(draftFilterRole)
    setRoleFilterOpen(false)
  }

  function formatFilterLabel(): string {
    if (filterRole.length === 0) return 'All Roles'
    if (filterRole.length === 1) return filterRole[0]
    return `Roles (${filterRole.length})`
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          User Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          {filterRole.length > 0 || search ? ' (filtered)' : ''}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu open={roleFilterOpen} onOpenChange={handleRoleFilterOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[140px] justify-between gap-2 font-normal"
            >
              <span className="truncate">{formatFilterLabel()}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[180px]">
            <DropdownMenuLabel>Roles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_ROLES.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={draftFilterRole.includes(role)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => toggleSelection(role)}
              >
                {role}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <div className="p-1">
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setFilterRole(draftFilterRole)
                  setRoleFilterOpen(false)
                }}
              >
                Apply
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {(search || filterRole.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setFilterRole([])
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Current Role</TableHead>
              <TableHead className="text-muted-foreground">Change Role</TableHead>
              <TableHead className="text-muted-foreground w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((user) => {
                const primaryRole = user.roles[0] ?? 'None'
                const isBusy = updatingId === user.id
                return (
                  <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                    <TableCell className="font-medium text-foreground">
                      {user.displayName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email ?? user.userName ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.isActive
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                        }
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={roleBadgeClass(role)}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={primaryRole}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as Role)
                        }
                        disabled={isBusy || !user.isActive}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isBusy}
                          >
                            {isBusy
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive
                              ? <><UserX className="mr-2 h-4 w-4" />Deactivate</>
                              : <><UserCheck className="mr-2 h-4 w-4" />Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.displayName}</strong>{' '}
              ({deleteTarget?.email}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
