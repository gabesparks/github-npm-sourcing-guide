#!/usr/bin/env node

/**
 * sourcer.js
 *
 * A CLI tool for technical recruiters to surface and evaluate top contributors
 * from any public GitHub repository or NPM package.
 *
 * Usage:
 *   node sourcer.js <github-owner/repo>           # e.g. node sourcer.js expressjs/express
 *   node sourcer.js <npm-package-name>            # e.g. node sourcer.js lodash
 *   node sourcer.js <repo> --top 20               # show top 20 contributors (default: 10)
 *   node sourcer.js <repo> --csv                  # also export results to a .csv file
 *
 * Requirements:
 *   - Node.js v18+
 *   - A GitHub Personal Access Token set as GH_TOKEN environment variable
 *
 * Example:
 *   GH_TOKEN=ghp_xxxx node sourcer.js expressjs/express --top 15 --csv
 */

const https = require('https');
const fs = require('fs');

// ─── Config ────────────────────────────────────────────────────────────────────

const GH_TOKEN = process.env.GH_TOKEN;
const args = process.argv.slice(2);

if (!args.length) {
  console.error('\n  Usage: GH_TOKEN=<token> node sourcer.js <owner/repo or npm-package> [--top N] [--csv]\n');
  process.exit(1);
}

if (!GH_TOKEN) {
  console.error('\n  ❌  Missing GH_TOKEN. Set your GitHub Personal Access Token:\n');
  console.error('      export GH_TOKEN=ghp_yourTokenHere\n');
  process.exit(1);
}

const input = args[0];
const topN = parseInt(args[args.indexOf('--top') + 1]) || 10;
const exportCsv = args.includes('--csv');

// ─── Bot Detection ─────────────────────────────────────────────────────────────

function isBot(contributor) {
  const login = contributor.login.toLowerCase();
  return (
    contributor.type === 'Bot' ||
    login.includes('[bot]') ||
    login.endsWith('-bot') ||
    login.endsWith('_bot') ||
    login === 'dependabot' ||
    login === 'renovate'
  );
}

// ─── HTTP Helper ───────────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'github-sourcer-cli',
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) return reject(new Error('Not found (404). Check the repo name or package.'));
        if (res.statusCode === 403) return reject(new Error('Rate limited or forbidden (403). Check your GH_TOKEN.'));
        if (res.statusCode === 401) return reject(new Error('Unauthorized (401). Your GH_TOKEN may be invalid or expired.'));
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse response from GitHub API.'));
        }
      });
    }).on('error', reject);
  });
}

// ─── NPM → GitHub Resolver ────────────────────────────────────────────────────

async function resolveNpmToGithub(packageName) {
  console.log(`\n  🔍  Resolving NPM package "${packageName}" to a GitHub repo...`);
  const data = await get(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);

  const repoUrl =
    data?.repository?.url ||
    data?.versions?.[data['dist-tags']?.latest]?.repository?.url;

  if (!repoUrl) {
    throw new Error(`Could not find a GitHub repo linked in the NPM package "${packageName}". Try passing the GitHub repo directly (e.g. owner/repo).`);
  }

  const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  if (!match) {
    throw new Error(`Repo URL found (${repoUrl}) but couldn't extract a GitHub owner/repo from it.`);
  }

  const repo = match[1].replace(/\.git$/, '');
  console.log(`  ✅  Resolved to GitHub repo: ${repo}\n`);
  return repo;
}

// ─── GitHub API Calls ─────────────────────────────────────────────────────────

async function getContributors(repo, count) {
  const perPage = Math.min(count + 5, 100); // fetch a few extra to account for bots
  const data = await get(
    `https://api.github.com/repos/${repo}/contributors?per_page=${perPage}&anon=false`
  );

  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response fetching contributors. Check that "${repo}" is a public repo.`);
  }

  return data;
}

async function getUserProfile(username) {
  return get(`https://api.github.com/users/${username}`);
}

// ─── Enrichment ───────────────────────────────────────────────────────────────

