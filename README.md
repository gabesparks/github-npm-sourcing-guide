# GitHub & NPM Sourcing Guide
### A recruiter's toolkit for finding and evaluating engineering talent where they actually work

---

Most engineers aren't active on LinkedIn — but they *are* shipping code every day. This guide gives you a CLI tool to pull top contributors from any public GitHub repo or NPM package, enrich their profiles with recruiter-relevant signals, and export the results to a spreadsheet. No third-party services, no subscriptions — just Node.js and a GitHub token.

---

## What It Does

Point it at any GitHub repo or NPM package and it returns a ranked table of top contributors with:

- Contribution count to that repo
- Follower count and public repo count
- Account age (a proxy for career seniority)
- Location and public email (if listed)
- Website and Twitter/X handle (if listed)
- Whether they've marked themselves as **hireable**
- A weighted **signal score** to help prioritize outreach

Optionally exports everything to a `.csv` for your ATS or spreadsheet.

---

## Before You Start

**Node.js v18+**
Download and install from [nodejs.org](https://nodejs.org).

**A GitHub Personal Access Token (classic)**
Generate one at [github.com/settings/tokens](https://github.com/settings/tokens)

> `Settings → Developer Settings → Personal access tokens → Tokens (classic) → Generate new token`

No special permissions needed — this tool only reads public data.

---

## Setup

```bash
# Clone or download this repo, then navigate into it
cd github-npm-sourcing-guide

# No npm install needed — sourcer.js uses only Node.js built-ins
```

---

## Usage

```bash
GH_TOKEN=<your_token> node sourcer.js <owner/repo or npm-package> [--top N] [--csv]
```

### Examples

```bash
# Top 10 contributors to a GitHub repo (default)
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express

# Top 20 contributors to an NPM package (auto-resolves to its GitHub repo)
GH_TOKEN=ghp_xxxx node sourcer.js lodash --top 20

# Scoped NPM package, export results to CSV
GH_TOKEN=ghp_xxxx node sourcer.js @remix-run/router --csv

# Both flags together
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --top 15 --csv
```

### Sample Output

```
──────────────────────────────────────────────────────────────────────────────────────────────────────
#    Username             Name                   PRs    Follow   Repos  Age      Location           Email                      Score
──────────────────────────────────────────────────────────────────────────────────────────────────────
1    tjholowaychuk        TJ Holowaychuk         368    24021    198    15.2y    Victoria, BC       tj@vision-media.ca         100
2    dougwilson           Douglas Wilson         312    1893     42     13.7y    —                  —                          62
3    jonchurch            Jon Church             187    234      18     8.1y     New York, NY       jon@example.com            54
──────────────────────────────────────────────────────────────────────────────────────────────────────

  Score = weighted signal (contributions, followers, repos, public email, hireable status)
  View full profiles at: https://github.com/<username>
```

---

## How the Signal Score Works

The score (0–100) is a weighted combination of recruiter-relevant signals. It's not a judgment of quality — it's a prioritization aid for outreach.

| Signal | Max Points | Why it matters |
|---|---|---|
| Contributions to this repo | 40 | Direct relevance to the codebase |
| Followers | 20 | Community recognition |
| Public repos | 15 | Breadth of work |
| Public email listed | 10 | Easy to reach |
| Marked as hireable | 10 | Self-signaled interest |
| Website linked | 5 | Professional presence |
| Twitter/X linked | 5 | Active in community |

---

## Browser Bookmarklet — Pull Request History

For quick one-off profile checks while browsing GitHub, this bookmarklet takes you straight to a user's full PR history. Save it to your bookmarks bar and click it on any GitHub profile page.

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
1. Right-click your bookmarks bar → **Add bookmark**
2. Name it `GitHub → PRs`
3. Paste the script above as the URL
4. Navigate to any GitHub profile and click it

> Shows all PRs — open, closed, and merged — giving a fuller picture than closed-only filters.

---

## Finding the Right Repos to Target

The tool is only as good as the repos you point it at. A few ways to find high-signal targets:

- **Ask your hiring team** — which libraries or tools does the engineering team use or respect?
- **Check strong candidates** — which repos do they contribute to? Those repos are magnets for similar talent.
- **GitHub topic search** — [github.com/topics/react](https://github.com/topics/react), `topic:nodejs`, `topic:web3`, etc.
- **Follow dependencies** — look at what your product depends on, then find who builds it

---

## Evaluating Profiles

Once you have your list, use these signals to prioritize:

**Activity & Consistency**
- Sustained contribution graph — years, not a recent burst
- Last commit or update within the past 3–6 months
- Original repos weighted over forks (forks only count if meaningfully extended)

**Quality Indicators**
- Stars received on personal repos — peer validation
- Contributions to well-known open-source projects
- Clean, well-documented READMEs — signals communication skills

**Collaboration Signals**
- Review their issue and PR participation:
  ```
  https://github.com/issues?q=is%3Aissue+author%3A<USERNAME>
  ```
- Constructive, clear comments indicate strong communication
- Code review activity shows they think beyond their own work

---

## Finding Contact Information

Beyond what the tool surfaces automatically:

- **Commit metadata** — author emails sometimes appear in commit history
- **NPM package pages** — authors occasionally list contact details
- **Cross-platform search** — `"username" site:linkedin.com` or `"handle" JavaScript engineer`

---

## Related Guides

- [GitHub Recruiting Playbook](../github-recruiting-playbook) — Structured methodology for targeting contributors in high-signal repos
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) — Finding and engaging technical talent on X

---

*No npm install required. No external dependencies. Just Node.js and a GitHub token.*
