import React from 'react'
import {
  Plus,
  ExternalLink,
  Star,
  GitBranch,
  TrendingUp,
  FolderCode,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { Badge } from '../../../components/ui/Badge.tsx'

export interface ProjectsViewProps {
  projects: Array<{
    title: string
    tagline: string
    stars: number
    tags: string[]
    metrics: string
    liveUrl?: string
    githubUrl?: string
  }>
  onOpenAddModal: () => void
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, onOpenAddModal }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#111827]">Project Showcase</h2>
            <Badge variant="cyan" size="sm">
              {projects.length} Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Projects showcased on your personal portfolio and ATS resume.
          </p>
        </div>

        <Button
          variant="glow"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenAddModal}
        >
          Add New Project
        </Button>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center border border-[#BFDBFE]">
            <FolderCode className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#111827]">
              No projects added yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Showcase your open source projects, full-stack applications, and technical contributions to stand out to hiring managers.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="glow"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onOpenAddModal}
            >
              Add Your First Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project, idx) => (
            <div
              key={project.title + idx}
              className="rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] p-6 flex flex-col justify-between transition-all shadow-sm group"
            >
              <div>
                {/* Header: Title and Stars */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                        {project.title}
                      </h3>
                      {project.stars > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{project.stars} GitHub Stars</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-xs sm:text-sm text-[#64748B] mt-3 leading-relaxed">
                  {project.tagline}
                </p>

                {/* Tags */}
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 my-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Meta & Actions */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-[#2563EB] font-mono text-[11px]">
                  <TrendingUp className="w-3 h-3 text-[#2563EB]" />
                  <span>{project.metrics || 'Production Ready'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white text-[#64748B] hover:text-[#111827] hover:border-[#CBD5E1] transition-all border border-[#E2E8F0]"
                      title="View GitHub Repository"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-xs font-semibold transition-all"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsView
