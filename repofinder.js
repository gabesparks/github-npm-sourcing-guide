#!/usr/bin/env node

/**
 * repofinder.js
 *
 * A CLI tool for technical recruiters to discover high-signal GitHub repositories
 * to target for sourcing. Takes a tech stack as input and returns a ranked list
 * of active, well-maintained repos with strong contributor communities.
 *
 * Usage:
 *   node repofinder.js --stack <tech,tech,tech> [--top N] [--min-stars N] [--csv]
 *
 * Requirements:
 *   - Node.js v18+
 *   - A GitHub Personal Access Token set as GH_TOKEN environment variable
 *
 * Examples:
 *   GH_TOKEN=ghp_xxxx node repofinder.js --stack react,nodejs
 *   GH_TOKEN=ghp_xxxx node repofinder.js --stack solidity,web3,ethereum --top 15
 *   GH_TOKEN=ghp_xxxx node repofinder.js --stack typescript,react --min-stars 1000 --csv
 */

const https = require('https');
const fs = require('fs');

// ─── Config ────────────────────────────────────────────────────────────────────

const GH_TOKEN = process.env.GH_TOKEN;
const args = process.argv.slice(2);

if (!GH_TOKEN) {
  console.error('\n  Missing GH_TOKEN. Set your GitHub Personal Access Token:\n');
  console.error('      export GH_TOKEN=ghp_yourTokenHere\n');
  process.exit(1);
}

// Parse --stack
const stackIndex = args.indexOf('--stack');
if (stackIndex === -1 || !args[stackIndex + 1]) {
  console.error('\n  Usage: GH_TOKEN=<token> node repofinder.js --stack <tech,tech> [--top N] [--min-stars N] [--csv]\n');
  console.error('  Example: node repofinder.js --stack react,nodejs,typescript\n');
  process.exit(1);
}

const stack = args[stackIndex + 1].split(',').map(s => s.trim().toLowerCase());
const topN = parseInt(args[args.indexOf('--top') + 1]) || 10;
const minStars = parseInt(args[args.indexOf('--min-stars') + 1]) || 500;
const exportCsv = args.includes('--csv');

// ─── Tech Stack Mappings ──────────────────────────────────────────────────────
// Maps common input terms to GitHub search topics and languages

const STACK_MAP = {
  // JavaScript ecosystem
  javascript:   { topics: ['javascript', 'js'], language: 'JavaScript' },
  typescript:   { topics: ['typescript', 'ts'], language: 'TypeScript' },
  nodejs:       { topics: ['nodejs', 'node-js', 'node'], language: 'JavaScript' },
  node:         { topics: ['nodejs', 'node-js'], language: 'JavaScript' },
  react:        { topics: ['react', 'reactjs', 'react-native'], language: 'JavaScript' },
  vue:          { topics: ['vue', 'vuejs', 'vue3'], language: 'JavaScript' },
  svelte:       { topics: ['svelte', 'sveltekit'], language: 'JavaScript' },
  nextjs:       { topics: ['nextjs', 'next-js'], language: 'JavaScript' },
  express:      { topics: ['express', 'expressjs'], language: 'JavaScript' },
  redux:        { topics: ['redux', 'state-management'], language: 'JavaScript' },

  // Python ecosystem
  python:       { topics: ['python', 'python3'], language: 'Python' },
  django:       { topics: ['django', 'django-rest-framework'], language: 'Python' },
  fastapi:      { topics: ['fastapi', 'fast-api'], language: 'Python' },
  flask:        { topics: ['flask', 'flask-api'], language: 'Python' },

  // Go
  go:           { topics: ['go', 'golang'], language: 'Go' },
  golang:       { topics: ['golang', 'go'], language: 'Go' },

  // Rust
  rust:         { topics: ['rust', 'rust-lang'], language: 'Rust' },

  // Java / JVM
  java:         { topics: ['java', 'spring-boot'], language: 'Java' },
  kotlin:       { topics: ['kotlin', 'android'], language: 'Kotlin' },
  spring:       { topics: ['spring', 'spring-boot'], language: 'Java' },

  // Mobile
  ios:          { topics: ['ios', 'swift', 'swiftui'], language: 'Swift' },
  swift:        { topics: ['swift', 'swiftui', 'ios'], language: 'Swift' },
  android:      { topics: ['android', 'kotlin'], language: 'Kotlin' },

  // Web3 / Blockchain
  web3:         { topics: ['web3', 'blockchain', 'ethereum'], language: null },
  ethereum:     { topics: ['ethereum', 'solidity', 'evm'], language: null },
  solidity:     { topics: ['solidity', 'smart-contracts', 'ethereum'], language: 'Solidity' },
  solana:       { topics: ['solana', 'sol', 'anchor'], language: 'Rust' },
  bitcoin:      { topics: ['bitcoin', 'lightning-network', 'btc'], language: null },
  defi:         { topics: ['defi', 'decentralized-finance'], language: null },

  // Infrastructure / DevOps
  kubernetes:   { topics: ['kubernetes', 'k8s', 'helm'], language: null },
  docker:       { topics: ['docker', 'containers', 'dockerfile'], language: null },
  terraform:    { topics: ['terraform', 'infrastructure-as-code'], language: 'HCL' },
  aws:          { topics: ['aws', 'amazon-web-services', 'cloud'], language: null },

  // Data / ML
  ml:           { topics: ['machine-learning', 'deep-learning', 'ai'], language: 'Python' },
  ai:           { topics: ['artificial-intelligence', 'machine-learning'], language: 'Python' },
  pytorch:      { topics: ['pytorch', 'deep-learning'], language: 'Python' },
  tensorflow:   { topics: ['tensorflow', 'keras', 'deep-learning'], language: 'Python' },

  // Databases
  postgres:     { topics: ['postgresql', 'postgres', 'database'], language: null },
  mongodb:      { topics: ['mongodb', 'mongoose', 'nosql'], language: null },
  redis:        { topics: ['redis', 'caching'], language: null },
};

