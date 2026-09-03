#!/usr/bin/env node
// Uruchamiane jako: node .claude/skills/compile-notes/compile.js <folder-względem-korzenia-vaulta> [--full]
// CWD musi być korzeniem vaulta.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KNOWN_SECTIONS = ['Podsumowanie', 'Szczegóły', 'Powiązane'];

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { tags: [], body: raw };
  const fmBlock = m[1];
  const body = raw.slice(m[0].length);
  const tagsMatch = fmBlock.match(/^tags:\s*\[(.*?)\]\s*$/m);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return { tags, body };
}

function noteHash(body) {
  const normalized = body.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const positional = args.filter((a) => !a.startsWith('--'));
  for (const f of flags) {
    if (f !== '--full') {
      console.error(`Błąd: nieznana flaga "${f}". Dostępna flaga: --full.`);
      process.exit(1);
    }
  }
  if (positional.length !== 1) {
    console.error(
      'Błąd: podaj ścieżkę folderu względem korzenia vaulta.\nUżycie: node .claude/skills/compile-notes/compile.js <folder> [--full]'
    );
    process.exit(1);
  }
  return { folderArg: positional[0], full: flags.includes('--full') };
}

function manifestPath(exportDir, slug) {
  return path.join(exportDir, `${slug}-notebooklm.manifest.json`);
}

function writeManifest(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadManifest(p) {
  if (!fs.existsSync(p)) return null;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(
      `Błąd: manifest "${path.basename(p)}" jest uszkodzony (niepoprawny JSON). Napraw go albo uruchom z flagą --full, żeby zacząć wersjonowanie od nowa.`
    );
    process.exit(1);
  }
  if (
    typeof data.wersja !== 'number' ||
    typeof data.wygenerowano !== 'string' ||
    typeof data.notatki !== 'object' ||
    data.notatki === null ||
    Array.isArray(data.notatki)
  ) {
    console.error(
      `Błąd: manifest "${path.basename(p)}" ma niepoprawną strukturę (brak pól wersja/notatki). Napraw go albo uruchom z flagą --full.`
    );
    process.exit(1);
  }
  return data;
}

function pruneTree(node, includedPaths) {
  const children = [];
  for (const child of node.children) {
    if (child.type === 'note') {
      if (includedPaths.has(child.note.relPath)) children.push(child);
    } else {
      const sub = pruneTree(child.folder, includedPaths);
      if (sub) children.push({ type: 'folder', folder: sub });
    }
  }
  if (children.length === 0) return null;
  return { name: node.name, depth: node.depth, children };
}

function splitByH2(body) {
  const headingRegex = /^##[ \t]+(.+?)[ \t]*$/gm;
  const headings = [];
  let m;
  while ((m = headingRegex.exec(body)) !== null) {
    headings.push({ name: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  const map = {};
  const order = [];
  for (let i = 0; i < headings.length; i++) {
    const contentStart = headings[i].end;
    const contentEnd = i + 1 < headings.length ? headings[i + 1].start : body.length;
    map[headings[i].name] = body.slice(contentStart, contentEnd).trim();
    order.push(headings[i].name);
  }
  return { order, map };
}

function parseSections(body) {
  const { order, map } = splitByH2(body);
  if (order.length === 0) return { standard: false, raw: body.trim() };
  const hasKnown = KNOWN_SECTIONS.some((k) => order.includes(k));
  if (!hasKnown) return { standard: false, raw: body.trim() };
  return {
    standard: true,
    podsumowanie: map['Podsumowanie'] || '',
    szczegoly: map['Szczegóły'] || '',
    powiazane: map['Powiązane'] || '',
  };
}

function parseHubEntries(body) {
  const { map } = splitByH2(body);
  const notatkiContent = map['Notatki'];
  if (notatkiContent === undefined) return [];
  const lines = notatkiContent.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries = [];
  const re = /^-\s*\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]\s*(?:[—-]\s*(.*))?$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      entries.push({
        target: m[1].trim(),
        alias: m[2] ? m[2].trim() : null,
        description: m[3] ? m[3].trim() : '',
      });
    }
  }
  return entries;
}

function parseHub(absFolderPath, hubFileName) {
  const hubPath = path.join(absFolderPath, hubFileName);
  if (!fs.existsSync(hubPath)) return null;
  const raw = fs.readFileSync(hubPath, 'utf8');
  const { body } = parseFrontmatter(raw);
  return { entries: parseHubEntries(body) };
}

