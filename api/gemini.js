// Vercel Serverless Function: /api/gemini
// Provides trusted, server-side Google Gemini AI career assistant capabilities
// without exposing the GEMINI_API_KEY to client bundles.

function buildPrompt(action, text, context) {
  const safeText = (text || '').trim()
  const role = (context && context.role) || ''
  const company = (context && context.company) || ''
  const technologies = Array.isArray(context && context.technologies) ? context.technologies.join(', ') : ''
  const jobDescription = (context && context.jobDescription) || ''

  switch (action) {
    case 'improve_summary':
      return `You are an elite career strategist and ATS resume architect.
Task: Improve the following professional summary for a ${role || 'technology professional'}.
Requirements:
1. Make it concise (3-4 sentences), highly professional, and ATS-optimized.
2. Use active voice and highlight technical problem-solving capabilities.
3. NEVER fabricate false degrees, past employers, or fake revenue/metric numbers. If user didn't mention a metric, focus on qualitative engineering excellence.
4. Return ONLY the improved summary text, without preamble or quotes.

Candidate's current draft:
"""${safeText}"""`

    case 'enhance_bullet':
      return `You are an expert technical resume writer.
Task: Rewrite the following work experience bullet point for ${company ? `a role at ${company}` : 'a professional role'}.
Requirements:
1. Start with a decisive past-tense action verb (e.g. Engineered, Architected, Spearheaded, Accelerated, Optimized).
2. Frame as: Action + Technical Context + Concrete Result.
3. Keep it to a single strong, punchy bullet point.
4. STRICT TRUTH-TELLING: Do NOT fabricate unmentioned statistics, percentages, or achievements. If metrics are missing, highlight engineering rigor without hallucinating numbers.
5. Return ONLY the polished bullet text, without quotation marks or bullet symbols.

Candidate's bullet point:
"""${safeText}"""`

    case 'improve_project':
      return `You are a senior engineering mentor reviewing portfolio projects.
Task: Polish this project description for ${technologies ? `technologies: ${technologies}` : 'a developer showcase'}.
Requirements:
1. Highlight the problem solved, architectural approach, and key capabilities in 2-3 compelling sentences.
2. Ensure technical credibility without buzzword fluff.
3. DO NOT invent false metrics or claims.
4. Return ONLY the polished project description.

Current project description:
"""${safeText}"""`

    case 'suggest_skills':
      return `You are a technical skills taxonomy extractor.
Task: Analyze this project/experience text and suggest up to 8 relevant, high-demand skills/tools that are directly utilized or strongly implied.
Requirements:
1. Only return realistic technical skills and modern tooling (languages, frameworks, databases, developer tools).
2. Return ONLY a valid JSON array of strings, e.g. ["TypeScript", "React", "PostgreSQL", "Docker"]. Do not return markdown fences.

Context text:
"""${safeText}"""`

    case 'fix_grammar':
      return `You are an authoritative career editor.
Task: Fix grammar, punctuation, phrasing, and awkward phrasing in this professional resume/portfolio text.
Requirements:
1. Maintain the author's original voice, meaning, and factual claims 100%.
2. Improve rhythm, professional tone, and grammatical precision.
3. Return ONLY the corrected text.

Text:
"""${safeText}"""`

    case 'tailor_to_job':
      return `You are a hiring manager optimizing candidates for a target role.
Task: Refine the candidate's draft text to align naturally with the following target job description.
Target Job Description:
"""${jobDescription.slice(0, 1500)}"""

Candidate text to tailor:
"""${safeText}"""

Requirements:
1. Naturally weave in relevant domain keywords and phrasing from the job description where the candidate's work actually supports it.
2. DO NOT fabricate skills or experiences the candidate does not have.
3. Return ONLY the tailored text.`

    case 'generate_intro':
      return `You are a personal branding architect for engineers and designers.
Task: Create an authentic, memorable 2-3 sentence portfolio bio / intro for ${role || 'a digital craftsman'}.
Candidate context:
${safeText}
${technologies ? `Core strengths: ${technologies}` : ''}

Requirements:
1. Confident, modern, and engaging without cliché self-praise ("rockstar", "ninja").
2. Focus on craftsmanship, engineering curiosity, and delivering real value.
3. Return ONLY the bio text.`

    default:
      return safeText
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, text = '', context = {} } = req.body || {}

    if (!action) {
      return res.status(400).json({ error: 'Missing required field: action' })
    }

    if (!text && action !== 'generate_intro') {
      return res.status(400).json({ error: 'Please enter text to assist with' })
    }

    let apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const envCandidates = [
          path.resolve(process.cwd(), '.env'),
          path.resolve(process.cwd(), 'kaizenq-identity', '.env'),
          path.resolve(process.cwd(), '..', '.env'),
        ]
        for (const envPath of envCandidates) {
          if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n')
            for (const line of lines) {
              const m = line.match(/^([^=]+)=(.*)$/)
              if (m) {
                const k = m[1].trim()
                const v = m[2].trim()
                if (k === 'GEMINI_API_KEY' && !apiKey) apiKey = v
              }
            }
          }
        }
      } catch {
        // Fall through
      }
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.',
      })
    }

    const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
    const candidateModels = Array.from(new Set([preferredModel, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3-flash-preview']))
    const prompt = buildPrompt(action, text, context)

    let lastError = null
    let rawOutput = ''

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const geminiPayload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: action === 'suggest_skills' ? 0.2 : 0.4,
            maxOutputTokens: 800,
          },
        }

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        })

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '')
          lastError = `Model ${model} returned ${resp.status}: ${errText}`
          continue
        }

        const geminiData = await resp.json()
        rawOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

        if (rawOutput) {
          break
        }
      } catch (err) {
        lastError = err.message
      }
    }

    if (!rawOutput) {
      return res.status(502).json({
        error: 'Gemini service is temporarily unavailable. Please try again shortly.',
        details: lastError,
      })
    }

    if (action === 'suggest_skills') {
      let parsedSkills = []
      try {
        const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim()
        parsedSkills = JSON.parse(cleaned)
      } catch {
        parsedSkills = rawOutput
          .split(/[\n,]/)
          .map((s) => s.replace(/^[-*•0-9.)\s]+/, '').trim())
          .filter(Boolean)
      }

      return res.status(200).json({
        success: true,
        action,
        skills: parsedSkills,
      })
    }

    return res.status(200).json({
      success: true,
      action,
      result: rawOutput,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
