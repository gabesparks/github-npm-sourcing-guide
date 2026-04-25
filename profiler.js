#!/usr/bin/env node

/**
 * profiler.js
 *
 * A CLI tool for technical recruiters to deeply evaluate a GitHub profile.
 * Takes a GitHub username and returns a detailed recruiter scorecard covering
 * profile completeness, activity, code quality signals, README quality,
 * and collaboration depth.
 *
 * Usage:
 *   node profiler.js <username>
 *   node profiler.js <username> --json       # output raw JSON instead of formatted report
 *
 * Requirements:
 *   - Node.js v18+
 *   - A GitHub Personal Access Token set as GH_TOKEN environment variable
 *
 * Example:
 *   GH_TOKEN=ghp_xxxx node profiler.js torvalds
 */

const https = require('https');

// ─── Config ────────────────────────────────────────────────────────────────────

const GH_TOKEN = process.env.GH_TOKEN;
const args = process.argv.slice(2);

if (!args.length) {
  console.error('\n  Usage: GH_TOKEN=<token> node profiler.js <github-username> [--json]\n');
  process.exit(1);
}

if (!GH_TOKEN) {
  console.error('\n  Missing GH_TOKEN. Set your GitHub Personal Access Token:\n');
  console.error('      export GH_TOKEN=ghp_yourTokenHere\n');
  process.exit(1);
}

const username = args[0];
const outputJson = args.includes('--json');

// ─── HTTP Helper ───────────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'github-profiler-cli',
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) return reject(new Error(`User "${username}" not found (404). Check the username.`));
        if (res.statusCode === 403) return reject(new Error('Rate limited or forbidden (403). Check your GH_TOKEN.'));
        if (res.statusCode === 401) return reject(new Error('Unauthorized (401). Your GH_TOKEN may be invalid or expired.'));
        if (res.statusCode === 204) return resolve(null);
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