function parseAtomicNote(absPath, ctx) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const { body } = parseFrontmatter(raw);
  const sections = parseSections(body);
  const id = path.basename(absPath, '.md');
  const relPath = path.relative(ctx.vaultRoot, absPath).split(path.sep).join('/');
  const hash = noteHash(body);
  if (!sections.standard) {
    ctx.warnings.push(
      `Notatka "${id}" nie ma formatu szablonu (brak sekcji Podsumowanie/Szczegóły/Powiązane) — dołączono całą treść bez podziału.`
    );
    return { id, relPath, hash, standard: false, raw: sections.raw };
  }
  const hasSzczegoly = !!sections.szczegoly.trim();
  if (!hasSzczegoly) {
    ctx.warnings.push(`Notatka "${id}" nie ma sekcji Szczegóły — dołączono samo Podsumowanie.`);
  }
  return {
    id,
    relPath,
    hash,
    standard: true,
    podsumowanie: sections.podsumowanie,
    szczegoly: sections.szczegoly,
    powiazane: sections.powiazane,
    hasSzczegoly,
  };
}

function resolveOrder(relFolder, hub, subdirNames, noteBaseNames, ctx) {
  const ordered = [];
  const usedNotes = new Set();
  const usedDirs = new Set();
  const totalChildren = subdirNames.length + noteBaseNames.length;

  if (hub && hub.entries.length > 0) {
    for (const entry of hub.entries) {
      const target = entry.target.split('/').pop();
      if (noteBaseNames.includes(target)) {
        ordered.push({ type: 'note', name: target });
        usedNotes.add(target);
      } else if (subdirNames.includes(target)) {
        ordered.push({ type: 'folder', name: target });
        usedDirs.add(target);
      } else {
        ctx.warnings.push(
          `Hub w "${relFolder}" odwołuje się do nieistniejącego celu "[[${entry.target}]]" — pominięto w kolejności.`
        );
      }
    }
  } else if (hub && hub.entries.length === 0) {
    if (totalChildren > 1) {
      ctx.warnings.push(
        `Hub w "${relFolder}" istnieje, ale nie zawiera wpisów — użyto kolejności alfabetycznej.`
      );
    }
  } else if (!hub) {
    if (totalChildren > 1) {
      ctx.warnings.push(`Brak huba w "${relFolder}" — użyto kolejności alfabetycznej.`);
    }
  }

  const hubHadEntries = !!(hub && hub.entries.length > 0);

  const leftoverNotes = noteBaseNames.filter((n) => !usedNotes.has(n)).sort((a, b) => a.localeCompare(b, 'pl'));
  for (const n of leftoverNotes) {
    ordered.push({ type: 'note', name: n });
    if (hubHadEntries) {
      ctx.warnings.push(
        `Notatka "${relFolder}/${n}" nie jest wymieniona w hubie — dodano na końcu (kolejność alfabetyczna).`
      );
    }
  }
  const leftoverDirs = subdirNames.filter((d) => !usedDirs.has(d)).sort((a, b) => a.localeCompare(b, 'pl'));
  for (const d of leftoverDirs) {
    ordered.push({ type: 'folder', name: d });
    if (hubHadEntries) {
      ctx.warnings.push(
        `Podfolder "${relFolder}/${d}" nie jest wymieniony w hubie — dodano na końcu (kolejność alfabetyczna).`
      );
    }
  }

  return ordered;
}

function walkFolder(absPath, depth, ctx) {
  const folderName = path.basename(absPath);
  const relFolder = path.relative(ctx.vaultRoot, absPath).split(path.sep).join('/');
  const hubFileName = folderName + '.md';

  const dirents = fs.readdirSync(absPath, { withFileTypes: true });
  const subdirNames = [];
  const noteBaseNames = [];
  for (const d of dirents) {
    if (d.name.startsWith('.')) continue;
    if (d.isDirectory()) {
      subdirNames.push(d.name);
    } else if (d.isFile() && d.name.endsWith('.md') && d.name !== hubFileName) {
      noteBaseNames.push(path.basename(d.name, '.md'));
    }
  }

  const hub = parseHub(absPath, hubFileName);
  const order = resolveOrder(relFolder, hub, subdirNames, noteBaseNames, ctx);

  const children = [];
  for (const item of order) {
    if (item.type === 'note') {
      const note = parseAtomicNote(path.join(absPath, item.name + '.md'), ctx);
      ctx.knownNoteIds.add(note.id);
      ctx.noteHashes[note.relPath] = note.hash;
      ctx.noteCount++;
      children.push({ type: 'note', note });
    } else {
      const sub = walkFolder(path.join(absPath, item.name), depth + 1, ctx);
      if (sub) children.push({ type: 'folder', folder: sub });
    }
  }

  if (children.length === 0) {
    if (depth > 0) {
      ctx.warnings.push(`Pominięto pusty folder "${relFolder}" (brak notatek i niepustych podfolderów).`);
    }
    return null;
  }
  ctx.folderCount++;
  return { name: folderName, depth, children };
}

