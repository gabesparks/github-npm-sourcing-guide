# GitHub & NPM Sourcing Toolkit
### Find engineers where they actually hang out. Not where they pretend to.

---

LinkedIn is a highlight reel. GitHub is the game tape.

This toolkit gives you four CLI tools that work individually or together as a full sourcing pipeline. Find high-signal repos, pull top contributors, deep-evaluate profiles, and generate a ranked outreach shortlist. All from your terminal.

No subscriptions. No browser extensions. No begging an engineer to help you find engineers.

---

## The Tools

| Tool | What it does |
|---|---|
| `repofinder.js` | Find high-signal GitHub repos by tech stack |
| `sourcer.js` | Pull top contributors from any repo or NPM package |
| `profiler.js` | Deep-evaluate a specific GitHub profile |
| `recruit.js` | Full pipeline. Runs all three tools in one command. |

### When to use which

**Use `recruit.js`** when you're starting from scratch and want a ready-to-use outreach shortlist from a single command.

**Use the individual tools** when you already know the repo, the username, or just want one piece of the pipeline.

---

## Before You Start

**Node.js v18+**
Download and install from [nodejs.org](https://nodejs.org). Check if you have it:
```bash
node --version
```

**A GitHub Personal Access Token**
One token works for all four tools.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token > Generate new token (classic)**
3. Name it `sourcing-toolkit`
4. Leave all permissions unchecked. We only read public data.
5. Click **Generate token** and copy it immediately. GitHub won't show it again.

---

## Setup

```bash
# Clone this repo
git clone https://github.com/gabesparks/github-npm-sourcing-guide.git
cd github-npm-sourcing-guide

# No npm install needed. All four tools have zero external dependencies.
```

---

## recruit.js: Full Pipeline

The flagship tool. Give it a tech stack and it finds repos, pulls contributors, evaluates profiles, and outputs a ranked shortlist ready for outreach.

### Usage

```bash
GH_TOKEN=<token> node recruit.js --stack <tech,tech> [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--stack` | required | Tech stack to search. e.g. `react,nodejs,typescript` |
| `--top-repos` | 3 | Number of repos to source from |
| `--top-contributors` | 10 | Contributors to pull per repo |
| `--min-stars` | 500 | Minimum stars for target repos |
| `--skip-profile` | off | Skip deep profile evaluation for speed |
| `--csv` | off | Export results to a CSV file |

### Examples

```bash
# Standard run - finds repos, pulls contributors, evaluates profiles
GH_TOKEN=ghp_xxxx node recruit.js --stack react,nodejs

# Wider net - 5 repos, 15 contributors each
GH_TOKEN=ghp_xxxx node recruit.js --stack typescript,react --top-repos 5 --top-contributors 15

# Web3 / crypto hiring
GH_TOKEN=ghp_xxxx node recruit.js --stack solidity,ethereum,web3 --top-repos 3

# Fast mode - skips deep profiling, just sourcer signals
GH_TOKEN=ghp_xxxx node recruit.js --stack python,django --skip-profile

# Export to CSV for your ATS
GH_TOKEN=ghp_xxxx node recruit.js --stack nodejs,typescript --csv
```

### Sample Output

```
====================================================================================================
  OUTREACH SHORTLIST
  Stack: react, nodejs  |  Sourced from: freeCodeCamp/freeCodeCamp, vercel/next.js
====================================================================================================

#    Username             Name                 Score    Grade   Email                       Repos  Links
----------------------------------------------------------------------------------------------------
1    ijjk                 JJ Kasper            87/100   A       jj@jjsweb.site              1      jjsweb.site | @_ijjk
2    raisedadead          Mrugesh Mohapatra    80/100   B                                   1      mrugesh.dev | @raisedadead
3    huozhi               Jiachi Liu           76/100   B                                   1      huozhi.im | @huozhi
----------------------------------------------------------------------------------------------------

  TOP PICKS

  1. @ijjk (JJ Kasper) — 87/100 (A)
     Email:    jj@jjsweb.site
     Website:  https://jjsweb.site
     Twitter:  @_ijjk
     Location: San Francisco, CA
     Profile:  https://github.com/ijjk
     Active in: vercel/next.js
```

### How the Combined Score Works

Each candidate is scored across three dimensions:

| Component | Weight | Source |
|---|---|---|
| Sourcer signals | 40% | Contributions, followers, repos, public email, hireable status |
| Profile evaluation | 50% | Activity, code quality, documentation, collaboration depth |
| Cross-repo bonus | up to +15pts | Appearing in multiple target repos is a strong signal |

---

## repofinder.js: Find Target Repos

Finds high-signal GitHub repositories by tech stack. Use this when you need to identify which repos to target before running `sourcer.js`.

### Usage

```bash
GH_TOKEN=<token> node repofinder.js --stack <tech,tech> [--top N] [--min-stars N] [--csv]
```

### Examples

```bash
# Find top 10 repos for a React/Node stack
GH_TOKEN=ghp_xxxx node repofinder.js --stack react,nodejs

# Web3 repos with higher bar
GH_TOKEN=ghp_xxxx node repofinder.js --stack solidity,ethereum --min-stars 1000

# Export to CSV
GH_TOKEN=ghp_xxxx node repofinder.js --stack python,ml --top 15 --csv
```

### Supported Stack Terms

JavaScript: `javascript` `typescript` `nodejs` `react` `vue` `svelte` `nextjs` `express` `redux`

Python: `python` `django` `fastapi` `flask`

Systems: `go` `rust` `java` `kotlin` `swift`

Web3: `web3` `ethereum` `solidity` `solana` `bitcoin` `defi`

Infrastructure: `kubernetes` `docker` `terraform` `aws`

ML/AI: `ml` `ai` `pytorch` `tensorflow`

---

## sourcer.js: Pull Contributors

Point it at any GitHub repo or NPM package and get a ranked, enriched list of top contributors. Bots automatically filtered out.

### Usage

```bash
GH_TOKEN=<token> node sourcer.js <owner/repo or npm-package> [--top N] [--csv]
```

### Examples

```bash
# Top 10 contributors to a repo
GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express

# NPM package - auto-resolves to its GitHub repo
GH_TOKEN=ghp_xxxx node sourcer.js lodash --top 20

# Export to CSV
GH_TOKEN=ghp_xxxx node sourcer.js vercel/next.js --csv
```

### How the Signal Score Works

| Signal | Points | Why it matters |
|---|---|---|
| Contributions to this repo | up to 40 | Active in this codebase specifically |
| Followers | up to 20 | Community recognition |
| Public repos | up to 15 | Breadth of work |
| Public email listed | 10 | Easy to reach |
| Marked as hireable | 10 | They said they're open |
| Website linked | 5 | Professional presence |
| Twitter/X linked | 5 | Active in the community |

---

## profiler.js: Deep Profile Evaluation

Takes a GitHub username and returns a detailed five-category scorecard. Use this to evaluate specific candidates before reaching out.

### Usage

```bash
GH_TOKEN=<token> node profiler.js <username> [--json]
```

### Examples

```bash
# Full scorecard
GH_TOKEN=ghp_xxxx node profiler.js sindresorhus

# JSON output for piping into other tools
GH_TOKEN=ghp_xxxx node profiler.js sindresorhus --json
```

### What It Evaluates

| Category | What it looks at |
|---|---|
| Profile Completeness | Name, photo, bio, location, email, website, Twitter, hireable |
| Activity and Consistency | Account age, repo count, followers, last active, activity variety |
| Code Quality Signals | Stars received, language diversity, original vs. forks, recent maintenance |
| README and Documentation | Repo descriptions, topics, homepage links, community reception |
| Collaboration Depth | PR reviews, pull requests, issue participation, external contributions |

### Grading Scale

| Grade | Score | Meaning |
|---|---|---|
| A | 85-100 | Exceptional. Strong signal across the board. |
| B | 65-84 | Solid. Worth a conversation. |
| C | 50-64 | Mixed signals. Dig deeper first. |
| D | 35-49 | Thin public profile. May be stronger than GitHub suggests. |
| F | 0-34 | Limited signal. Try other sourcing channels. |

---

## The Bookmarklet: Quick PR History

Drop this into your bookmarks bar and click it on any GitHub profile to instantly see their full PR history:

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

**To install:** Right-click your bookmarks bar, add a new bookmark, paste the script as the URL.

---

## Finding the Right Repos

Both `repofinder.js` and `recruit.js` automate this, but good inputs make better outputs:

**Ask your hiring team.** During intake: "Which libraries or tools does your team use or respect?" Those repos attract exactly the people you want.

**Check strong candidates you already have.** Which repos do they contribute to? Run the tools against those.

**Use GitHub topic search.** [github.com/topics](https://github.com/topics) filtered by most stars or most forks.

**Follow the dependency trail.** Find out what your product depends on, then find who builds it.

---

## Troubleshooting

**`401 Unauthorized`** Your token is wrong or expired. Generate a new one.

**`403 Forbidden`** Rate limited. GitHub allows 5,000 requests/hour on authenticated calls. Wait and try again.

**`404 Not Found`** Check the repo name or username. Both are case-sensitive.

**NPM package not resolving.** Pass the GitHub repo directly instead: `owner/repo`.

**No repos found.** Try lowering `--min-stars` or simplifying your `--stack` terms.

**Output looks misaligned.** The tables are formatted for a standard terminal width. Try making your terminal window wider.

---

## Related Guides

- [GitHub Sourcing Playbook](https://github.com/gabesparks/github-sourcing-playbook) - The step-by-step methodology that pairs with these tools
- [Twitter/X Sourcing Playbook](../twitter-x-sourcing-playbook) - Finding technical talent where they talk about what they're building

---

*Built for recruiters who want to source like engineers think: systematically, signal-first, and without begging anyone for a LinkedIn InMail credit.*
