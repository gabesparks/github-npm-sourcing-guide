# GitHub & NPM Sourcing Toolkit
### Find engineers where they actually hang out. Not where they pretend to.

---

LinkedIn is a highlight reel. GitHub is the game tape.

While everyone else is cold messaging "rockstar developers" on LinkedIn, you could be pulling real contribution data, commit history, and public emails from the platform engineers actually care about. This toolkit gives you two CLI tools that work together: one to find top contributors from any repo or NPM package, and one to deeply evaluate any profile before you reach out.

No subscriptions. No browser extensions. No begging an engineer to help you find engineers.

---

## The Tools

### `sourcer.js` - Find Top Contributors
Point it at any GitHub repo or NPM package and get a ranked, enriched list of top contributors in about 30 seconds. Bots automatically filtered out.

```bash
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express --top 15 --csv
```

### `profiler.js` - Deep Profile Evaluation
Take a shortlist from `sourcer.js` and run each username through a detailed five-category scorecard: profile completeness, activity, code quality, documentation, and collaboration depth.

```bash
GH_TOKEN=ghp_xxxx node profiler.js sindresorhus
```

### The Workflow

```
1. Find a high-signal repo (ask your hiring team or use GitHub topics)
2. Run sourcer.js to pull the top contributors
3. Review the signal scores and pick your top candidates
4. Run profiler.js on each one for a full evaluation
5. Reach out with a personalized message
```

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
This is how both tools authenticate with GitHub's API. It's free, takes 2 minutes, and one token works for everything.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token > Generate new token (classic)**
3. Give it a name like `sourcing-toolkit`
4. Leave all permission boxes unchecked. We only read public data.
5. Scroll down and click **Generate token**
6. **Copy it immediately.** GitHub will never show it again. Yes, really.

---

## Setup

```bash
# Clone this repo
git clone https://github.com/gabesparks/github-npm-sourcing-guide.git
cd github-npm-sourcing-guide

# No npm install needed. Both tools have zero external dependencies.
# (We know, we're just as surprised as you are.)
```

---

## sourcer.js

### Usage

```bash
GH_TOKEN=<your_token> node sourcer.js <owner/repo or npm-package> [--top N] [--csv]
```

### Examples

```bash
# Top 10 contributors to a GitHub repo (default)
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express

# Top 25 contributors
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --top 25

# NPM package - auto-resolves to its GitHub repo
GH_TOKEN=ghp_xxxx node sourcer.js lodash

# Scoped NPM package
GH_TOKEN=ghp_xxxx node sourcer.js @remix-run/router

# Export to CSV - opens in Excel or Google Sheets
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express --csv

# The whole shebang
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --top 20 --csv
```

### Sample Output

```
──────────────────────────────────────────────────────────────────────────────────────────────────────
#    Username             Name                   PRs    Follow   Repos  Age      Location           Email                      Score
──────────────────────────────────────────────────────────────────────────────────────────────────────
1    jsmith-dev           Jane Smith             3881   51671    296    17.6y    —                  —                          75
2    mikecoder99          Mike Tran              1232   3734     31     17.1y    —                  mike@example.com           85
3    a_builds             Alex Rivera             84    2391     60     15.2y    Austin, TX         alex@example.com           73
4    devcarlos            Carlos Mendes           70    987      308    17.0y    —                  —                          42
──────────────────────────────────────────────────────────────────────────────────────────────────────
```

Fake names, real format. Bots are automatically filtered out. *(Sorry, dependabot. It's not you, it's us.)*

The `--csv` flag saves a `contributors-<repo>.csv` file in your current folder. Great for dropping into your ATS or sharing with a hiring manager.

### How the Signal Score Works

Every contributor gets a score from 0 to 100. It's a prioritization tool, not a judgment.

| Signal | Points | Why it matters |
|---|---|---|
| Contributions to this repo | up to 40 | Active in *this* codebase, not just GitHub in general |
| Followers | up to 20 | Community recognition. Peers vote with follows. |
| Public repos | up to 15 | Breadth of work beyond their day job |
| Public email listed | 10 | Low-hanging fruit. Skip the guessing game. |
| Marked as hireable | 10 | They literally said they're open. Don't overthink it. |
| Website linked | 5 | Presence beyond GitHub |
| Twitter/X linked | 5 | Active in the community conversation |

High score = reach out first. Low score = still worth a look, just lower on the list.

---

## profiler.js

### Usage

```bash
GH_TOKEN=<your_token> node profiler.js <github-username> [--json]
```

### Examples

```bash
# Full recruiter scorecard
GH_TOKEN=ghp_xxxx node profiler.js sindresorhus

# Raw JSON output (useful for piping into other tools)
GH_TOKEN=ghp_xxxx node profiler.js sindresorhus --json
```

### What It Evaluates

`profiler.js` scores each profile across five categories:

**Profile Completeness (up to 100pts)**
Real name, photo, bio, location, public email, website, Twitter, hireable status. Tells you how easy this person is to contact and verify.

**Activity and Consistency (up to 100pts)**
Account age, public repo count, followers, days since last active, and variety of activity types. Consistent activity over years beats a recent burst every time.

**Code Quality Signals (up to 100pts)**
Total stars on original repos, language diversity, repo descriptions, topic tags, original vs. fork ratio, and recent maintenance. Tells you if they're building real things or just collecting forks.

**README and Documentation (up to 100pts)**
Evaluates top repos for descriptions, topics, homepage links, and community reception. A well-documented repo signals communication skills as much as technical ability.

**Collaboration Depth (up to 100pts)**
PR reviews, pull requests submitted, issue participation, contributions to external repos, and community standing. Shows whether they work well with others, not just alone.

### Sample Output

```
════════════════════════════════════════════════════════════
  GitHub Profile Report: @sindresorhus
  Sindre Sorhus
  "Full-Time Open-Sourcerer. Focused on Swift and JavaScript."
════════════════════════════════════════════════════════════

  Profile Completeness
  ████████████████░░░░ 80/100 (B)
  Well-rounded profile. Easy to contact and verify.

  ✅  Real name listed
  ✅  Custom profile photo
  ✅  Bio filled in
  ❌  Location listed
  ✅  Public email listed (sindresorhus@gmail.com)
  ✅  Website or portfolio linked (https://sindresorhus.com/apps)
  ✅  Twitter/X linked (@sindresorhus)
  ❌  Marked as hireable

  ...

════════════════════════════════════════════════════════════
  OVERALL SCORECARD
  ████████████████░░░░ 80/100 (B)

  Verdict: Strong candidate. Prioritize outreach.

  Profile: https://github.com/sindresorhus
  Email:   sindresorhus@gmail.com
  Website: https://sindresorhus.com/apps
  Twitter: @sindresorhus
════════════════════════════════════════════════════════════
```

### Grading Scale

| Grade | Score | What it means |
|---|---|---|
| A | 85-100 | Exceptional public presence. Strong signal across the board. |
| B | 65-84 | Solid profile. Worth a conversation. |
| C | 50-64 | Mixed signals. Dig deeper before reaching out. |
| D | 35-49 | Thin public profile. May be stronger than GitHub suggests. |
| F | 0-34 | Limited signal. Consider other sourcing channels. |

---

## The Bookmarklet: For Quick PR Checks

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
1. Right-click your bookmarks bar and select **Add bookmark**
2. Name it something like `Their PRs`
3. Paste the script above as the URL
4. Go to any GitHub profile and click it

Shows all PRs: open, closed, and merged. Because closed PRs still tell a story.

---

## Finding the Right Repos to Target

Both tools are only as useful as the repos you point them at. A few ways to find good ones:

**Ask your hiring team.** During intake, ask: *"Which libraries or tools does your team use or respect?"* Those repos attract exactly the kind of people you're looking for.

**Check strong candidates you've already found.** See which repos they contribute to, then run `sourcer.js` against those. You'll find their neighbors.

**Use GitHub topic search.** Try [github.com/topics/nodejs](https://github.com/topics/nodejs), `topic:react`, `topic:web3`, `topic:kubernetes`. Filter by most stars or most forks.

**Follow the dependency trail.** Look at what your product actually depends on, then find who builds and maintains it.

---

## Troubleshooting

**`401 Unauthorized`** Your token is wrong or expired. Generate a new one.

**`403 Forbidden`** You've hit GitHub's rate limit (5,000 requests/hour on authenticated calls). Wait an hour and try again.

**`404 Not Found`** Double-check the username or repo name. Both are case-sensitive.

**NPM package not resolving.** Some packages don't link a GitHub repo in their manifest. Pass the GitHub repo directly instead: `owner/repo`.

**Output looks misaligned.** The table is formatted for a standard terminal width. Try making your terminal window wider.

---

## Related Guides

- [GitHub Sourcing Playbook](https://github.com/gabesparks/github-sourcing-playbook) - The step-by-step methodology that pairs with these tools
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) - Finding technical talent where they talk about what they're building

---

*Built for recruiters who want to source like engineers think: systematically, signal-first, and without begging anyone for a LinkedIn InMail credit.*