function humanize(slug) {
  const base = slug.split('/').pop();
  return base
    .split('-')
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Segmentuje tekst na fragmenty kodu (bloki ``` ``` i inline `...`) i prozę —
// wikilinki podmieniamy tylko w prozie, żeby nie psuć dosłownej składni typu
// `[[...slug]]` (Next.js catch-all routes) zapisanej w code spanie.
const CODE_SEGMENT_RE = /(```[\s\S]*?```|`[^`\n]+`)/g;

function isCodeSegment(part) {
  return /^```[\s\S]*```$/.test(part) || /^`[^`\n]+`$/.test(part);
}

function convertWikilinksInProse(text, ctx, sourceId) {
  text = text.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, target) => `[pominięto załącznik: ${target.trim()}]`);
  text = text.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, target, alias) => {
    const t = target.trim();
    const base = t.split('/').pop();
    if (!ctx.knownNoteIds.has(base)) {
      ctx.warnings.push(
        `Notatka "${sourceId}" linkuje do "[[${t}]]", które nie jest częścią tej kompilacji — zamieniono na tekst.`
      );
    }
    return alias ? alias.trim() : humanize(t);
  });
  return text;
}

function convertWikilinks(text, ctx, sourceId) {
  if (!text) return text;
  return text
    .split(CODE_SEGMENT_RE)
    .map((part) => (isCodeSegment(part) ? part : convertWikilinksInProse(part, ctx, sourceId)))
    .join('');
}

function folderHeadingLevel(depth) {
  return Math.min(depth + 1, 4);
}

function noteHeadingLevel(containingDepth) {
  if (containingDepth === 0) return 3;
  return Math.min(folderHeadingLevel(containingDepth) + 1, 6);
}

function renderNote(note, containingDepth, ctx) {
  const level = noteHeadingLevel(containingDepth);
  let out = '#'.repeat(level) + ' ' + humanize(note.id) + '\n\n';
  if (!note.standard) {
    out += convertWikilinks(note.raw, ctx, note.id) + '\n\n';
    return out;
  }
  if (note.podsumowanie && note.podsumowanie.trim()) {
    out += convertWikilinks(note.podsumowanie, ctx, note.id) + '\n\n';
  }
  if (note.hasSzczegoly) {
    out += convertWikilinks(note.szczegoly, ctx, note.id) + '\n\n';
  }
  if (note.powiazane) {
    const items = note.powiazane
      .split('\n')
      .map((l) => l.replace(/^-\s*/, '').trim())
      .filter(Boolean)
      .map((l) => convertWikilinks(l, ctx, note.id));
    if (items.length) out += `Powiązane tematy: ${items.join(', ')}\n\n`;
  }
  return out;
}

function renderFolder(node, ctx, isRoot) {
  let out = '';
  if (!isRoot) out += '#'.repeat(folderHeadingLevel(node.depth)) + ' ' + humanize(node.name) + '\n\n';
  for (const child of node.children) {
    out += child.type === 'note' ? renderNote(child.note, node.depth, ctx) : renderFolder(child.folder, ctx, false);
  }
  return out;
}

