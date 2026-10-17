import React, { useState } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'

export interface ProjectFormData {
  title: string
  tagline: string
  tags: string
  liveUrl: string
  githubUrl: string
  metrics: string
}

export interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProject: (project: ProjectFormData) => void
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    tagline: '',
    tags: '',
    liveUrl: '',
    githubUrl: '',
    metrics: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onAddProject(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 relative text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Add Project to Showcase</h3>
              <p className="text-xs text-[#64748B]">
                Attach a repository or live project to your profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Task Orchestrator"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">
              One-line Tagline / Architecture Impact *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High-throughput distributed scheduling with sub-5ms latency"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Tech Stack Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Python, FastAPI, Redis"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Key Performance Metric
              </label>
              <input
                type="text"
                placeholder="e.g. 5,000 req/sec"
                value={formData.metrics}
                onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Production Live Demo URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.liveUrl}
                onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center gap-2 text-xs text-[#2563EB]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Projects appear directly on your published portfolio and ATS resume</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="glow" size="sm" type="submit">
              Save Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProjectModal
