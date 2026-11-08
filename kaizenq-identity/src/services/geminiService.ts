import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'

export type GeminiAction =
  | 'improve_summary'
  | 'enhance_bullet'
  | 'improve_project'
  | 'suggest_skills'
  | 'fix_grammar'
  | 'tailor_to_job'
  | 'generate_intro'

export interface GeminiContext {
  role?: string
  company?: string
  technologies?: string[]
  jobDescription?: string
  userBackground?: string
  tone?: string
}

export interface GeminiResponse {
  success: boolean
  result?: string
  skills?: string[]
  error?: string
  notice?: string
}

/**
 * Trusted Gemini Career Writing Assistant Service.
 * Calls backend Supabase Edge Function to avoid leaking API keys into client bundles.
 * Provides transparent error reporting and fallback suggestions without fabrication.
 */
export const geminiService = {
  async executeAction(
    action: GeminiAction,
    text: string,
    context?: GeminiContext
  ): Promise<GeminiResponse> {
    const trimmed = (text || '').trim()

    if (!trimmed && action !== 'generate_intro') {
      return {
        success: false,
        error: 'Please enter or draft some text first before asking Gemini AI to assist.',
      }
    }

    // 1. Try Vercel / Netlify / Vite Dev Serverless API Route
    try {
      const apiRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: trimmed,
          context,
        }),
      })

      const apiData = await apiRes.json().catch(() => ({}))
      if (apiRes.ok && (apiData.result || apiData.skills)) {
        return {
          success: true,
          result: apiData.result,
          skills: apiData.skills,
        }
      }
      if (!apiRes.ok && apiData.error && !isSupabaseConfigured()) {
        return {
          success: false,
          error: apiData.error,
        }
      }
    } catch {
      // Fall through to Supabase Edge Function
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase backend is not configured.',
        notice: 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Gemini AI services.',
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: {
          action,
          text: trimmed,
          context,
        },
      })

      if (error) {
        // Fallback friendly message if backend edge function is not deployed or returns error
        return {
          success: false,
          error: error.message || 'Gemini service returned an error.',
          notice: 'Make sure GEMINI_API_KEY is configured in your Supabase backend secrets.',
        }
      }

      if (!data) {
        return {
          success: false,
          error: 'No response received from Gemini AI assistant.',
        }
      }

      return {
        success: true,
        result: data.result,
        skills: data.skills,
        notice: data.notice,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error'
      return {
        success: false,
        error: message,
        notice: 'Unable to reach backend AI assistant. Your existing content remains untouched.',
      }
    }
  },

  async improveSummary(text: string, role?: string): Promise<GeminiResponse> {
    return this.executeAction('improve_summary', text, { role })
  },

  async enhanceBullet(text: string, company?: string, role?: string): Promise<GeminiResponse> {
    return this.executeAction('enhance_bullet', text, { company, role })
  },

  async improveProject(text: string, technologies?: string[]): Promise<GeminiResponse> {
    return this.executeAction('improve_project', text, { technologies })
  },

  async suggestSkills(text: string): Promise<GeminiResponse> {
    return this.executeAction('suggest_skills', text)
  },

  async fixGrammar(text: string): Promise<GeminiResponse> {
    return this.executeAction('fix_grammar', text)
  },

  async tailorToJob(text: string, jobDescription: string): Promise<GeminiResponse> {
    return this.executeAction('tailor_to_job', text, { jobDescription })
  },

  async generateIntro(userBackground?: string, role?: string): Promise<GeminiResponse> {
    return this.executeAction('generate_intro', userBackground || '', { role })
  },
}

