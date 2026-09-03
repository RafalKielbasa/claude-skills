#!/usr/bin/env node
// Testy compile.js: buduje tymczasowy vault, uruchamia skrypt jako proces potomny
// i sprawdza pliki wynikowe. Uruchamiane (z dowolnego cwd):
//   node .claude/skills/compile-notes/test-compile.js
// Scenariusze są sekwencyjne i współdzielą jeden vault — kolejność ma znaczenie.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const COMPILE = path.join(__dirname, 'compile.js');
let passes = 0;
let failures = 0;

function check(name, cond, extra) {
  if (cond) {
    passes++;
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.log(`  FAIL - ${name}${extra ? ` :: ${extra}` : ''}`);
  }
}

function run(vault, args) {
  try {
    const out = execFileSync(process.execPath, [COMPILE, ...args], { cwd: vault, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { out, code: 0 };
  } catch (e) {
    return { out: `${e.stdout || ''}${e.stderr || ''}`, code: e.status === null ? -1 : e.status };
  }
}

function write(vault, rel, content) {
  const p = path.join(vault, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

const read = (vault, rel) => fs.readFileSync(path.join(vault, rel), 'utf8');
const exists = (vault, rel) => fs.existsSync(path.join(vault, rel));

const SLUG = 'nauka-temat';
const V = (n) => `eksport/${SLUG}-notebooklm-v${n}.md`;
const MANIFEST = `eksport/${SLUG}-notebooklm.manifest.json`;
const readManifest = (vault) => JSON.parse(read(vault, MANIFEST));

function note(tag, podsumowanie, szczegoly) {
  return `---\ntags: [${tag}]\n---\n\n## Podsumowanie\n\n${podsumowanie}\n\n## Szczegóły\n\n${szczegoly}\n\n## Powiązane\n\n- \n`;
}

function setupVault() {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'compile-notes-test-'));
  write(vault, 'nauka/temat/temat.md', `---\ntags: [nauka/temat]\n---\n\n## Notatki\n\n- [[alfa]] — pierwsza notatka\n- [[beta]] — druga notatka\n- [[pod]] — podfolder\n`);
  write(vault, 'nauka/temat/alfa.md', note('nauka/temat', 'Alfa to pojęcie pierwsze.', 'Szczegóły alfy.'));
  write(vault, 'nauka/temat/beta.md', note('nauka/temat', 'Beta to pojęcie drugie.', 'Szczegóły bety, powiązane z [[alfa]].'));
  write(vault, 'nauka/temat/pod/pod.md', `---\ntags: [nauka/temat]\n---\n\n## Notatki\n\n- [[gamma]] — notatka w podfolderze\n`);
  write(vault, 'nauka/temat/pod/gamma.md', note('nauka/temat', 'Gamma to pojęcie trzecie.', 'Szczegóły gammy.'));
  // Osierocony plik ze starej (niewersjonowanej) wersji skryptu.
  write(vault, `eksport/${SLUG}-notebooklm.md`, '# stary plik bez sufiksu wersji\n');
  return vault;
}

const scenarios = [];
const scenario = (name, fn) => scenarios.push({ name, fn });

// === Scenariusze ===

scenario('pierwszy bieg tworzy pełną v1 z manifestem i sprząta osierocony plik', (vault) => {
  const { out, code } = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', code === 0, out);
  check('istnieje plik v1', exists(vault, V(1)));
  const md = read(vault, V(1));
  check('nagłówek v1 pełna', md.includes('(v1, pełna)'));
  check('v1 zawiera wszystkie notatki', md.includes('Alfa to pojęcie') && md.includes('Beta to pojęcie') && md.includes('Gamma to pojęcie'));
  check('manifest istnieje', exists(vault, MANIFEST));
  const m = readManifest(vault);
  check('manifest: wersja 1', m.wersja === 1);
  check('manifest: folder', m.folder === 'nauka/temat');
  check('manifest: 3 notatki (bez hubów)', Object.keys(m.notatki).length === 3);
  check('manifest: klucze to ścieżki od korzenia', 'nauka/temat/alfa.md' in m.notatki && 'nauka/temat/pod/gamma.md' in m.notatki);
  check('osierocony plik usunięty', !exists(vault, `eksport/${SLUG}-notebooklm.md`));
  check('raport wymienia usunięty osierocony plik', out.includes(`${SLUG}-notebooklm.md`));
});

scenario('nieznana flaga kończy się błędem', (vault) => {
  const { out, code } = run(vault, ['nauka/temat', '--fulll']);
  check('kod wyjścia różny od 0', code !== 0);
  check('komunikat o nieznanej fladze', out.includes('nieznana flaga'));
});

scenario('edycja jednej notatki daje przyrostową v2 tylko z nią', (vault) => {
  write(vault, 'nauka/temat/beta.md', note('nauka/temat', 'Beta to pojęcie drugie, rozszerzone.', 'Szczegóły bety, powiązane z [[alfa]] oraz z [[czwarte-pojecie]].'));
  const { out, code } = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', code === 0, out);
  check('istnieje plik v2', exists(vault, V(2)));
  const md = read(vault, V(2));
  check('nagłówek v2 przyrostowa', md.includes('(v2, przyrostowa)'));
  check('v2 wymienia bazę v1', md.includes('od v1'));
  check('v2 zawiera betę', md.includes('rozszerzone'));
  check('v2 nie zawiera alfy ani gammy', !md.includes('Alfa to pojęcie') && !md.includes('Gamma to pojęcie'));
  check('link do niezmienionej alfy bez ostrzeżenia', !out.includes('[[alfa]]'));
  check('link poza poddrzewem z ostrzeżeniem', out.includes('[[czwarte-pojecie]]'));
  check('manifest podbity do wersji 2', readManifest(vault).wersja === 2);
});

scenario('nowa notatka w podfolderze wchodzi do v3', (vault) => {
  write(vault, 'nauka/temat/pod/delta.md', note('nauka/temat', 'Delta to pojęcie czwarte.', 'Szczegóły delty.'));
  const { out, code } = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', code === 0, out);
  check('istnieje plik v3', exists(vault, V(3)));
  const md = read(vault, V(3));
  check('v3 zawiera deltę', md.includes('Delta to pojęcie'));
  check('v3 zawiera nagłówek podfolderu', md.includes('## Pod'));
  check('v3 nie zawiera bety', !md.includes('Beta to pojęcie'));
  check('manifest: 4 notatki', Object.keys(readManifest(vault).notatki).length === 4);
});

scenario('zmiana samych tagów i bieg bez zmian nie tworzą pliku', (vault) => {
  const raw = read(vault, 'nauka/temat/alfa.md');
  write(vault, 'nauka/temat/alfa.md', raw.replace('tags: [nauka/temat]', 'tags: [nauka/temat, inne]'));
  const { out, code } = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', code === 0, out);
  check('komunikat o braku zmian', out.includes('Brak zmian od v3'));
  check('nie powstała v4', !exists(vault, V(4)));
  check('manifest nadal wersja 3', readManifest(vault).wersja === 3);
});

scenario('usunięcie notatki bez innych zmian aktualizuje manifest bez nowego pliku', (vault) => {
  fs.rmSync(path.join(vault, 'nauka/temat/pod/delta.md'));
  const first = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', first.code === 0, first.out);
  check('raport wymienia usuniętą notatkę', first.out.includes('nauka/temat/pod/delta.md'));
  check('nie powstała v4', !exists(vault, V(4)));
  const m = readManifest(vault);
  check('manifest bez usuniętej ścieżki', !('nauka/temat/pod/delta.md' in m.notatki));
  check('manifest nadal wersja 3', m.wersja === 3);
  const second = run(vault, ['nauka/temat']);
  check('kolejny bieg już nie raportuje usuniętej', !second.out.includes('delta.md'));
});

scenario('usunięcie plus edycja: delta zawiera edytowaną, usunięta tylko w raporcie', (vault) => {
  fs.rmSync(path.join(vault, 'nauka/temat/pod/gamma.md'));
  write(vault, 'nauka/temat/alfa.md', note('nauka/temat', 'Alfa to pojęcie pierwsze, zaktualizowane.', 'Nowe szczegóły alfy.'));
  const { out, code } = run(vault, ['nauka/temat']);
  check('kod wyjścia 0', code === 0, out);
  check('istnieje plik v4', exists(vault, V(4)));
  const md = read(vault, V(4));
  check('v4 zawiera alfę', md.includes('zaktualizowane'));
  check('v4 nie zawiera gammy', !md.includes('Gamma'));
  check('raport wymienia usuniętą gammę', out.includes('nauka/temat/pod/gamma.md'));
  const m = readManifest(vault);
  check('manifest wersja 4 bez gammy', m.wersja === 4 && !('nauka/temat/pod/gamma.md' in m.notatki));
});

scenario('--full zaczyna od nowa: nowa v1, stare wersje skasowane', (vault) => {
  const { out, code } = run(vault, ['nauka/temat', '--full']);
  check('kod wyjścia 0', code === 0, out);
  const md = read(vault, V(1));
  check('nowa v1 pełna z aktualną treścią', md.includes('(v1, pełna)') && md.includes('zaktualizowane'));
  check('stare v2-v4 skasowane', !exists(vault, V(2)) && !exists(vault, V(3)) && !exists(vault, V(4)));
  check('raport wymienia skasowane pliki', out.includes(`${SLUG}-notebooklm-v2.md`));
  const m = readManifest(vault);
  check('manifest zresetowany do wersji 1', m.wersja === 1);
  check('manifest: 2 notatki po resecie', Object.keys(m.notatki).length === 2);
});

// === Uruchomienie ===

function main() {
  const vault = setupVault();
  console.log(`Vault testowy: ${vault}`);
  for (const s of scenarios) {
    console.log(`\n== ${s.name}`);
    s.fn(vault);
  }
  console.log(`\nWynik: ${passes} ok, ${failures} porażek.`);
  fs.rmSync(vault, { recursive: true, force: true });
  process.exit(failures ? 1 : 0);
}

main();
