import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Download,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Globe,
  Calendar,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { adminService, type AdminUserItem, type PaginatedResult } from '../../../services/adminService.ts'
import type { AdminConfirmationModalState } from '../types.ts'

interface AdminUsersViewProps {
  onOpenConfirmation: (state: AdminConfirmationModalState) => void
  currentAdminId?: string
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  onOpenConfirmation,
  currentAdminId,
}) => {
  const [data, setData] = useState<PaginatedResult<AdminUserItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Profile Detail Drawer State
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getUsers({
      search: searchTerm,
      roleFilter,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    })

    if (res.error) {
      setError(res.error.message || 'Failed to fetch users directory')
    } else {
      setData(res.data)
    }
    setIsLoading(false)
  }, [searchTerm, roleFilter, sortBy, sortDir, currentPage])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleRoleToggle = (user: AdminUserItem) => {
    const isPromoting = !user.isAdmin
    onOpenConfirmation({
      isOpen: true,
      title: isPromoting ? 'Promote User to Platform Administrator?' : 'Revoke Administrator Privileges?',
      message: isPromoting
        ? `Are you sure you want to grant administrator access to "${user.displayName}" (${user.email})? This user will have full access to platform statistics, user management, and assets.`
        : `Are you sure you want to remove administrator privileges from "${user.displayName}" (${user.email})? They will be returned to regular student member permissions.`,
      confirmLabel: isPromoting ? 'Confirm Promotion' : 'Revoke Privileges',
      confirmVariant: isPromoting ? 'primary' : 'warning',
      onConfirm: async () => {
        const res = await adminService.updateUserRole(
          user.id,
          isPromoting,
          `Administrator role update initiated from admin directory`,
        )
        if (res.error) {
          alert(`Failed to update role: ${res.error.message}`)
        } else {
          await fetchUsers()
          if (selectedUser?.id === user.id) {
            setSelectedUser({ ...user, isAdmin: isPromoting })
          }
        }
      },
    })
  }

  const handleExportCsv = () => {
    if (data?.items && data.items.length > 0) {
      adminService.exportUsersCsv(data.items)
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            User Directory &amp; Access Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real registered members from Supabase authentication and profile records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={!data?.items.length}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Filtered CSV
          </button>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, email, or headline..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators Only</option>
            <option value="user">Standard Members</option>
          </select>

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(':')
              setSortBy(sb)
              setSortDir(sd as 'asc' | 'desc')
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="created_at:desc">Newest Signups</option>
            <option value="created_at:asc">Oldest Signups</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="resumes:desc">Most Resumes</option>
            <option value="portfolios:desc">Most Portfolios</option>
            <option value="activity:desc">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to query user directory:</span> {error}
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Resumes</th>
                <th className="py-3 px-4">Portfolios</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-slate-200 rounded" />
                          <div className="w-36 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="w-16 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-8 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-8 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-7 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No registered users matched your query</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search parameters or filtering by another role.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((user) => {
                  const isCurrentAdmin = currentAdminId === user.id
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {user.displayName}
                            </div>
                            <div className="text-slate-500 text-[11px] font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            Member
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{user.resumeCount}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{user.portfolioCount}</span>
                          {user.publishedPortfolioCount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              ({user.publishedPortfolioCount} live)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-2.5 py-1 text-slate-600 hover:text-blue-600 font-medium rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Profile
                          </button>

                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleRoleToggle(user)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                user.isAdmin
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                              title={user.isAdmin ? 'Demote from Admin' : 'Promote to Admin'}
                            >
                              {user.isAdmin ? 'Demote' : 'Make Admin'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(data.page - 1) * data.pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(data.page * data.pageSize, data.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{data.total}</span> users
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-medium text-slate-700">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-slate-500 text-xs font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Profile Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">User ID</span>
                  <span className="font-mono text-[10px] text-slate-700 select-all">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Platform Role</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    selectedUser.isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedUser.isAdmin ? 'Platform Administrator' : 'Standard Student'}
                  </span>
                </div>
                {selectedUser.headline && (
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Headline</span>
                    <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{selectedUser.headline}"
                    </p>
                  </div>
                )}
              </div>

              {/* Assets & Usage Metrics */}
              <div>
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                  Studio Assets &amp; Activity
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Resumes</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{selectedUser.resumeCount}</div>
                    <span className="text-[10px] text-slate-400">Created ATS drafts</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Portfolios</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{selectedUser.portfolioCount}</div>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {selectedUser.publishedPortfolioCount} published live
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Session &amp; Security Timeline
                </h4>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> Registration:
                  </span>
                  <span className="font-medium text-slate-700">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> Last Profile Update:
                  </span>
                  <span className="font-medium text-slate-700">
                    {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Shield className="w-3.5 h-3.5" /> Last Activity:
                  </span>
                  <span className="font-medium text-slate-700">
                    {selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              {/* Security & Access Management Actions */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                  Administrative Privilege
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Administrator role assignment is enforced server-side. Updates are logged to the audit log.
                </p>

                {currentAdminId !== selectedUser.id ? (
                  <button
                    onClick={() => handleRoleToggle(selectedUser)}
                    className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                      selectedUser.isAdmin
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {selectedUser.isAdmin ? 'Revoke Administrator Access' : 'Grant Administrator Access'}
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium text-center">
                    You are currently signed in with this administrator account.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
