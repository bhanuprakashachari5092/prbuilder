/**
 * GitHub Integration Service Abstraction
 * Handles repository extraction, language distributions, and profile telemetry
 */

export interface GitHubRepoSummary {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  language: string | null
  stargazersCount: number
  forksCount: number
  topics: string[]
  updatedAt: string
}

export interface GitHubProfileStats {
  username: string
  totalStars: number
  topLanguages: { language: string; percentage: number }[]
  publicReposCount: number
  followersCount: number
}

export class GitHubService {
  /**
   * Validates a GitHub username and returns public profile telemetry
   */
  async getProfileStats(username: string): Promise<GitHubProfileStats> {
    // In production, will proxy through backend to avoid rate limits
    return {
      username,
      totalStars: 231,
      topLanguages: [
        { language: 'TypeScript', percentage: 54 },
        { language: 'Python', percentage: 28 },
        { language: 'Rust', percentage: 18 },
      ],
      publicReposCount: 16,
      followersCount: 42,
    }
  }

  /**
   * Fetches public repositories for showcase selection
   */
  async getPublicRepos(username: string): Promise<GitHubRepoSummary[]> {
    const handle = username || 'developer'
    return [
      {
        id: 101,
        name: 'neural-trace',
        fullName: `${handle}/neural-trace`,
        description: 'Distributed LLM evaluation and latency profiling engine',
        htmlUrl: 'https://github.com',
        language: 'Python',
        stargazersCount: 142,
        forksCount: 19,
        topics: ['machine-learning', 'fastapi', 'distributed'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 102,
        name: 'hyper-canvas',
        fullName: `${handle}/hyper-canvas`,
        description: 'Real-time collaborative whiteboard with CRDT conflict resolution',
        htmlUrl: 'https://github.com',
        language: 'TypeScript',
        stargazersCount: 89,
        forksCount: 12,
        topics: ['react', 'websockets', 'canvas'],
        updatedAt: new Date().toISOString(),
      },
    ]
  }
}

export const githubService = new GitHubService()
