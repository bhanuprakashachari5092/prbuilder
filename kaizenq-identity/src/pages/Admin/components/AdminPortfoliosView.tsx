import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Download,
  Globe,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Eye,
  ExternalLink,
  EyeOff,
  User,
  X,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react'
import { adminService, type AdminPortfolioItem, type PaginatedResult } from '../../../services/adminService.ts'
import { buildSubdomainUrl, getPlatformDomain } from '../../../lib/domainUtils.ts'
import { getBaseAppUrl } from '../../../lib/supabase.ts'
import type { AdminConfirmationModalState } from '../types.ts'

interface AdminPortfoliosViewProps {
  onOpenConfirmation: (state: AdminConfirmationModalState) => void
  onNavigateToUser?: (userId: string) => void
}

export const AdminPortfoliosView: React.FC<AdminPortfoliosViewProps> = ({
  onOpenConfirmation,
  onNavigateToUser,
}) => {
  const [data, setData] = useState<PaginatedResult<AdminPortfolioItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [themeFilter, setThemeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const [selectedPortfolio, setSelectedPortfolio] = useState<AdminPortfolioItem | null>(null)

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getPortfolios({
      search: searchTerm,
      statusFilter,
      themeFilter,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    })

    if (res.error) {
      setError(res.error.message || 'Failed to fetch portfolios directory')
    } else {
      setData(res.data)
    }
    setIsLoading(false)
  }, [searchTerm, statusFilter, themeFilter, sortBy, sortDir, currentPage])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPortfolios()
  }

  const handleUnpublish = (portfolio: AdminPortfolioItem) => {
    onOpenConfirmation({
      isOpen: true,
      title: 'Unpublish Portfolio?',
      message: `Are you sure you want to unpublish "${portfolio.title || 'Untitled'}" (slug: ${portfolio.slug})? The portfolio will immediately be revoked from public access and converted to a private draft. Student data will NOT be deleted.`,
      confirmLabel: 'Unpublish Portfolio',
      confirmVariant: 'warning',
      onConfirm: async () => {
        const res = await adminService.unpublishPortfolio(
          portfolio.id,
          `Administrative unpublish of portfolio ${portfolio.id} (${portfolio.slug})`,
        )
        if (res.error) {
          alert(`Failed to unpublish: ${res.error.message}`)
        } else {
          await fetchPortfolios()
          if (selectedPortfolio?.id === portfolio.id) {
            setSelectedPortfolio({ ...portfolio, publicationStatus: 'draft' })
          }
        }
      },
    })
  }

  const handleDeletePortfolio = (portfolio: AdminPortfolioItem) => {
    onOpenConfirmation({
      isOpen: true,
      title: 'Permanently Delete Portfolio?',
      message: `Are you sure you want to permanently delete "${portfolio.title || 'Untitled'}" belonging to ${portfolio.ownerName}? All associated cloud portfolio data and project associations will be completely removed. This cannot be undone.`,
      confirmLabel: 'Delete Portfolio',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await adminService.deletePortfolio(
          portfolio.id,
          `Administrative deletion of portfolio ${portfolio.id} (${portfolio.title})`,
        )
        if (res.error) {
          alert(`Failed to delete portfolio: ${res.error.message}`)
        } else {
          await fetchPortfolios()
          if (selectedPortfolio?.id === portfolio.id) {
            setSelectedPortfolio(null)
          }
        }
      },
    })
  }

  const handleExportCsv = () => {
    if (data?.items && data.items.length > 0) {
      adminService.exportPortfoliosCsv(data.items)
    }
  }

  const getPublicUrl = (portfolio: AdminPortfolioItem) => {
    if (portfolio.customHostname) return `https://${portfolio.customHostname}`
    if (portfolio.slug) return buildSubdomainUrl(portfolio.slug)
    return `${getBaseAppUrl()}/p/${portfolio.id}`
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Portfolio Studio &amp; Domain Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit published web sites, review public slugs, custom hostnames, and manage student sites safely.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={!data?.items.length}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Metadata CSV
          </button>
          <button
            onClick={fetchPortfolios}
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
            placeholder="Search by portfolio title, slug, student name, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Live</option>
            <option value="draft">Private Drafts</option>
          </select>

          <select
            value={themeFilter}
            onChange={(e) => {
              setThemeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Themes</option>
            <option value="midnight">Midnight</option>
            <option value="minimal">Minimal</option>
            <option value="developer">Developer</option>
            <option value="creative">Creative</option>
            <option value="modern">Modern</option>
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
            <option value="created_at:desc">Newest Created</option>
            <option value="created_at:asc">Oldest Created</option>
            <option value="published_at:desc">Recently Published</option>
            <option value="title:asc">Title (A-Z)</option>
            <option value="owner:asc">Owner Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to query portfolios:</span> {error}
          </div>
          <button
            onClick={fetchPortfolios}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Portfolios Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Portfolio Title</th>
                <th className="py-3 px-4">Owner / Student</th>
                <th className="py-3 px-4">Status &amp; Slug</th>
                <th className="py-3 px-4">Theme</th>
                <th className="py-3 px-4">Projects</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-36 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-20 h-7 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Globe className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No portfolio records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No student portfolios matched the current search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((portfolio) => {
                  const isPublished = portfolio.publicationStatus === 'published'
                  const publicUrl = isPublished ? getPublicUrl(portfolio) : null

                  return (
                    <tr
                      key={portfolio.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPortfolio(portfolio)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          <Globe className={`w-4 h-4 shrink-0 ${isPublished ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{portfolio.title || 'Untitled Portfolio'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{portfolio.ownerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{portfolio.ownerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              Draft
                            </span>
                          )}

                          {portfolio.slug && (
                            <div className="text-[11px] font-mono text-slate-500">
                              /{portfolio.slug}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-slate-700">{portfolio.theme}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{portfolio.projectCount}</span>
                        <span className="text-[10px] text-slate-400 ml-1">projects</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {portfolio.createdAt ? new Date(portfolio.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPublished && publicUrl && (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Preview Live Site in New Window"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {isPublished && (
                            <button
                              onClick={() => handleUnpublish(portfolio)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                              title="Revoke Public Link (Unpublish)"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeletePortfolio(portfolio)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Portfolio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              of <span className="font-semibold text-slate-700">{data.total}</span> portfolios
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-medium text-slate-700">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Detail Modal */}
      {selectedPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedPortfolio.publicationStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedPortfolio.title || 'Untitled Portfolio'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {selectedPortfolio.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Name:</span>
                  <span className="font-semibold text-slate-800">{selectedPortfolio.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Email:</span>
                  <span className="font-mono text-slate-700">{selectedPortfolio.ownerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Publication Status:</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    selectedPortfolio.publicationStatus === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedPortfolio.publicationStatus === 'published' ? 'Live on Web' : 'Private Draft'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">Theme</span>
                  <span className="font-semibold text-slate-900 text-sm capitalize">{selectedPortfolio.theme}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">Showcased Projects</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedPortfolio.projectCount}</span>
                </div>
              </div>

              {selectedPortfolio.publicationStatus === 'published' && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                  <span className="font-semibold text-emerald-900 block text-[11px]">
                    Verified Public Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-800 truncate select-all">
                      {getPublicUrl(selectedPortfolio)}
                    </span>
                    <a
                      href={getPublicUrl(selectedPortfolio)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-medium text-[11px] hover:bg-emerald-700 flex items-center gap-1 shrink-0 ml-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visit Site
                    </a>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Created:</span>
                  <span className="font-medium">{new Date(selectedPortfolio.createdAt).toLocaleString()}</span>
                </div>
                {selectedPortfolio.publishedAt && (
                  <div className="flex justify-between text-slate-600">
                    <span>Published At:</span>
                    <span className="font-medium">{new Date(selectedPortfolio.publishedAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Last Updated:</span>
                  <span className="font-medium">{new Date(selectedPortfolio.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedPortfolio(null)
                  if (onNavigateToUser) onNavigateToUser(selectedPortfolio.userId)
                }}
                className="px-3.5 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                View User Profile
              </button>

              <div className="flex items-center gap-2">
                {selectedPortfolio.publicationStatus === 'published' && (
                  <button
                    onClick={() => handleUnpublish(selectedPortfolio)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  onClick={() => handleDeletePortfolio(selectedPortfolio)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
