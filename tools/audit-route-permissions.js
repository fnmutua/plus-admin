const fs = require('fs');

const src = fs.readFileSync('src/router/index.ts', 'utf8');
const adminStart = src.indexOf('export const adminRoutes');
const adminEnd = src.indexOf('const router = createRouter');
const block = src.slice(adminStart, adminEnd);

function extractRoutes(text, parentPath = '') {
  const routes = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('{', i);
    if (start === -1) break;

    let depth = 0;
    let end = start;
    for (let j = start; j < text.length; j++) {
      if (text[j] === '{') depth++;
      if (text[j] === '}') depth--;
      if (depth === 0) {
        end = j;
        break;
      }
    }

    const chunk = text.slice(start, end + 1);
    const pathMatch = chunk.match(/path:\s*['"`]([^'"`]+)['"`]/);
    const nameMatch = chunk.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const titleMatch = chunk.match(/title:\s*(?:t\()?['"`]([^'"`]+)['"`]/);
    const hasPerms = /permissions:\s*\[/.test(chunk) || /permissions:\s*['"`]/.test(chunk);
    const hidden = /hidden:\s*true/.test(chunk);
    const childrenIdx = chunk.indexOf('children:');

    if (pathMatch && nameMatch) {
      const fullPath = [parentPath, pathMatch[1]].filter(Boolean).join('/').replace(/\/+/g, '/');
      routes.push({
        name: nameMatch[1],
        path: fullPath,
        title: titleMatch ? titleMatch[1] : nameMatch[1],
        hasPerms,
        hidden,
      });

      if (childrenIdx !== -1) {
        const childrenStart = chunk.indexOf('[', childrenIdx);
        let cDepth = 0;
        let childrenEnd = childrenStart;
        for (let k = childrenStart; k < chunk.length; k++) {
          if (chunk[k] === '[') cDepth++;
          if (chunk[k] === ']') cDepth--;
          if (cDepth === 0) {
            childrenEnd = k;
            break;
          }
        }
        const childrenBlock = chunk.slice(childrenStart + 1, childrenEnd);
        routes.push(...extractRoutes(childrenBlock, fullPath));
      }
    }

    i = end + 1;
  }
  return routes;
}

const all = extractRoutes(block);
const unique = [];
const seen = new Set();
for (const r of all) {
  const key = r.name + '|' + r.path;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(r);
}

const missing = unique.filter((r) => !r.hasPerms);
console.log(`Total routes: ${unique.length}`);
console.log(`With permissions: ${unique.filter((r) => r.hasPerms).length}`);
console.log(`Missing permissions: ${missing.length}\n`);

const groups = {};
for (const r of missing) {
  const top = r.path.split('/').filter(Boolean)[0] || 'root';
  groups[top] = groups[top] || [];
  groups[top].push(r);
}

for (const [group, routes] of Object.entries(groups).sort()) {
  console.log(`## /${group}`);
  for (const r of routes) {
    console.log(`  ${r.hidden ? '[hidden]' : '[visible]'} ${r.name} — ${r.path} (${r.title})`);
  }
  console.log('');
}
