#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const GH_TOKEN = process.env.GH_TOKEN;
const args = process.argv.slice(2);

if (!GH_TOKEN) { console.error('\n  Missing GH_TOKEN.\n'); process.exit(1); }

const stackIndex = args.indexOf('--stack');
if (stackIndex === -1 || !args[stackIndex + 1]) {
  console.error('\n  Usage: GH_TOKEN=<token> node recruit.js --stack <tech,tech> [options]\n');
  process.exit(1);
}

const stack         = args[stackIndex + 1].split(',').map(s => s.trim().toLowerCase());
const topRepos      = parseInt(args[args.indexOf('--top-repos') + 1]) || 3;
const topPerRepo    = parseInt(args[args.indexOf('--top-contributors') + 1]) || 10;
const minStars      = parseInt(args[args.indexOf('--min-stars') + 1]) || 500;
const skipProfile   = args.includes('--skip-profile');
const exportCsv     = args.includes('--csv');

const STACK_MAP = {
  javascript:   { topics: ['javascript', 'js'] },
  typescript:   { topics: ['typescript', 'ts'] },
  nodejs:       { topics: ['nodejs', 'node-js', 'node'] },
  node:         { topics: ['nodejs', 'node-js'] },
  react:        { topics: ['react', 'reactjs', 'react-native'] },
  vue:          { topics: ['vue', 'vuejs', 'vue3'] },
  svelte:       { topics: ['svelte', 'sveltekit'] },
  nextjs:       { topics: ['nextjs', 'next-js'] },
  express:      { topics: ['express', 'expressjs'] },
  redux:        { topics: ['redux', 'state-management'] },
  python:       { topics: ['python', 'python3'] },
  django:       { topics: ['django'] },
  fastapi:      { topics: ['fastapi'] },
  go:           { topics: ['go', 'golang'] },
  golang:       { topics: ['golang', 'go'] },
  rust:         { topics: ['rust', 'rust-lang'] },
  java:         { topics: ['java', 'spring-boot'] },
  kotlin:       { topics: ['kotlin', 'android'] },
  swift:        { topics: ['swift', 'swiftui', 'ios'] },
  web3:         { topics: ['web3', 'blockchain', 'ethereum'] },
  ethereum:     { topics: ['ethereum', 'solidity', 'evm'] },
  solidity:     { topics: ['solidity', 'smart-contracts'] },
  solana:       { topics: ['solana', 'anchor'] },
  bitcoin:      { topics: ['bitcoin', 'lightning-network'] },
  defi:         { topics: ['defi', 'decentralized-finance'] },
  kubernetes:   { topics: ['kubernetes', 'k8s'] },
  docker:       { topics: ['docker', 'containers'] },
  terraform:    { topics: ['terraform', 'infrastructure-as-code'] },
  ml:           { topics: ['machine-learning', 'deep-learning'] },
  ai:           { topics: ['artificial-intelligence', 'machine-learning'] },
  pytorch:      { topics: ['pytorch', 'deep-learning'] },
  tensorflow:   { topics: ['tensorflow', 'keras'] },
};