function accountAgeYears(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const years = ((now - created) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  return `${years}y`;
}

function score(profile, contributions) {
  let s = 0;
  s += Math.min(contributions / 10, 40);        // up to 40pts for contributions
  s += Math.min(profile.followers / 5, 20);     // up to 20pts for followers
  s += Math.min(profile.public_repos / 2, 15);  // up to 15pts for repo count
  s += profile.email ? 10 : 0;                  // 10pts if email is public
  s += profile.blog ? 5 : 0;                    // 5pts if they have a website
  s += profile.twitter_username ? 5 : 0;        // 5pts if Twitter/X linked
  s += profile.hireable ? 10 : 0;               // 10pts if marked hireable
  return Math.round(Math.min(s, 100));
}

// ─── Output Formatters ────────────────────────────────────────────────────────

function pad(str, len) {
  const s = String(str ?? '—');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

function printTable(results) {
  const cols = {
    rank:          4,
    username:      20,
    name:          22,
    contributions: 7,
    followers:     9,
    repos:         6,
    accountAge:    8,
    location:      18,
    email:         26,
    score:         6,
  };

  const header =
    pad('#', cols.rank) +
    pad('Username', cols.username) +
    pad('Name', cols.name) +
    pad('PRs', cols.contributions) +
    pad('Follow', cols.followers) +
    pad('Repos', cols.repos) +
    pad('Age', cols.accountAge) +
    pad('Location', cols.location) +
    pad('Email', cols.email) +
    pad('Score', cols.score);

  const divider = '─'.repeat(header.length);

  console.log('\n' + divider);
  console.log(header);
  console.log(divider);

  for (const r of results) {
    const row =
      pad(r.rank, cols.rank) +
      pad(r.username, cols.username) +
      pad(r.name, cols.name) +
      pad(r.contributions, cols.contributions) +
      pad(r.followers, cols.followers) +
      pad(r.public_repos, cols.repos) +
      pad(r.accountAge, cols.accountAge) +
      pad(r.location, cols.location) +
      pad(r.email, cols.email) +
      pad(r.score, cols.score);
    console.log(row);
  }

  console.log(divider);
  console.log(`\n  Score = weighted signal (contributions, followers, repos, public email, hireable status)`);
  console.log(`  View full profiles at: https://github.com/<username>\n`);
}

function exportToCsv(results, repo) {
  const filename = `contributors-${repo.replace('/', '-')}.csv`;
  const headers = [
    'Rank', 'Username', 'Name', 'Contributions', 'Followers',
    'Public Repos', 'Account Age', 'Location', 'Email',
    'Website', 'Twitter', 'Hireable', 'Score', 'GitHub URL'
  ];
  const rows = results.map(r => [
    r.rank,
    r.username,
    r.name ?? '',
    r.contributions,
    r.followers,
    r.public_repos,
    r.accountAge,
    r.location ?? '',
    r.email ?? '',
    r.blog ?? '',
    r.twitter_username ? `@${r.twitter_username}` : '',
    r.hireable ? 'Yes' : '',
    r.score,
    `https://github.com/${r.username}`,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  fs.writeFileSync(filename, csv, 'utf8');
  console.log(`  📄  Exported to ${filename}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let repo = input;

  // Detect if input is an NPM package (not in owner/repo format)
  const isNpmPackage = !input.match(/^[^@][^/]*\/[^/]+$/) || input.startsWith('@');
  if (isNpmPackage) {
    repo = await resolveNpmToGithub(input);
  }

  console.log(`\n  🔎  Fetching top ${topN} contributors for: ${repo}`);

  let contributors;
  try {
    contributors = await getContributors(repo, topN);
  } catch (err) {
    console.error(`\n  ❌  ${err.message}\n`);
    process.exit(1);
  }

  // Filter out bots
  const humans = contributors.filter(c => !isBot(c));
  const botsSkipped = contributors.length - humans.length;
  const skipNote = botsSkipped > 0 ? ` (${botsSkipped} bot${botsSkipped > 1 ? 's' : ''} skipped)` : '';

  // Take only the top N after filtering
  const topHumans = humans.slice(0, topN);

  console.log(`  ✅  Found ${topHumans.length} human contributors${skipNote}. Enriching profiles...\n`);

  const results = [];

  for (let i = 0; i < topHumans.length; i++) {
    const c = topHumans[i];
    process.stdout.write(`  Loading ${i + 1}/${topHumans.length}: ${c.login}...    \r`);

    let profile = {};
    try {
      profile = await getUserProfile(c.login);
    } catch {
      // If a profile fetch fails, continue with partial data
    }

    results.push({
      rank: i + 1,
      username: c.login,
      name: profile.name,
      contributions: c.contributions,
      followers: profile.followers ?? 0,
      public_repos: profile.public_repos ?? 0,
      accountAge: profile.created_at ? accountAgeYears(profile.created_at) : '?',
      location: profile.location,
      email: profile.email,
      blog: profile.blog,
      twitter_username: profile.twitter_username,
      hireable: profile.hireable,
      score: score(profile, c.contributions),
    });

    // Be polite to GitHub's API
    await new Promise(r => setTimeout(r, 150));
  }

  process.stdout.write(' '.repeat(60) + '\r'); // clear progress line

  printTable(results);

  if (exportCsv) {
    exportToCsv(results, repo);
  }
}

main().catch(err => {
  console.error(`\n  ❌  ${err.message}\n`);
  process.exit(1);
});
