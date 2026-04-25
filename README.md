# GitHub & NPM Sourcing Guide
### A recruiter's toolkit for finding and evaluating engineering talent where they actually work

---

Most engineers aren't on LinkedIn — or if they are, they're not active. But they *are* shipping code every day. This guide walks through how to source directly from GitHub and NPM using a handful of lightweight tools, so you can find candidates based on what they've actually built, not just what they've written on a resume.

---

## Before You Start

You'll need three things:

**Node.js**
Download and install from [nodejs.org](https://nodejs.org). This is what lets you run the CLI commands in this guide.

**A GitHub Account**
Sign up at [github.com](https://github.com) if you don't have one.

**A GitHub Personal Access Token**
This authenticates your CLI requests. Generate one at:
[github.com/settings/tokens](https://github.com/settings/tokens)

> `Settings → Developer Settings → Personal access tokens → Tokens (classic) → Generate new token`

You don't need to grant any special permissions — this guide only reads public data.

---

## Part 1 — Browser Bookmarklets

Bookmarklets are small scripts saved as browser bookmarks. Click them while browsing a GitHub profile to instantly surface useful information.

### Pull Request History

This bookmarklet takes you directly to a user's full pull request history. It's one of the fastest ways to assess how someone contributes to a codebase — not just what they've built alone, but how they collaborate.

```javascript
javascript:(function() {
  const match = window.location.href.match(/github\.com\/([^/?#]+)/);
  const username = match?.[1];
  const excluded = ['search', 'pulls', 'issues', 'explore', 'topics'];

  if (username && !excluded.includes(username)) {
    window.location.href = `https://github.com/pulls?q=is%3Apr+author%3A${encodeURIComponent(username)}+archived%3Afalse`;
  } else {
    alert('No GitHub username detected on this page.');
  }
})();
```

**To install:**
1. Right-click your browser bookmarks bar → **Add bookmark** (or paste directly)
2. Set the name to something like `GitHub → PRs`
3. Paste the full script above as the URL
4. Navigate to any GitHub profile and click it

> **What changed:** Removed the `is:closed` filter so you see *all* PRs — open, closed, and merged — giving a fuller picture of someone's contribution history. Also added a more robust exclusion list to avoid false matches on GitHub nav pages.

---

## Part 2 — CLI Tools

These commands run in your terminal and return structured data about GitHub profiles and repositories.

### Profile Analysis

Pulls a detailed contribution summary for any public GitHub user:

```bash
GH_TOKEN=<your_token> npx github-stats-cli <username>
```

**Sample output:**

```json
{
  "followers": 214,
  "accountAge": "2009-05-13",
  "starsReceived": 630,
  "privateContributions": 341,
  "totalCommits": 22252,
  "pullRequests": 4690,
  "codeReviews": 9345,
  "issuesOpened": 1171,
  "totalContributions": 37458
}
```

**Reading the output:**

| Field | What it signals |
|---|---|
| `starsReceived` | Community recognition — others found their work valuable |
| `codeReviews` | Collaboration depth, not just solo output |
| `privateContributions` | Active in professional/private repos — likely currently employed |
| `accountAge` + `totalCommits` | Career trajectory and sustained engagement over time |
| `pullRequests` | How much they contribute to others' codebases |

---

### Contributor Discovery by Repo or Package

Surfaces the top contributors to any GitHub repository or NPM package. Useful for building a targeted pipeline around a specific tech stack or library.

```bash
GH_TOKEN=<your_token> npx github-package-contributors <repo-or-package>,<repo-or-package>
```

**Example — targeting contributors to two Node.js packages:**

```bash
GH_TOKEN=<your_token> npx github-package-contributors @remix-run/router,expressjs/express
```

**Sample output:**

```json
[
  {
    "githubLink": "https://github.com/mjackson",
    "contributions": 312,
    "email": "michael@example.com",
    "repo": "remix-run/router",
    "packageName": "@remix-run/router"
  }
]
```

> 💡 **Sourcing tip:** Ask your hiring manager which libraries or tools their team uses or respects. Run this command against those repos and you'll have a warm, pre-qualified list of candidates in minutes — people who are already doing the work.

---

## Part 3 — Profile Evaluation

Once you've found someone, use this framework to decide whether they're worth reaching out to. You don't need every box checked — look for a strong signal overall.

### Technical Fit
- Core languages match the role (JavaScript, TypeScript, Node.js, Python, etc.)
- Repos reflect real problem-solving, not just tutorial projects
- Specialization signals present where relevant (Web3, infrastructure, APIs, mobile)

### Activity & Consistency
- Contribution graph shows sustained activity — look for months or years, not a recent burst
- Last commit or repo update within the past 3–6 months
- Mix of original repos and meaningful forks (forks only count if they've actually been extended)

### Quality Indicators
- Stars on personal repos — community validation
- Contributions to respected open-source projects
- Clean documentation — a well-written README signals communication skills as much as technical ones

### Collaboration Signals
Review their issues and PR participation:
```
https://github.com/issues?q=is%3Aissue+author%3A<USERNAME>
```
- Are their comments constructive and clear?
- Do they follow up on feedback?
- Do others engage positively with their contributions?

---

## Part 4 — Finding Contact Information

GitHub profiles often contain more than just code. Here's where to look:

- **Profile bio and links** — personal sites, LinkedIn, X/Twitter
- **Commit metadata** — author emails sometimes surface in commit history
- **NPM package pages** — authors occasionally list contact details
- **Cross-platform search** — try `"username" site:linkedin.com` or `"handle" JavaScript engineer`

---

## Things Worth Knowing

**Start with the repo, not the person.**
Identify a high-signal repository first, then surface its top contributors. You'll find candidates you'd never reach through keyword searches alone.

**Forks reveal intent.**
What someone has forked tells you what they're learning or planning to build. It's a window into their interests beyond their current job.

**Stars are peer validation.**
A developer with hundreds of stars on a personal project has earned credibility from the community — that means more than any self-reported skill.

**Read the issues tab.**
How someone responds to bug reports and feature requests says a lot about their communication style, patience, and professionalism. It's often more telling than the code itself.

**Check the README before anything else.**
A well-structured README is a proxy for how someone thinks and communicates. If they can explain their own project clearly, they can probably explain their work to a team.

---

## Related Guides

- [GitHub Recruiting Playbook](../github-recruiting-playbook) — Structured methodology for targeting top contributors in high-signal repositories
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) — Finding and engaging technical talent in crypto and Web3 communities

---

*These guides are maintained as living documents. If something's out of date or you've found a better approach, contributions are welcome.*