function get(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'github-recruit-cli',
        'Authorization': 'Bearer ' + GH_TOKEN,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) return reject(new Error('Unauthorized (401). Check your GH_TOKEN.'));
        if (res.statusCode === 403) return reject(new Error('Rate limited (403). Wait a moment and try again.'));
        if (res.statusCode === 404 || res.statusCode === 204) return resolve(null);
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function daysSince(d) { if (!d) return 9999; return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }
function yearsSince(d) { if (!d) return '?'; return ((Date.now() - new Date(d).getTime()) / (86400000 * 365)).toFixed(1) + 'y'; }
function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
function formatNum(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
function pad(s, l) { const x = String(s ?? ''); return x.length > l ? x.slice(0,l-1)+'...' : x.padEnd(l); }
function grade(s) { return s>=85?'A':s>=65?'B':s>=50?'C':s>=35?'D':'F'; }
function isBot(c) {
  const l = c.login.toLowerCase();
  return c.type==='Bot'||l.includes('[bot]')||l.endsWith('-bot')||l.endsWith('_bot')||l==='dependabot'||l==='renovate';
}

function scoreRepo(repo) {
  let s = 0;
  s += Math.min(Math.log10(repo.stargazers_count+1)*10, 40);
  s += Math.min(Math.log10(repo.forks_count+1)*7, 20);
  const d = daysSince(repo.pushed_at);
  if (d<=7) s+=25; else if (d<=30) s+=20; else if (d<=90) s+=15; else if (d<=180) s+=8; else if (d<=365) s+=3;
  if (repo.description && repo.description.length>10) s+=5;
  const overlap = stack.filter(t => (repo.topics||[]).some(rt => rt.includes(t)||t.includes(rt)));
  s += Math.min(overlap.length*3, 10);
  return Math.round(s);
}

function sourcerScore(profile, contributions) {
  let s = 0;
  s += Math.min(contributions/10, 40);
  s += Math.min((profile.followers||0)/5, 20);
  s += Math.min((profile.public_repos||0)/2, 15);
  s += profile.email ? 10 : 0;
  s += profile.blog ? 5 : 0;
  s += profile.twitter_username ? 5 : 0;
  s += profile.hireable ? 10 : 0;
  return Math.round(Math.min(s, 100));
}

function profileScore(profile, repos, events) {
  let s = 0;
  if (profile.name) s+=5;
  if (profile.bio && profile.bio.length>10) s+=5;
  if (profile.email) s+=10;
  if (profile.blog) s+=5;
  if (profile.twitter_username) s+=5;
  const age = parseFloat(yearsSince(profile.created_at));
  if (age>=5) s+=10; else if (age>=2) s+=5;
  if ((profile.public_repos||0)>=20) s+=10; else if ((profile.public_repos||0)>=5) s+=5;
  if (events && events.length>0) {
    const d = daysSince(events[0].created_at);
    if (d<=14) s+=10; else if (d<=90) s+=5;
  }
  if (repos && repos.length>0) {
    const own = repos.filter(r => !r.fork);
    const stars = own.reduce((x,r)=>x+r.stargazers_count,0);
    if (stars>=100) s+=10; else if (stars>=20) s+=5;
    if (repos.length>0 && own.length/repos.length>=0.5) s+=5;
    const withDesc = own.filter(r=>r.description&&r.description.length>10);
    if (own.length>0 && withDesc.length/own.length>=0.5) s+=5;
  }
  if (events && events.length>0) {
    if (events.filter(e=>e.type==='PullRequestReviewEvent').length>=2) s+=8;
    if (events.filter(e=>e.type==='PullRequestEvent').length>=2) s+=6;
    if (events.filter(e=>e.type==='IssuesEvent'||e.type==='IssueCommentEvent').length>=2) s+=6;
  }
  return clamp(Math.round(s), 0, 100);
}

function combinedScore(c) {
  const repoBonus = Math.min((c.appearsInRepos.length-1)*5, 15);
  return Math.round((c.sourcerScore||0)*0.4 + (c.profileScore||0)*0.5 + repoBonus);
}

async function findRepos() {
  const queries = new Map();
  for (const term of stack) {
    const mapping = STACK_MAP[term];
    const topics = mapping ? mapping.topics : [term];
    for (const topic of topics) {
      const key = 'topic:'+topic;
      if (!queries.has(key)) queries.set(key, key);
    }
  }
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear()-1);
  const cutoff = oneYearAgo.toISOString().split('T')[0];
  const seen = new Set();
  const all = [];
  const list = [...queries.values()].slice(0,6);
  for (let i=0;i<list.length;i++) {
    process.stdout.write('  [1/4] Finding repos ('+(i+1)+'/'+list.length+'): '+list[i]+'...    \r');
    const q = list[i]+'+stars:>'+minStars+'+pushed:>'+cutoff+'+fork:false';
    const data = await get('https://api.github.com/search/repositories?q='+q+'&sort=stars&order=desc&per_page=10').catch(()=>null);
    for (const repo of (data?.items||[])) {
      if (!seen.has(repo.id)) { seen.add(repo.id); all.push(repo); }
    }
    await sleep(400);
  }
  return all.map(r=>({...r,score:scoreRepo(r)})).sort((a,b)=>b.score-a.score).slice(0,topRepos);
}

async function getContributors(repo) {
  const data = await get('https://api.github.com/repos/'+repo+'/contributors?per_page='+(topPerRepo+5)+'&anon=false').catch(()=>null);
  if (!Array.isArray(data)) return [];
  return data.filter(c=>!isBot(c)).slice(0,topPerRepo);
}