function slugify(relPath) {
  return relPath
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .join('-');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const { folderArg, full } = parseArgs(process.argv);
  const vaultRoot = process.cwd();

  const relArgNormalized = folderArg.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const absPath = path.resolve(vaultRoot, relArgNormalized);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
    console.error(`Błąd: folder "${relArgNormalized}" nie istnieje w vaultcie.`);
    process.exit(1);
  }

  const ctx = { vaultRoot, warnings: [], noteCount: 0, folderCount: 0, knownNoteIds: new Set(), noteHashes: {} };
  const tree = walkFolder(absPath, 0, ctx);

  if (!tree) {
    console.error(
      `Błąd: folder "${relArgNormalized}" nie zawiera żadnych notatek .md do skompilowania (pusty albo tylko z hubem).`
    );
    process.exit(1);
  }

  const slug = slugify(relArgNormalized);
  const exportDir = path.join(vaultRoot, 'eksport');
  fs.mkdirSync(exportDir, { recursive: true });
  const mPath = manifestPath(exportDir, slug);

  const manifest = full ? null : loadManifest(mPath);

  const title = humanize(relArgNormalized);
  const dateStr = new Date().toISOString().slice(0, 10);
  const current = ctx.noteHashes;

  let version, renderTree, header;
  let noweCount = 0;
  let zmienioneCount = 0;
  let removed = [];

  if (!manifest) {
    version = 1;
    renderTree = tree;
    header = `# ${title} — kompilacja do NotebookLM (v1, pełna)\n\n_Wygenerowano: ${dateStr}_\n\n`;
  } else {
    const prev = manifest.notatki;
    const nowe = Object.keys(current).filter((p) => !(p in prev));
    removed = Object.keys(prev).filter((p) => !(p in current));
    const zmienione = Object.keys(current).filter((p) => p in prev && prev[p] !== current[p]);
    noweCount = nowe.length;
    zmienioneCount = zmienione.length;
    const included = new Set([...nowe, ...zmienione]);

    if (included.size === 0) {
      if (removed.length > 0) {
        writeManifest(mPath, {
          folder: manifest.folder,
          wersja: manifest.wersja,
          wygenerowano: manifest.wygenerowano,
          notatki: current,
        });
        console.log(
          `Notatki usunięte od v${manifest.wersja}: ${removed.join(', ')} — zaktualizowano manifest (delta nie usuwa treści z NotebookLM).`
        );
      }
      console.log(`Brak zmian od v${manifest.wersja} (${manifest.wygenerowano}) — nie utworzono nowego pliku.`);
      return;
    }

    version = manifest.wersja + 1;
    renderTree = pruneTree(tree, included);
    header = `# ${title} — kompilacja do NotebookLM (v${version}, przyrostowa)\n\n_Wygenerowano: ${dateStr} — notatki nowe i zmienione od v${manifest.wersja} (${manifest.wygenerowano})._\n\n`;
  }

  const markdown = header + renderFolder(renderTree, ctx, true);

  const outPath = path.join(exportDir, `${slug}-notebooklm-v${version}.md`);

  const removedFiles = [];
  if (version === 1) {
    const legacyPath = path.join(exportDir, `${slug}-notebooklm.md`);
    if (fs.existsSync(legacyPath)) {
      fs.unlinkSync(legacyPath);
      removedFiles.push(path.basename(legacyPath));
    }
    if (full) {
      const re = new RegExp(`^${escapeRegExp(slug)}-notebooklm-v\\d+\\.md$`);
      for (const name of fs.readdirSync(exportDir)) {
        if (re.test(name) && name !== path.basename(outPath)) {
          fs.unlinkSync(path.join(exportDir, name));
          removedFiles.push(name);
        }
      }
    }
  }

  fs.writeFileSync(outPath, markdown, 'utf8');
  writeManifest(mPath, { folder: relArgNormalized, wersja: version, wygenerowano: dateStr, notatki: current });

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  if (version === 1) {
    console.log(`Pełna kompilacja v1: ${ctx.noteCount} notatek z ${ctx.folderCount} folderów.`);
  } else {
    console.log(
      `Kompilacja przyrostowa v${version}: ${noweCount} nowych, ${zmienioneCount} zmienionych (od v${manifest.wersja} z ${manifest.wygenerowano}).`
    );
  }
  console.log(`Plik wyjściowy: ${path.relative(vaultRoot, outPath).split(path.sep).join('/')}`);
  console.log(`Liczba słów: ${wordCount}`);
  if (removed.length > 0) {
    console.log(
      `Notatki usunięte od poprzedniej wersji (tylko w raporcie, delta nie usuwa treści z NotebookLM): ${removed.join(', ')}`
    );
  }
  if (removedFiles.length > 0) {
    console.log(`Usunięto przestarzałe pliki z eksport/: ${removedFiles.join(', ')}`);
  }
  if (ctx.warnings.length) {
    console.log(`\nOstrzeżenia (${ctx.warnings.length}):`);
    ctx.warnings.forEach((w) => console.log(`- ${w}`));
  } else {
    console.log('\nBrak ostrzeżeń.');
  }
}

main();
