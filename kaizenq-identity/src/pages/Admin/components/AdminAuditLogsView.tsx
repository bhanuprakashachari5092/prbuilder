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
  CheckCircle2,
  XCircle,
  Code,
  X,
  Copy,
  Check,
  Database,
} from 'lucide-react'
import { adminService, type AdminAuditLogItem, type PaginatedResult } from '../../../services/adminService.ts'

const ADMIN_AUDIT_LOGS_SQL = `-- 1. Ensure public.is_admin() exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com',
    LOWER(auth.jwt() ->> 'email') = 'bhanuprakashachari5092@gmail.com',
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Create public.admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'denied')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs (target_type, target_id);

-- 4. Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_audit_logs_insert" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_insert"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 5. Helper RPC to log admin action
CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_action TEXT,
  p_target_id TEXT,
  p_target_type TEXT,
  p_outcome TEXT DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    action,
    target_id,
    target_type,
    outcome,
    metadata
  ) VALUES (
    auth.uid(),
    v_admin_email,
    p_action,
    p_target_id,
    p_target_type,
    p_outcome,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- 6. RPC for paginated audit log queries
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
  p_search TEXT DEFAULT NULL,
  p_action_filter TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offset INT;
  v_limit INT;
  v_total BIGINT;
  v_items JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  v_limit := GREATEST(1, LEAST(100, COALESCE(p_page_size, 15)));
  v_offset := (GREATEST(1, COALESCE(p_page, 1)) - 1) * v_limit;

  WITH filtered AS (
    SELECT
      l.id,
      l.admin_id,
      l.admin_email,
      l.action,
      l.target_id,
      l.target_type,
      l.outcome,
      l.metadata,
      l.created_at,
      p.display_name AS admin_name
    FROM public.admin_audit_logs l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR l.action ILIKE '%' || p_search || '%'
      OR l.target_id ILIKE '%' || p_search || '%'
      OR l.target_type ILIKE '%' || p_search || '%'
      OR l.admin_email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
    AND (
      p_action_filter IS NULL
      OR p_action_filter = 'all'
      OR l.action = p_action_filter
    )
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM filtered
  )
  SELECT total INTO v_total FROM counted;

  WITH sorted AS (
    SELECT
      l.id,
      l.admin_id,
      l.admin_email,
      l.action,
      l.target_id,
      l.target_type,
      l.outcome,
      l.metadata,
      l.created_at,
      p.display_name AS admin_name
    FROM public.admin_audit_logs l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    WHERE (
      p_search IS NULL
      OR p_search = ''
      OR l.action ILIKE '%' || p_search || '%'
      OR l.target_id ILIKE '%' || p_search || '%'
      OR l.target_type ILIKE '%' || p_search || '%'
      OR l.admin_email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
    AND (
      p_action_filter IS NULL
      OR p_action_filter = 'all'
      OR l.action = p_action_filter
    )
    ORDER BY l.created_at DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'adminId', s.admin_id,
      'adminEmail', s.admin_email,
      'adminName', COALESCE(NULLIF(s.admin_name, ''), 'Platform Admin'),
      'action', s.action,
      'targetId', s.target_id,
      'targetType', s.target_type,
      'outcome', s.outcome,
      'metadata', s.metadata,
      'createdAt', s.created_at
    )
  ) INTO v_items
  FROM sorted s;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', COALESCE(v_total, 0),
    'page', GREATEST(1, COALESCE(p_page, 1)),
    'pageSize', v_limit,
    'totalPages', CEIL(COALESCE(v_total, 0)::numeric / v_limit)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_audit_logs(TEXT, TEXT, INT, INT) TO authenticated;`

interface AdminAuditLogsViewProps {
  globalSearch?: string
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({ globalSearch }) => {
  const [data, setData] = useState<PaginatedResult<AdminAuditLogItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTableMissing, setIsTableMissing] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [showSql, setShowSql] = useState(false)

  const [searchTerm, setSearchTerm] = useState(globalSearch || '')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null)

  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== searchTerm) {
      setSearchTerm(globalSearch)
      setCurrentPage(1)
    }
  }, [globalSearch])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getAuditLogs({
      search: searchTerm,
      actionFilter,
      page: currentPage,
      pageSize,
    })

    if (res.isTableMissing) {
      setIsTableMissing(true)
    } else {
      setIsTableMissing(false)
    }

    if (res.error) {
      setError(res.error.message || 'Failed to fetch audit logs')
    } else {
      setError(null)
      setData(res.data)
    }
    setIsLoading(false)
  }, [searchTerm, actionFilter, currentPage])

  const handleCopySql = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(ADMIN_AUDIT_LOGS_SQL)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2500)
    }
  }

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

      {/* Schema Cache / Missing Table Migration Banner */}
      {isTableMissing && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Supabase Database Setup Required for Cloud Audit Logs</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  The <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-[11px] font-semibold">public.admin_audit_logs</code> table is not present in your Supabase database schema cache. Local audit tracking is active.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 hover:bg-amber-100/50 text-amber-800 dark:text-amber-200 font-semibold text-xs transition cursor-pointer"
              >
                {showSql ? 'Hide SQL' : 'View SQL'}
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Migration</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showSql && (
            <div className="mt-2">
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono max-h-56 select-all">
                {ADMIN_AUDIT_LOGS_SQL}
              </pre>
            </div>
          )}

          <div className="text-[11px] text-amber-700 dark:text-amber-400 pl-7">
            To enable permanent cloud-synced audit logs, copy the migration SQL and execute it in your <strong>Supabase Dashboard → SQL Editor</strong>.
          </div>
        </div>
      )}

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