function printShortlist(results, repos) {
  const div = '-'.repeat(100);
  console.log('\n' + '='.repeat(100));
  console.log('  OUTREACH SHORTLIST');
  console.log('  Stack: '+stack.join(', ')+'  |  Sourced from: '+repos.map(r=>r.full_name).join(', '));
  console.log('='.repeat(100));
  console.log('\n'+pad('#',4)+pad('Username',20)+pad('Name',20)+pad('Score',9)+pad('Grade',7)+pad('Email',28)+pad('Repos',6)+'Links');
  console.log(div);
  for (const r of results) {
    const links = [r.blog?r.blog.replace(/^https?:\/\//,''):'', r.twitter_username?'@'+r.twitter_username:''].filter(Boolean).join(' | ');
    console.log(pad(r.rank,4)+pad(r.username,20)+pad(r.name||'',20)+pad(r.combined+'/100',9)+pad(grade(r.combined),7)+pad(r.email||'',28)+pad(r.appearsInRepos.length,6)+links);
  }
  console.log(div);
  console.log('\n  TOP PICKS\n');
  for (const r of results.slice(0,3)) {
    console.log('  '+r.rank+'. @'+r.username+(r.name?' ('+r.name+')':'')+' — '+r.combined+'/100 ('+grade(r.combined)+')');
    if (r.email)             console.log('     Email:   '+r.email);
    if (r.blog)              console.log('     Website: '+r.blog);
    if (r.twitter_username)  console.log('     Twitter: @'+r.twitter_username);
    if (r.location)          console.log('     Location:'+r.location);
    console.log('     Profile: https://github.com/'+r.username);
    console.log('     Active in: '+r.appearsInRepos.join(', '));
    console.log('');
  }
  console.log('='.repeat(100)+'\n');
}

function exportToCsv(results) {
  const filename = 'recruit-'+stack.join('-')+'.csv';
  const headers = ['Rank','Username','Name','Score','Grade','Email','Website','Twitter','Location','Repos','Repo Count','Followers','GitHub URL'];
  const rows = results.map(r=>[r.rank,r.username,r.name||'',r.combined,grade(r.combined),r.email||'',r.blog||'',r.twitter_username?'@'+r.twitter_username:'',r.location||'',r.appearsInRepos.join(' | '),r.appearsInRepos.length,r.followers||0,'https://github.com/'+r.username]);
  const csv = [headers,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  fs.writeFileSync(filename, csv, 'utf8');
  console.log('  Exported to '+filename+'\n');
}

async function main() {
  console.log('\n  Starting recruitment pipeline for: '+stack.join(', '));
  console.log('  Repos: '+topRepos+' | Contributors per repo: '+topPerRepo+' | Min stars: '+formatNum(minStars)+'\n');

  const repos = await findRepos();
  process.stdout.write(' '.repeat(70)+'\r');
  if (repos.length===0) { console.error('  No repos found. Try lowering --min-stars.\n'); process.exit(1); }
  console.log('  [1/4] Repos found: '+repos.map(r=>r.full_name).join(', '));

  const contributorMap = new Map();
  for (let i=0;i<repos.length;i++) {
    const repo = repos[i];
    process.stdout.write('  [2/4] Contributors from '+repo.full_name+' ('+(i+1)+'/'+repos.length+')...    \r');
    const contributors = await getContributors(repo.full_name);
    for (const c of contributors) {
      if (contributorMap.has(c.login)) {
        const ex = contributorMap.get(c.login);
        ex.appearsInRepos.push(repo.full_name);
        ex.totalContributions += c.contributions;
      } else {
        contributorMap.set(c.login, { username:c.login, totalContributions:c.contributions, appearsInRepos:[repo.full_name] });
      }
    }
    await sleep(300);
  }
  process.stdout.write(' '.repeat(70)+'\r');
  const unique = [...contributorMap.values()].sort((a,b)=>b.appearsInRepos.length-a.appearsInRepos.length||b.totalContributions-a.totalContributions);
  console.log('  [2/4] '+unique.length+' unique contributors found.');

  const enriched = [];
  const toEnrich = unique.slice(0,30);
  for (let i=0;i<toEnrich.length;i++) {
    const c = toEnrich[i];
    process.stdout.write('  [3/4] Enriching ('+(i+1)+'/'+toEnrich.length+'): @'+c.username+'...    \r');
    let profile={}, repos2=[], events=[];
    try {
      [profile, repos2, events] = await Promise.all([
        get('https://api.github.com/users/'+c.username).catch(()=>({})),
        get('https://api.github.com/users/'+c.username+'/repos?per_page=50&sort=updated').catch(()=>[]),
        get('https://api.github.com/users/'+c.username+'/events/public?per_page=50').catch(()=>[]),
      ]);
    } catch(e) {}
    enriched.push({
      ...c,
      name: profile?.name,
      email: profile?.email,
      blog: profile?.blog,
      twitter_username: profile?.twitter_username,
      location: profile?.location,
      followers: profile?.followers,
      public_repos: profile?.public_repos,
      hireable: profile?.hireable,
      sourcerScore: sourcerScore(profile||{}, c.totalContributions),
      profileScore: skipProfile ? 0 : profileScore(profile||{}, repos2||[], events||[]),
    });
    await sleep(200);
  }
  process.stdout.write(' '.repeat(70)+'\r');
  console.log('  [3/4] Profiles enriched.');

  const ranked = enriched
    .map(c=>({...c, combined:combinedScore(c)}))
    .sort((a,b)=>b.combined-a.combined)
    .map((c,i)=>({...c, rank:i+1}));
  console.log('  [4/4] Ranked '+ranked.length+' candidates.\n');

  printShortlist(ranked, repos);
  if (exportCsv) exportToCsv(ranked);
}

main().catch(err=>{ console.error('\n  '+err.message+'\n'); process.exit(1); });
