# GitHub & NPM Sourcing Guide
### Find engineers where they actually hang out - not where they pretend to.

---

LinkedIn is a highlight reel. GitHub is the game tape.

While everyone else is cold messaging "rockstar developers" on LinkedIn, you could be pulling real contribution data, commit history, and public emails from the platform engineers actually care about. This guide gives you a CLI tool that does exactly that — point it at any GitHub repo or NPM package and get a ranked list of top contributors, enriched with recruiter-relevant signals, in about 30 seconds.

No subscriptions. No browser extensions. No begging a engineer to help you find engineers.

---

## What It Does

```bash
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express
```

That's it. One command and you get this:

```
──────────────────────────────────────────────────────────────────────────────────────────────────────
#    Username             Name                   PRs    Follow   Repos  Age      Location           Email                      Score
──────────────────────────────────────────────────────────────────────────────────────────────────────
1    tjholowaychuk        TJ Holowaychuk         3881   51671    296    17.6y    —                  —                          75
2    dougwilson           Douglas Wilson         1232   3734     31     17.1y    —                  doug@somethingdoug.com     85
3    jonathanong          jongleberry             84    2391     60     15.2y    Orange County, CA  me@jongleberry.com         73
4    defunctzombie        Roman Shtylman          70    987      308    17.0y    —                  —                          42
──────────────────────────────────────────────────────────────────────────────────────────────────────
```

Real people. Real signals. Bots automatically filtered out. *(Sorry, dependabot. It's not you, it's us.)*

---

## Before You Start

You need two things. That's it.

**1. Node.js v18+**
If you don't have it: [nodejs.org](https://nodejs.org). Download, install, done.

Not sure if you have it? Run this in your terminal:
```bash
node --version
```
If it prints a number, you're good. If it says "command not found", go install it.

**2. A GitHub Personal Access Token**
This is how the tool authenticates with GitHub's API. It's free, takes 2 minutes, and you only have to do it once.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name like `sourcer-tool`
4. Leave all permission boxes unchecked — we only read public data
5. Scroll down and click **Generate token**
6. **Copy it immediately.** GitHub will never show it again. Yes, really.

---

## Setup

```bash
# Clone this repo
git clone https://github.com/yourusername/github-npm-sourcing-guide.git
cd github-npm-sourcing-guide

# No npm install needed — sourcer.js has zero external dependencies
# (we know, we're just as surprised as you are)
```

---

## Usage

```bash
GH_TOKEN=<your_token> node sourcer.js <owner/repo or npm-package> [--top N] [--csv]
```

### Examples

```bash
# Basic — top 10 contributors to a repo
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express

# Go deeper — top 25 contributors
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --top 25

# NPM package — auto-resolves to its GitHub repo
GH_TOKEN=ghp_xxxx node sourcer.js lodash

# Scoped NPM package
GH_TOKEN=ghp_xxxx node sourcer.js @remix-run/router

# Export to CSV — opens in Excel or Google Sheets
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express --csv

# The whole shebang
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --top 20 --csv
```

The `--csv` flag saves a `contributors-<repo>.csv` file right in your current folder. Great for dropping into your ATS, sharing with a hiring manager, or just feeling organized.

---

## How the Signal Score Works

Every contributor gets a score from 0–100 based on recruiter-relevant signals. It's not a judgment of their worth as a human being — it's just a prioritization tool so you know who to reach out to first.

| Signal | Points | Why it matters |
|---|---|---|
| Contributions to this repo | up to 40 | They're not just on GitHub — they're active in *this* codebase |
| Followers | up to 20 | Community recognition. Peers vote with follows. |
| Public repos | up to 15 | Breadth of work beyond their day job |
| Public email listed | 10 | Low-hanging fruit — skip the guessing game |
| Marked as hireable | 10 | They literally said they're open. Don't overthink it. |
| Website linked | 5 | They have a presence beyond GitHub |
| Twitter/X linked | 5 | Active in the community conversation |

High score = reach out first. Low score = still worth a look, just lower on the list.

---

## The Bookmarklet — For Quick Profile Checks

Sometimes you just want to peek at someone's PR history without running a command. Drop this into your bookmarks bar and click it on any GitHub profile:

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
2. Name it something like `→ Their PRs`
3. Paste the script above as the URL
4. Go to any GitHub profile and click it

Shows all PRs — open, closed, and merged. Because closed PRs still tell a story.

---

## Finding the Right Repos to Target

The tool is only as useful as the repos you point it at. A few ways to find good ones:

**Ask your hiring team.** During intake, ask: *"Which libraries or tools does your team use or respect?"* Those repos are magnets for exactly the kind of people you're looking for.

**Check strong candidates you've already found.** See which repos they contribute to, then run the tool against those. You'll find their neighbors.

**Use GitHub topic search.** Try [github.com/topics/nodejs](https://github.com/topics/nodejs), `topic:react`, `topic:web3`, `topic:kubernetes`. Filter by most stars or most forks.

**Follow the dependency trail.** Look at what your product actually depends on, then find who builds and maintains it.

---

## Reading a Profile Like a Recruiter

Once you have your list, here's what to actually look at:

**The contribution graph** — Steady green for years > a massive spike last month. Consistency is a career signal.

**Original repos vs. forks** — Forks only count if they've been meaningfully extended. Anyone can fork a repo and do nothing with it.

**The README** — Seriously, read it. A well-written README is a proxy for how someone communicates. If they can explain their own project clearly, they can probably explain their work in a standup.

**The issues tab** — How someone handles bug reports and feature requests from strangers on the internet is incredibly revealing. Look for patience, clarity, and follow-through.

**Stars received** — Community validation that no resume bullet point can replicate.

---

## Finding Contact Info

Beyond what the tool already surfaces:

- **Commit metadata** — author emails sometimes appear in commit history
- **NPM package pages** — package authors occasionally list contact info
- **Cross-platform** — try `"username" site:linkedin.com` or `"handle" TypeScript developer`
- **Their own website** — if they listed one, start there

---

## Troubleshooting

**`401 Unauthorized`** — Your token is wrong or expired. Generate a new one.

**`403 Forbidden`** — You've hit GitHub's rate limit (5,000 requests/hour on authenticated calls — you'd have to really go for it). Wait an hour and try again.

**`404 Not Found`** — Double-check the repo name. It's case-sensitive. `Expressjs/Express` won't work, `expressjs/express` will.

**NPM package not resolving** — Some packages don't link a GitHub repo in their manifest. Pass the GitHub repo directly instead: `owner/repo`.

**Output looks misaligned** — The table is formatted for a standard terminal width. Try making your terminal window wider.

---

## Related Guides

- [GitHub Recruiting Playbook](../github-recruiting-playbook) — A structured methodology for identifying and evaluating top contributors in high-signal repos
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) — Finding crypto-native and technical talent where they actually talk about what they're building

---

*Built for recruiters who want to source like engineers think — systematically, signal-first, and without begging anyone for a LinkedIn InMail credit.*
