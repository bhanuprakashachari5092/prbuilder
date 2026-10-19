import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileText,
  User,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Code,
  X,
} from 'lucide-react'
import { adminService, type AdminAuditLogItem, type PaginatedResult } from '../../../services/adminService.ts'

export const AdminAuditLogsView: React.FC = () => {
  const [data, setData] = useState<PaginatedResult<AdminAuditLogItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getAuditLogs({
      search: searchTerm,
      actionFilter,
      page: currentPage,
      pageSize,
    })

    if (res.error) {
      setError(res.error.message || 'Failed to fetch audit logs')
    } else {
      setData(res.data)
    }
    setIsLoading(false)
  }, [searchTerm, actionFilter, currentPage])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLogs()
  }

  const getTargetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'resume':
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />
      case 'portfolio':
        return <Globe className="w-3.5 h-3.5 text-emerald-600" />
      case 'user':
        return <User className="w-3.5 h-3.5 text-blue-600" />
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrative Audit Trail
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable, append-only log recording sensitive administrator mutations and asset lifecycle events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          title="Refresh audit log"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, administrator email, or target ID..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="user_role_updated">User Role Updated</option>
            <option value="resume_deleted">Resume Deleted</option>
            <option value="portfolio_unpublished">Portfolio Unpublished</option>
            <option value="portfolio_deleted">Portfolio Deleted</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to fetch audit logs:</span> {error}
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-28 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-12 h-6 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No audit logs recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Administrative mutations will automatically generate records here.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getTargetIcon(log.targetType)}
                        <span className="capitalize font-medium text-slate-700">{log.targetType}</span>
                        {log.targetId && (
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            ({log.targetId.slice(0, 8)}...)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{log.adminName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.adminEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {log.outcome === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          {log.outcome}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 font-medium rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Metadata
                      </button>
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
              of <span className="font-semibold text-slate-700">{data.total}</span> audit records
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

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-mono">{selectedLog.action}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Log ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-400 block mb-0.5">Admin Actor</span>
                  <span className="font-semibold text-slate-900 block">{selectedLog.adminName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{selectedLog.adminEmail}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-400 block mb-0.5">Target</span>
                  <span className="font-semibold text-slate-900 block capitalize">{selectedLog.targetType}</span>
                  <span className="text-[11px] text-slate-500 font-mono truncate block select-all">
                    {selectedLog.targetId || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">Payload Metadata:</span>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2">
                <span>Recorded Timestamp:</span>
                <span className="font-mono">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