// ─── HTTP Helper ───────────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'github-repofinder-cli',
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 403) return reject(new Error('Rate limited (403). Wait a moment and try again.'));
        if (res.statusCode === 401) return reject(new Error('Unauthorized (401). Check your GH_TOKEN.'));
        if (res.statusCode === 422) return reject(new Error('Invalid search query (422). Check your --stack terms.'));
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function pad(str, len) {
  const s = String(str ?? '');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

function activityLabel(days) {
  if (days <= 7)   return 'This week';
  if (days <= 30)  return 'This month';
  if (days <= 90)  return 'Last 3mo';
  if (days <= 180) return 'Last 6mo';
  if (days <= 365) return 'Last year';
  return `${Math.floor(days / 365)}y+ ago`;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreRepo(repo, stackTerms) {
  let score = 0;

  // Stars (up to 40pts)
  score += Math.min(Math.log10(repo.stargazers_count + 1) * 10, 40);

  // Forks as proxy for real usage (up to 20pts)
  score += Math.min(Math.log10(repo.forks_count + 1) * 7, 20);

  // Recency of last push (up to 25pts)
  const days = daysSince(repo.pushed_at);
  if (days <= 7)   score += 25;
  else if (days <= 30)  score += 20;
  else if (days <= 90)  score += 15;
  else if (days <= 180) score += 8;
  else if (days <= 365) score += 3;

  // Has description (up to 5pts)
  if (repo.description && repo.description.length > 10) score += 5;

  // Topic relevance - bonus if repo topics overlap with search terms (up to 10pts)
  const repoTopics = repo.topics || [];
  const overlap = stackTerms.filter(t => repoTopics.some(rt => rt.includes(t) || t.includes(rt)));
  score += Math.min(overlap.length * 3, 10);

  return Math.round(score);
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchRepos(query, language) {
  // Calculate date one year ago
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const cutoffDate = oneYearAgo.toISOString().split('T')[0];

  let q = `${query}+stars:>${minStars}+pushed:>${cutoffDate}+fork:false`;
  // Only add language filter when searching by keyword (not topic) to avoid over-filtering
  // e.g. react repos are often TypeScript, not just JavaScript
  if (language && !query.startsWith('topic:')) {
    q += `+language:${encodeURIComponent(language)}`;
  }

  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`;
  const data = await get(url).catch(() => null);
  return data?.items || [];
}

async function fetchContributorCount(repo) {
  // GitHub doesn't return contributor count in search results.
  // We use the contributors endpoint with per_page=1 and check the Link header
  // as a lightweight way to get the count. Since we can't parse headers easily
  // in this setup, we return a reasonable proxy: forks + watchers as a signal.
  // For a full count, users can run sourcer.js against the repo directly.
  return repo.forks_count + repo.watchers_count;
}

// ─── Output ───────────────────────────────────────────────────────────────────

function printTable(results, stack) {
  console.log(`\n  Results for stack: ${stack.join(', ')}`);
  console.log(`  Filtered to repos with ${formatNumber(minStars)}+ stars, active in last 12 months.\n`);

  const divider = '─'.repeat(110);
  const header =
    pad('#', 4) +
    pad('Repository', 35) +
    pad('Stars', 7) +
    pad('Forks', 7) +
    pad('Language', 14) +
    pad('Last Active', 12) +
    pad('Score', 6) +
    'Description';

  console.log(divider);
  console.log(header);
  console.log(divider);

  for (const r of results) {
    const row =
      pad(r.rank, 4) +
      pad(r.full_name, 35) +
      pad(formatNumber(r.stargazers_count), 7) +
      pad(formatNumber(r.forks_count), 7) +
      pad(r.language || '—', 14) +
      pad(activityLabel(daysSince(r.pushed_at)), 12) +
      pad(r.score, 6) +
      (r.description ? r.description.slice(0, 40) : '');
    console.log(row);
  }

  console.log(divider);
  console.log(`\n  To pull top contributors from any of these repos, run:`);
  console.log(`  GH_TOKEN=<token> node sourcer.js <owner/repo> --top 15\n`);
}

function exportToCsv(results, stack) {
  const filename = `repos-${stack.join('-')}.csv`;
  const headers = ['Rank', 'Repo', 'Stars', 'Forks', 'Language', 'Last Active', 'Score', 'Description', 'URL'];
  const rows = results.map(r => [
    r.rank,
    r.full_name,
    r.stargazers_count,
    r.forks_count,
    r.language || '',
    activityLabel(daysSince(r.pushed_at)),
    r.score,
    r.description || '',
    r.html_url,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  fs.writeFileSync(filename, csv, 'utf8');
  console.log(`  Exported to ${filename}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  Searching for high-signal repos for stack: ${stack.join(', ')}...`);

  // Build search queries from stack terms
  const queries = new Map();

  for (const term of stack) {
    const mapping = STACK_MAP[term];
    if (mapping) {
      for (const topic of mapping.topics) {
        const key = `topic:${topic}`;
        if (!queries.has(key)) {
          queries.set(key, { query: key, language: mapping.language });
        }
      }
    } else {
      // Unknown term — search it directly as a topic and keyword
      queries.set(`topic:${term}`, { query: `topic:${term}`, language: null });
      queries.set(term, { query: term, language: null });
    }
  }

  // Run searches (deduplicated, max 8 queries to stay within rate limits)
  const searchList = [...queries.values()].slice(0, 8);
  const seen = new Set();
  const allRepos = [];

  for (let i = 0; i < searchList.length; i++) {
    const { query, language } = searchList[i];
    process.stdout.write(`  Searching (${i + 1}/${searchList.length}): ${query}...    \r`);

    const repos = await searchRepos(query, language);
    for (const repo of repos) {
      if (!seen.has(repo.id)) {
        seen.add(repo.id);
        allRepos.push(repo);
      }
    }

    // Be polite to GitHub's search API (10 requests/min unauthenticated, 30 authenticated)
    await new Promise(r => setTimeout(r, 400));
  }

  process.stdout.write(' '.repeat(60) + '\r');

  if (allRepos.length === 0) {
    console.error(`\n  No repos found for stack: ${stack.join(', ')}`);
    console.error(`  Try lowering --min-stars or checking your stack terms.\n`);
    process.exit(1);
  }

  // Score and rank
  const scored = allRepos
    .map(repo => ({ ...repo, score: scoreRepo(repo, stack) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((repo, i) => ({ ...repo, rank: i + 1 }));

  console.log(`  Found ${allRepos.length} repos. Showing top ${scored.length}.\n`);

  printTable(scored, stack);

  if (exportCsv) {
    exportToCsv(scored, stack);
  }
}

main().catch(err => {
  console.error(`\n  ${err.message}\n`);
  process.exit(1);
});
