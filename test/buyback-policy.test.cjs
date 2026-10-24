const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
test('politique datée et financement personnel explicités sur les deux surfaces', () => {
  for (const text of [html, llms]) {
    assert.match(text, /24 octobre 2026/);
    assert.match(text, /3 000 FB personnels stakés par Arthefacte/);
    assert.match(text, /revenus réellement reçus/);
    assert.match(text, /prochain rachat attend/);
    assert.match(text, /nouveaux verrouillages à vie de liquidité sont en pause/);
    assert.match(text, /sans ajout systématique de liquidité/);
  }
});
test('aucune promesse de LP-lock automatique ou de rachat immédiat', () => {
  for (const text of [html, llms]) {
    assert.doesNotMatch(text, /LP-lock|rachat imminent|Verrouillé à vie au seuil|puis le verrouille à vie|puis est verrouillé à vie/);
  }
  assert.match(html, /Seuil atteint — rachat selon le budget disponible du staking/);
  assert.match(html, /id="buyback-budget-policy"/);
});
test('seuils et sources live conservés', () => {
  for (const id of ['pl-total-bought','pl-p0','pl-p1','pl-p2','pl-dex']) assert.ok(html.includes(`id="${id}"`));
  for (const threshold of ['50 000','100 000','200 000']) assert.ok(html.includes(threshold));
  assert.match(html, /trois poches à parts égales/);
  assert.match(html, /\/dex\/status/);
  assert.match(llms, /ne décrit pas un plafond budgétaire automatisé/);
});
test('scripts intégrés et JSON-LD syntaxiquement valides', () => {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/src\s*=/.test(match[1])) continue;
    if (/application\/ld\+json/.test(match[1])) JSON.parse(match[2]);
    else if (!/type\s*=/.test(match[1])) new vm.Script(match[2]);
  }
});