function getWithFallback(url) {
  return get(url).catch(() => null);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function yearsSince(dateStr) {
  if (!dateStr) return null;
  return ((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function grade(score) {
  if (score >= 85) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function bar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── Scoring Modules ──────────────────────────────────────────────────────────

function scoreProfile(profile) {
  const signals = [];
  let score = 0;

  // Name
  if (profile.name) { score += 10; signals.push({ label: 'Real name listed', pass: true }); }
  else { signals.push({ label: 'Real name listed', pass: false }); }

  // Avatar (non-default)
  const hasCustomAvatar = profile.avatar_url && !profile.avatar_url.includes('identicons');
  if (hasCustomAvatar) { score += 10; signals.push({ label: 'Custom profile photo', pass: true }); }
  else { signals.push({ label: 'Custom profile photo', pass: false }); }

  // Bio
  if (profile.bio && profile.bio.length > 10) { score += 15; signals.push({ label: 'Bio filled in', pass: true }); }
  else { signals.push({ label: 'Bio filled in', pass: false }); }

  // Location
  if (profile.location) { score += 10; signals.push({ label: 'Location listed', pass: true }); }
  else { signals.push({ label: 'Location listed', pass: false }); }

  // Public email
  if (profile.email) { score += 20; signals.push({ label: 'Public email listed', pass: true, value: profile.email }); }
  else { signals.push({ label: 'Public email listed', pass: false }); }

  // Website
  if (profile.blog) { score += 15; signals.push({ label: 'Website or portfolio linked', pass: true, value: profile.blog }); }
  else { signals.push({ label: 'Website or portfolio linked', pass: false }); }

  // Twitter/X
  if (profile.twitter_username) { score += 10; signals.push({ label: 'Twitter/X linked', pass: true, value: `@${profile.twitter_username}` }); }
  else { signals.push({ label: 'Twitter/X linked', pass: false }); }

  // Hireable
  if (profile.hireable) { score += 10; signals.push({ label: 'Marked as hireable', pass: true }); }
  else { signals.push({ label: 'Marked as hireable', pass: false }); }

  const summary = score >= 70
    ? 'Well-rounded profile. Easy to contact and verify.'
    : score >= 40
    ? 'Partial profile. Some key fields are missing.'
    : 'Minimal profile. May be hard to reach or verify.';

  return { score: clamp(score, 0, 100), signals, summary };
}

function scoreActivity(profile, events) {
  const signals = [];
  let score = 0;

  // Account age
  const ageYears = parseFloat(yearsSince(profile.created_at));
  if (ageYears >= 5) { score += 20; signals.push({ label: `Account age: ${ageYears}y`, pass: true }); }
  else if (ageYears >= 2) { score += 10; signals.push({ label: `Account age: ${ageYears}y (relatively new)`, pass: true }); }
  else { signals.push({ label: `Account age: ${ageYears}y (very new)`, pass: false }); }

  // Public repos
  if (profile.public_repos >= 20) { score += 20; signals.push({ label: `${profile.public_repos} public repos`, pass: true }); }
  else if (profile.public_repos >= 5) { score += 10; signals.push({ label: `${profile.public_repos} public repos`, pass: true }); }
  else { signals.push({ label: `${profile.public_repos} public repos (few)`, pass: false }); }

  // Followers
  if (profile.followers >= 100) { score += 20; signals.push({ label: `${profile.followers} followers`, pass: true }); }
  else if (profile.followers >= 20) { score += 10; signals.push({ label: `${profile.followers} followers`, pass: true }); }
  else { signals.push({ label: `${profile.followers} followers (low visibility)`, pass: false }); }

  // Recent activity via events
  if (events && events.length > 0) {
    const lastEvent = events[0];
    const daysAgo = daysSince(lastEvent.created_at);
    if (daysAgo <= 14) { score += 25; signals.push({ label: `Last active ${daysAgo} days ago`, pass: true }); }
    else if (daysAgo <= 90) { score += 15; signals.push({ label: `Last active ${daysAgo} days ago`, pass: true }); }
    else { score += 5; signals.push({ label: `Last active ${daysAgo} days ago (inactive)`, pass: false }); }

    // Event variety (pushes, PRs, reviews, issues, comments)
    const eventTypes = new Set(events.map(e => e.type));
    if (eventTypes.size >= 4) { score += 15; signals.push({ label: `${eventTypes.size} different activity types (diverse contributor)`, pass: true }); }
    else if (eventTypes.size >= 2) { score += 8; signals.push({ label: `${eventTypes.size} activity types`, pass: true }); }
    else { signals.push({ label: 'Limited activity variety', pass: false }); }
  } else {
    signals.push({ label: 'No recent public activity found', pass: false });
  }

  const summary = score >= 70
    ? 'Actively engaged on GitHub with a strong, established presence.'
    : score >= 40
    ? 'Moderate activity. Worth a closer look at their repo history.'
    : 'Low recent activity. May be heads-down in private repos or less active.';

  return { score: clamp(score, 0, 100), signals, summary };
}

function scoreCodeQuality(repos) {
  const signals = [];
  let score = 0;

  if (!repos || repos.length === 0) {
    return { score: 0, signals: [{ label: 'No public repos found', pass: false }], summary: 'No public repos to evaluate.' };
  }

  // Filter out forks, look at original work only
  const ownRepos = repos.filter(r => !r.fork).slice(0, 10);
  const allRepos = repos.slice(0, 10);

  // Stars received across own repos
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  if (totalStars >= 100) { score += 25; signals.push({ label: `${totalStars} total stars on original repos`, pass: true }); }
  else if (totalStars >= 20) { score += 15; signals.push({ label: `${totalStars} stars on original repos`, pass: true }); }
  else if (totalStars >= 5) { score += 8; signals.push({ label: `${totalStars} stars on original repos`, pass: true }); }
  else { signals.push({ label: `${totalStars} stars on original repos (low recognition)`, pass: false }); }

  // Language diversity
  const languages = new Set(allRepos.map(r => r.language).filter(Boolean));
  if (languages.size >= 4) { score += 20; signals.push({ label: `${languages.size} languages: ${[...languages].join(', ')}`, pass: true }); }
  else if (languages.size >= 2) { score += 12; signals.push({ label: `${languages.size} languages: ${[...languages].join(', ')}`, pass: true }); }
  else { signals.push({ label: `${languages.size > 0 ? [...languages].join(', ') : 'No language data'}`, pass: false }); }

  // Has repos with descriptions (signals care about documentation)
  const withDescriptions = ownRepos.filter(r => r.description && r.description.length > 10);
  const descRatio = ownRepos.length > 0 ? withDescriptions.length / ownRepos.length : 0;
  if (descRatio >= 0.7) { score += 15; signals.push({ label: `${Math.round(descRatio * 100)}% of repos have descriptions`, pass: true }); }
  else if (descRatio >= 0.4) { score += 8; signals.push({ label: `${Math.round(descRatio * 100)}% of repos have descriptions`, pass: true }); }
  else { signals.push({ label: `Only ${Math.round(descRatio * 100)}% of repos have descriptions`, pass: false }); }

  // Has repos with topics/tags
  const withTopics = allRepos.filter(r => r.topics && r.topics.length > 0);
  if (withTopics.length >= 3) { score += 15; signals.push({ label: 'Repos are tagged with topics', pass: true }); }
  else if (withTopics.length >= 1) { score += 8; signals.push({ label: 'Some repos tagged with topics', pass: true }); }
  else { signals.push({ label: 'No repos tagged with topics', pass: false }); }

  // Original vs fork ratio
  const forkRatio = repos.length > 0 ? ownRepos.length / repos.length : 0;
  if (forkRatio >= 0.7) { score += 15; signals.push({ label: `${Math.round(forkRatio * 100)}% original repos (not forks)`, pass: true }); }
  else if (forkRatio >= 0.4) { score += 8; signals.push({ label: `${Math.round(forkRatio * 100)}% original repos`, pass: true }); }
  else { signals.push({ label: `Only ${Math.round(forkRatio * 100)}% original repos (mostly forks)`, pass: false }); }

  // Has a repo that's been recently updated
  const recentlyUpdated = allRepos.filter(r => daysSince(r.pushed_at) <= 90);
  if (recentlyUpdated.length >= 3) { score += 10; signals.push({ label: `${recentlyUpdated.length} repos updated in last 90 days`, pass: true }); }
  else if (recentlyUpdated.length >= 1) { score += 5; signals.push({ label: `${recentlyUpdated.length} repo updated in last 90 days`, pass: true }); }
  else { signals.push({ label: 'No repos updated recently', pass: false }); }

  const summary = score >= 70
    ? 'Strong portfolio. Original work, good recognition, and active maintenance.'
    : score >= 40
    ? 'Decent portfolio with room to dig deeper. Check their top repos directly.'
    : 'Thin or fork-heavy portfolio. May be stronger in private repos.';

  return { score: clamp(score, 0, 100), signals, summary };
}

function scoreReadme(repos) {
  const signals = [];
  let score = 0;

  if (!repos || repos.length === 0) {
    return { score: 0, signals: [{ label: 'No repos to evaluate', pass: false }], summary: 'No README data available.' };
  }

  // Pick top 3 non-fork repos by stars to evaluate
  const topRepos = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3);

  if (topRepos.length === 0) {
    return { score: 0, signals: [{ label: 'No original repos to evaluate', pass: false }], summary: 'All repos are forks.' };
  }

  // Check which repos have a README (indicated by has_pages or description as proxy;
  // actual README content requires an extra API call per repo — we score on repo metadata signals)
  const withDesc = topRepos.filter(r => r.description && r.description.length > 20);
  if (withDesc.length === topRepos.length) {
    score += 30;
    signals.push({ label: 'All top repos have meaningful descriptions', pass: true });
  } else if (withDesc.length > 0) {
    score += 15;
    signals.push({ label: `${withDesc.length}/${topRepos.length} top repos have descriptions`, pass: true });
  } else {
    signals.push({ label: 'Top repos lack descriptions', pass: false });
  }

  // Topics as a signal of documentation mindset
  const withTopics = topRepos.filter(r => r.topics && r.topics.length >= 2);
  if (withTopics.length >= 2) {
    score += 25;
    signals.push({ label: 'Top repos use topics/tags for discoverability', pass: true });
  } else if (withTopics.length === 1) {
    score += 12;
    signals.push({ label: 'Some repos use topics', pass: true });
  } else {
    signals.push({ label: 'Top repos have no topics', pass: false });
  }

  // Has a personal website (often includes portfolio/docs)
  const topRepo = topRepos[0];
  if (topRepo.homepage) {
    score += 20;
    signals.push({ label: `Top repo links to: ${topRepo.homepage}`, pass: true });
  } else {
    signals.push({ label: 'Top repo has no homepage link', pass: false });
  }

  // Stars on top repo as a proxy for README quality (good READMEs attract stars)
  if (topRepo.stargazers_count >= 50) {
    score += 25;
    signals.push({ label: `Top repo has ${topRepo.stargazers_count} stars (well-received)`, pass: true });
  } else if (topRepo.stargazers_count >= 10) {
    score += 15;
    signals.push({ label: `Top repo has ${topRepo.stargazers_count} stars`, pass: true });
  } else {
    signals.push({ label: `Top repo has ${topRepo.stargazers_count} stars (low visibility)`, pass: false });
  }

  // Top repo name (clean, descriptive names signal attention to detail)
  const cleanName = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(topRepo.name);
  if (cleanName) {
    score += 0; // not penalized, just noted
    signals.push({ label: `Top repo: "${topRepo.name}" (clean, readable name)`, pass: true });
  } else {
    signals.push({ label: `Top repo: "${topRepo.name}"`, pass: true });
  }

  const summary = score >= 70
    ? 'Strong documentation signals. Their repos are well-presented and discoverable.'
    : score >= 40
    ? 'Moderate documentation. Worth opening their top repo README directly.'
    : 'Weak documentation signals. Check their repos manually before drawing conclusions.';

  return { score: clamp(score, 0, 100), signals, summary };
}

function scoreCollaboration(profile, events) {
  const signals = [];
  let score = 0;

  if (!events || events.length === 0) {
    return {
      score: 0,
      signals: [{ label: 'No recent public events to evaluate', pass: false }],
      summary: 'No collaboration data available from recent public activity.'
    };
  }

  // PR reviews
  const reviews = events.filter(e => e.type === 'PullRequestReviewEvent');
  if (reviews.length >= 5) { score += 30; signals.push({ label: `${reviews.length} PR reviews in recent activity`, pass: true }); }
  else if (reviews.length >= 2) { score += 15; signals.push({ label: `${reviews.length} PR reviews in recent activity`, pass: true }); }
  else { signals.push({ label: 'Few or no PR reviews in recent activity', pass: false }); }

  // PR submissions
  const prs = events.filter(e => e.type === 'PullRequestEvent');
  if (prs.length >= 5) { score += 20; signals.push({ label: `${prs.length} pull requests submitted recently`, pass: true }); }
  else if (prs.length >= 2) { score += 10; signals.push({ label: `${prs.length} pull requests submitted recently`, pass: true }); }
  else { signals.push({ label: 'Few recent pull requests', pass: false }); }

  // Issue participation
  const issues = events.filter(e => e.type === 'IssuesEvent' || e.type === 'IssueCommentEvent');
  if (issues.length >= 5) { score += 20; signals.push({ label: `${issues.length} issue interactions recently`, pass: true }); }
  else if (issues.length >= 2) { score += 10; signals.push({ label: `${issues.length} issue interactions recently`, pass: true }); }
  else { signals.push({ label: 'Low issue participation recently', pass: false }); }

  // Pushes to external repos (contributing to others)
  const pushes = events.filter(e => e.type === 'PushEvent');
  const externalPushes = pushes.filter(e => e.repo && !e.repo.name.startsWith(username + '/'));
  if (externalPushes.length >= 3) { score += 20; signals.push({ label: `Contributing to ${externalPushes.length} external repos`, pass: true }); }
  else if (externalPushes.length >= 1) { score += 10; signals.push({ label: `Some contributions to external repos`, pass: true }); }
  else { signals.push({ label: 'Mostly commits to own repos', pass: false }); }

  // Following/followers ratio (engaged in the community)
  if (profile.following === 0) {
    // Follows nobody — not a red flag, some senior engineers simply don't follow anyone
    score += 5;
    signals.push({ label: `Follows nobody (${profile.followers} followers). Common among senior engineers.`, pass: true });
  } else {
    const ratio = profile.followers / profile.following;
    if (ratio >= 2) { score += 10; signals.push({ label: `Followers/following ratio: ${ratio.toFixed(1)} (strong community presence)`, pass: true }); }
    else if (ratio >= 0.5) { score += 5; signals.push({ label: `Followers/following ratio: ${ratio.toFixed(1)}`, pass: true }); }
    else { signals.push({ label: `Followers/following ratio: ${ratio.toFixed(1)} (following many, followed by few)`, pass: false }); }
  }

  // If overall collaboration signals are low but follower count is high,
  // they may be collaborating outside GitHub's PR model (mailing lists, patches, etc.)
  const totalCollabEvents = reviews.length + prs.length + issues.length + externalPushes.length;
  if (totalCollabEvents === 0 && profile.followers >= 1000) {
    score += 15;
    signals.push({ label: `High follower count (${profile.followers}) suggests collaboration may happen outside GitHub's PR model`, pass: true });
  }

  const summary = score >= 70
    ? 'Strong collaborator. Active in PRs, reviews, and issues across multiple repos.'
    : score >= 40
    ? 'Some collaboration signals. May work more in private or be selective about open-source.'
    : score > 0
    ? 'Low GitHub collaboration signals. May use mailing lists, patches, or other workflows. Check manually.'
    : 'No collaboration signals in public activity. Worth asking about team workflows in an interview.';

  return { score: clamp(score, 0, 100), signals, summary };
}

// ─── Overall Verdict ──────────────────────────────────────────────────────────

function verdict(scores) {
  const avg = Math.round(
    (scores.profile + scores.activity + scores.codeQuality + scores.readme + scores.collaboration) / 5
  );

  let recommendation;
  if (avg >= 80) recommendation = 'Strong candidate. Prioritize outreach.';
  else if (avg >= 65) recommendation = 'Solid profile. Worth a conversation.';
  else if (avg >= 50) recommendation = 'Mixed signals. Dig deeper before reaching out.';
  else if (avg >= 35) recommendation = 'Thin public profile. May be stronger than GitHub suggests.';
  else recommendation = 'Limited signal. Consider other sourcing channels for this candidate.';

  return { overall: avg, grade: grade(avg), recommendation };
}

// ─── Output ───────────────────────────────────────────────────────────────────

function printReport(profile, results) {
  const divider = '─'.repeat(60);
  const v = results.verdict;

  console.log('\n' + '═'.repeat(60));
  console.log(`  GitHub Profile Report: @${profile.login}`);
  if (profile.name) console.log(`  ${profile.name}`);
  if (profile.bio) console.log(`  "${profile.bio}"`);
  console.log('═'.repeat(60));

  const categories = [
    { label: 'Profile Completeness', key: 'profile', data: results.profile },
    { label: 'Activity & Consistency', key: 'activity', data: results.activity },
    { label: 'Code Quality Signals', key: 'codeQuality', data: results.codeQuality },
    { label: 'README & Documentation', key: 'readme', data: results.readme },
    { label: 'Collaboration Depth', key: 'collaboration', data: results.collaboration },
  ];

  for (const cat of categories) {
    const s = cat.data.score;
    console.log(`\n  ${cat.label}`);
    console.log(`  ${bar(s)} ${s}/100 (${grade(s)})`);
    console.log(`  ${cat.data.summary}`);
    console.log('');
    for (const sig of cat.data.signals) {
      const icon = sig.pass ? '  ✅' : '  ❌';
      const val = sig.value ? ` (${sig.value})` : '';
      console.log(`${icon}  ${sig.label}${val}`);
    }
    console.log('\n' + divider);
  }

  console.log('\n  OVERALL SCORECARD');
  console.log(`  ${bar(v.overall)} ${v.overall}/100 (${v.grade})`);
  console.log(`\n  Verdict: ${v.recommendation}`);
  console.log(`\n  Profile: https://github.com/${profile.login}`);
  if (profile.email) console.log(`  Email:   ${profile.email}`);
  if (profile.blog) console.log(`  Website: ${profile.blog}`);
  if (profile.twitter_username) console.log(`  Twitter: @${profile.twitter_username}`);
  console.log('\n' + '═'.repeat(60) + '\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  Fetching profile for @${username}...`);

  let profile, repos, events;

  try {
    [profile, repos, events] = await Promise.all([
      get(`https://api.github.com/users/${username}`),
      getWithFallback(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
      getWithFallback(`https://api.github.com/users/${username}/events/public?per_page=100`),
    ]);
  } catch (err) {
    console.error(`\n  ${err.message}\n`);
    process.exit(1);
  }

  console.log(`  Running evaluation...\n`);

  const profileScore = scoreProfile(profile);
  const activityScore = scoreActivity(profile, events || []);
  const codeQualityScore = scoreCodeQuality(repos || []);
  const readmeScore = scoreReadme(repos || []);
  const collaborationScore = scoreCollaboration(profile, events || []);

  const scores = {
    profile: profileScore.score,
    activity: activityScore.score,
    codeQuality: codeQualityScore.score,
    readme: readmeScore.score,
    collaboration: collaborationScore.score,
  };

  const v = verdict(scores);

  const results = {
    username: profile.login,
    name: profile.name,
    verdict: v,
    profile: profileScore,
    activity: activityScore,
    codeQuality: codeQualityScore,
    readme: readmeScore,
    collaboration: collaborationScore,
  };

  if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printReport(profile, results);
  }
}

main().catch(err => {
  console.error(`\n  ${err.message}\n`);
  process.exit(1);
});
