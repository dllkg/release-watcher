// check.mjs — 定时比对各仓库最新版本，有更新推送到 Server酱
// feeds.json 格式: [ { "owner": "Rem0o", "repo": "FanControl.Releases", "type": "release" } ]
// type: "release" | "tag" | "commit"
import { readFileSync, writeFileSync, existsSync } from 'fs';

const SENDKEY = process.env.SENDKEY;
if (!SENDKEY) { console.error('缺少 SENDKEY'); process.exit(1); }
const PAT = process.env.GH_TOKEN;
const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'gh-release-watcher' };
if (PAT) headers['Authorization'] = `Bearer ${PAT}`;

const feeds = JSON.parse(readFileSync('feeds.json', 'utf-8'));
const state = existsSync('state.json') ? JSON.parse(readFileSync('state.json', 'utf-8')) : {};

const api = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

const shorten = s => (s || '').length > 180 ? s.slice(0, 180) + '…' : (s || '');

const changes = [];
for (const f of feeds) {
  const key = `${f.owner}/${f.repo}:${f.type || 'release'}`;
  try {
    let current, title, url;
    if ((f.type || 'release') === 'release') {
      const d = await api(`https://api.github.com/repos/${f.owner}/${f.repo}/releases/latest`);
      current = d.tag_name || d.name; title = `${f.owner}/${f.repo} 新版本：${current}`; url = d.html_url;
    } else if (f.type === 'tag') {
      const d = await api(`https://api.github.com/repos/${f.owner}/${f.repo}/tags?per_page=1`);
      if (!d.length) continue;
      current = d[0].name; title = `${f.owner}/${f.repo} 新标签：${current}`; url = `https://github.com/${f.owner}/${f.repo}/releases/tag/${current}`;
    } else {
      const d = await api(`https://api.github.com/repos/${f.owner}/${f.repo}/commits?per_page=1`);
      if (!d.length) continue;
      current = d[0].sha.slice(0, 10); title = `${f.owner}/${f.repo} 新提交：${current}`; url = d[0].html_url;
    }
    if (!current) continue;
    if (state[key] && state[key] !== current) changes.push({ title, url, prev: state[key], cur: current });
    state[key] = current;
    console.log(`${key}: ${current}${state[key] === current && changes.find(c => c.title === title) ? ' [CHANGED]' : ''}`);
  } catch (e) {
    console.error(`${key} 检查失败: ${e.message}`);
  }
}

writeFileSync('state.json', JSON.stringify(state, null, 2));

if (changes.length) {
  const desp = changes.map(c => `【${c.title}】\n${c.url}\n上一版本: ${c.prev}`).join('\n\n');
  const r = await fetch(`https://sctapi.ftqq.com/${SENDKEY}.send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `title=${encodeURIComponent('📦 ' + changes.length + ' 个仓库有更新')}&desp=${encodeURIComponent(desp)}`
  });
  console.log('推送结果:', r.status, await r.text());
} else {
  console.log('无更新');
}
