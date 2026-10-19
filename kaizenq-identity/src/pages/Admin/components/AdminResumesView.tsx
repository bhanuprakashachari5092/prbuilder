import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Download,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  X,
  User,
} from 'lucide-react'
import { adminService, type AdminResumeItem, type PaginatedResult } from '../../../services/adminService.ts'
import type { AdminConfirmationModalState, AdminTab } from '../types.ts'

interface AdminResumesViewProps {
  onOpenConfirmation: (state: AdminConfirmationModalState) => void
  onNavigateToUser?: (userId: string) => void
}

export const AdminResumesView: React.FC<AdminResumesViewProps> = ({
  onOpenConfirmation,
  onNavigateToUser,
}) => {
  const [data, setData] = useState<PaginatedResult<AdminResumeItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [templateFilter, setTemplateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const [selectedResume, setSelectedResume] = useState<AdminResumeItem | null>(null)

  const fetchResumes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getResumes({
      search: searchTerm,
      templateFilter,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    })

    if (res.error) {
      setError(res.error.message || 'Failed to fetch resumes directory')
    } else {
      setData(res.data)
    }
    setIsLoading(false)
  }, [searchTerm, templateFilter, sortBy, sortDir, currentPage])

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchResumes()
  }

  const handleDeleteResume = (resume: AdminResumeItem) => {
    onOpenConfirmation({
      isOpen: true,
      title: 'Permanently Delete Resume?',
      message: `Are you sure you want to delete the resume "${resume.title}" belonging to ${resume.ownerName} (${resume.ownerEmail})? This action cannot be undone and will permanently remove this record from the database.`,
      confirmLabel: 'Delete Resume',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await adminService.deleteResume(
          resume.id,
          `Administrative removal of resume ${resume.id} (${resume.title})`,
        )
        if (res.error) {
          alert(`Failed to delete resume: ${res.error.message}`)
        } else {
          await fetchResumes()
          if (selectedResume?.id === resume.id) {
            setSelectedResume(null)
          }
        }
      },
    })
  }

  const handleExportCsv = () => {
    if (data?.items && data.items.length > 0) {
      adminService.exportResumesCsv(data.items)
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ATS Resume Asset Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cloud resume records, template adoption, and content structure inspection.
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
            onClick={fetchResumes}
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
            placeholder="Search by resume title, student name, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={templateFilter}
            onChange={(e) => {
              setTemplateFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Templates</option>
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="technical">Technical</option>
            <option value="minimal">Minimal</option>
            <option value="classic-ats">Classic ATS</option>
            <option value="modern-professional">Modern Professional</option>
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
            <option value="updated_at:desc">Recently Updated</option>
            <option value="title:asc">Title (A-Z)</option>
            <option value="owner:asc">Owner Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to query resumes:</span> {error}
          </div>
          <button
            onClick={fetchResumes}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Resumes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Resume Title</th>
                <th className="py-3 px-4">Owner / Student</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Sections</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-36 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-7 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No resume records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No student resumes matched the current search or template filter.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((resume) => (
                  <tr
                    key={resume.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedResume(resume)}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{resume.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{resume.ownerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{resume.ownerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {resume.selectedTemplate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">{resume.sectionCount}</span>
                      <span className="text-[10px] text-slate-400 ml-1">sections</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedResume(resume)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="View Resume Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResume(resume)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              of <span className="font-semibold text-slate-700">{data.total}</span> resumes
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

      {/* Resume Metadata Modal */}
      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedResume.title}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {selectedResume.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedResume(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Name:</span>
                  <span className="font-semibold text-slate-800">{selectedResume.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Email:</span>
                  <span className="font-mono text-slate-700">{selectedResume.ownerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner ID:</span>
                  <span className="font-mono text-[10px] text-slate-600 select-all">{selectedResume.userId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">ATS Template</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedResume.selectedTemplate}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">Populated Sections</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedResume.sectionCount} / 5</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Created:</span>
                  <span className="font-medium">{new Date(selectedResume.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Updated:</span>
                  <span className="font-medium">{new Date(selectedResume.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Private resume text is protected under tenant privacy policies and is not shown in this metadata view.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedResume(null)
                  if (onNavigateToUser) onNavigateToUser(selectedResume.userId)
                }}
                className="px-3.5 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                View User Profile
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedResume(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteResume(selectedResume)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
                >
                  Delete Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
