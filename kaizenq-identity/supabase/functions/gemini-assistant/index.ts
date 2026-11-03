// @ts-nocheck
// Supabase Edge Function: gemini-assistant
// Provides trusted, server-side Gemini AI career assistant capabilities
// without ever exposing the GEMINI_API_KEY to client bundles.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPPORTED_ACTIONS = [
  'improve_summary',
  'enhance_bullet',
  'improve_project',
  'suggest_skills',
  'fix_grammar',
  'tailor_to_job',
  'generate_intro',
]

function buildPrompt(action: string, text: string, context?: Record<string, unknown>): string {
  const safeText = (text || '').trim()
  const role = (context?.role as string) || ''
  const company = (context?.company as string) || ''
  const technologies = Array.isArray(context?.technologies) ? context.technologies.join(', ') : ''
  const jobDescription = (context?.jobDescription as string) || ''

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { action, text = '', context = {} } = body

    if (!SUPPORTED_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported action: "${action}". Supported: ${SUPPORTED_ACTIONS.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    // Safety: limit payload length to prevent abusive token consumption
    if (typeof text === 'string' && text.length > 8000) {
      return new Response(
        JSON.stringify({ error: 'Text input exceeds maximum limit of 8,000 characters.' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API key is not configured on this server. Please set GEMINI_API_KEY in your Supabase Vault or edge environment.',
          isConfigured: false,
        }),
        {
          status: 503,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    const prompt = buildPrompt(action, text, context)

    // Call Google Gemini API (gemini-2.5-flash or gemini-1.5-flash)
    const model = 'gemini-2.5-flash'
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
      console.error(`Gemini API returned ${resp.status}:`, errText)
      return new Response(
        JSON.stringify({
          error: `Gemini API service returned status ${resp.status}. Please check your quota or configuration.`,
          details: errText,
        }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    const geminiData = await resp.json()
    const rawOutput =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    if (!rawOutput) {
      return new Response(
        JSON.stringify({ error: 'Gemini produced an empty response.' }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    // Special parsing for skills suggestions
    if (action === 'suggest_skills') {
      let parsedSkills: string[] = []
      try {
        const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim()
        parsedSkills = JSON.parse(cleaned)
      } catch {
        parsedSkills = rawOutput
          .split(/[\n,]/)
          .map((s: string) => s.replace(/^[-*•0-9.)\s]+/, '').trim())
          .filter(Boolean)
      }

      return new Response(
        JSON.stringify({
          success: true,
          action,
          skills: parsedSkills,
          model,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        suggestedText: rawOutput,
        model,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: unknown) {
    console.error('Gemini Edge Function uncaught error:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal Server Error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    )
  }
})

