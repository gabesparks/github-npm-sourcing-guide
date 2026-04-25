# 🔍 GitHub & NPM Sourcing Guide

> **A practical toolkit for technical recruiters to identify, evaluate, and engage top engineering talent directly from GitHub and NPM.**

---

## Overview

GitHub and NPM are living portfolios — engineers ship code, contribute to open source, and leave behind a rich signal trail. This guide covers how to tap into that signal using lightweight CLI tools, browser bookmarklets, and a repeatable evaluation framework.

No LinkedIn required.

---

## Prerequisites

Before getting started, make sure you have the following:

- [ ] **Node.js** installed → [nodejs.org](https://nodejs.org)
- [ ] A **GitHub account** → [github.com](https://github.com)
- [ ] A **GitHub Personal Access Token** (classic) with no special permissions needed — public data only

  Generate one here: [github.com/settings/tokens](https://github.com/settings/tokens)  
  `Settings → Developer Settings → Personal access tokens → Generate new token (classic)`

---

## Quickstart

### 1. View a User's Pull Requests Instantly

Add the following as a **bookmarklet** in your browser's bookmarks bar. Navigate to any GitHub profile, then click the bookmark to instantly see everything that user has submitted as a pull request.

```javascript
javascript:(function() {
  const url = window.location.href;
  const match = url.match(/github\.com\/([^/]+)/);
  const username = match?.[1];
  if (username && !['search', 'pulls', 'issues'].includes(username)) {
    window.location.href = `https://github.com/pulls?q=is%3Apr+author%3A${encodeURIComponent(username)}+archived%3Afalse+is%3Aclosed`;
  } else {
    alert('GitHub username not found in URL');
  }
})();
```

**How to install:**
1. Right-click your bookmarks bar → **Add page** or **Paste**
2. Name it something like `→ User's PRs`
3. Paste the script above as the URL
4. Navigate to any GitHub profile and click the bookmark

---

### 2. Grade a GitHub Profile

Found someone interesting? Run this command in your terminal to pull a full contribution snapshot:

```bash
GH_TOKEN=<your_github_token> npx @exodus/github-stats <username>
```

**Example output:**

```json
{
  "followers": 214,
  "createdAt": "2009-05-13T03:43:19Z",
  "starsReceived": 630,
  "restrictedContributionsCount": 341,
  "totalCommitContributions": 22252,
  "totalPullRequestContributions": 4690,
  "totalPullRequestReviewContributions": 9345,
  "totalIssueContributions": 1171,
  "contributionsCount": 37458
}
```

**What to look for:**
| Signal | What it means |
|---|---|
| High `starsReceived` | Their work is respected by the community |
| High `totalPullRequestReviewContributions` | They collaborate, not just ship |
| Long `createdAt` with steady commits | Career engineer, not a bootcamp grad |
| High `restrictedContributionsCount` | Active in private repos — likely employed and productive |

---

### 3. Find Top Contributors to Any Repo or NPM Package

Want to know who built a library you rely on — or who's most active in a repo aligned to your tech stack?

```bash
GH_TOKEN=<your_github_token> npx @exodus/github-package-contributors <package-or-repo>,<package-or-repo>
```

**Example:**

```bash
GH_TOKEN=abc123 npx @exodus/github-package-contributors @mixer/parallel-prettier,nodejs-mobile/nodejs-mobile-react-native
```

**Example output:**

```json
[
  {
    "githubLink": "https://github.com/connor4312",
    "contributions": 15,
    "email": "connor@peet.io",
    "repo": "mixer/parallel-prettier",
    "packageName": "@mixer/parallel-prettier"
  }
]
```

> 💡 **Pro tip:** Run this against repos that mirror your team's tech stack. If you're hiring Node.js engineers, target contributors to popular Node.js tooling packages — these are active practitioners, not just profile fillers.

---

## Evaluation Framework

Use this rubric when reviewing a GitHub profile. Strong candidates won't check every box — use it to build a holistic picture.

### ✅ Technical Alignment
- Languages match the role (JavaScript, TypeScript, Node.js, React, etc.)
- Repos reflect real-world problem solving, not just tutorial clones
- Role-specific signals present (blockchain repos, API design, infrastructure tooling)

### ✅ Contributions & Activity
- **Contribution graph** — consistent activity over months or years
- **Recent commits** — active in the last 3–6 months
- **Original repos vs. forks** — prioritize original work; forks only count if meaningfully extended

### ✅ Quality & Recognition
- Stars received on authored repos
- Healthy followers-to-following ratio
- Contributions to well-known open-source projects
- Clean READMEs and organized repo structure — this signals communication skills

### ✅ Collaboration Signals
- Thoughtful issue and PR participation → `github.com/issues?q=is%3Aissue+author%3AUSERNAME`
- Constructive code review history
- Clear, descriptive commit messages

---

## Finding Contact Info

GitHub profiles often contain more than you'd expect:

- **Profile links** — check for personal sites, LinkedIn, or X/Twitter
- **Commit metadata** — emails sometimes appear in commit history
- **NPM registry** — package authors often list contact info
- **Search combo** — `"username" site:linkedin.com` or `"username" JavaScript developer`

---

## Tips

- **Start with the repo, not the person.** Find a high-signal repo first, then identify its top contributors. You'll surface candidates you'd never find through keyword search.
- **Forks tell a story.** Check what someone has forked — it reveals what they're learning or building toward.
- **Stars are social proof.** A developer with 500+ stars on a personal project has community validation that no resume can replicate.
- **Check the issues tab.** How someone handles bug reports and feature requests reveals a lot about communication style and professionalism.

---

## Related Guides

- [GitHub Recruiting Playbook](../github-recruiting-playbook) — Targeting top contributors in high-signal repos
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) — Finding crypto-native and technical developers on X

---

*Built for technical recruiting teams who want to source smarter, not harder.*
