/* Garde-fou conformité : les pages légales doivent rester présentes, liées,
   autonomes (aucune ressource externe) et exemptes de texte provisoire.
   Lancement : node --test test/legal-pages.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const PAGES = ['mentions-legales.html', 'confidentialite.html', 'cgu.html'];

test('les trois pages légales existent et sont liées depuis la vitrine', () => {
  const index = read('index.html');
  for (const page of PAGES) {
    assert.ok(fs.existsSync(path.join(root, page)), `${page} manquante`);
    assert.ok(index.includes(`href="${page}"`), `${page} non liée depuis index.html`);
  }
});

test('chaque page légale est autonome : aucune ressource externe, aucun script', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.match(html, /script-src 'none'/, `${page} : CSP doit interdire les scripts`);
    assert.match(html, /default-src 'self'/);
    assert.doesNotMatch(html, /(?:href|src)="https?:\/\/fonts\.(?:googleapis|gstatic)\.com/,
      `${page} : aucune police tierce chargée`);
    assert.doesNotMatch(html, /google-analytics|googletagmanager|<script/i, `${page} : aucune balise script attendue`);
    assert.doesNotMatch(html, /<form/i);
    const externes = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !u.startsWith('https://arthefacte.com'));
    // uniquement des liens sortants cliquables (pas de sous-ressource distante)
    for (const u of externes) {
      assert.match(html, new RegExp(`<a [^>]*href="${u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
        `${page} : ${u} doit être un simple lien <a>, pas une sous-ressource`);
    }
  }
});

test('la vitrine ne charge plus aucune police tierce', () => {
  const index = read('index.html');
  assert.doesNotMatch(index, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(index, /href="assets\/fonts\.css"/);
  assert.match(index, /style-src 'self' 'unsafe-inline'(;|")/);
  assert.match(index, /font-src 'self'/);
  for (const f of ['assets/fonts.css',
                   'assets/fonts/orbitron-latin.woff2',
                   'assets/fonts/rajdhani-400-latin.woff2']) {
    assert.ok(fs.existsSync(path.join(root, f)), `${f} manquant`);
  }
});

test('mentions légales : éditeur, hébergeur et absence d\'adresse justifiée', () => {
  const html = read('mentions-legales.html');
  assert.match(html, /contact@arthefacte\.com/);
  assert.match(html, /2004-575|LCEN/);
  assert.match(html, /6-III-2/);
  assert.match(html, /GitHub, Inc\./);
  assert.match(html, /88 Colin P\. Kelly Jr\. Street/);
  assert.match(html, /directeur de la publication/i);
});

test('confidentialité : RGPD, CNIL, cookies et transferts hors UE traités', () => {
  const html = read('confidentialite.html');
  assert.match(html, /2016\/679|RGPD/);
  assert.match(html, /CNIL/);
  assert.match(html, /3 place de Fontenoy/);
  assert.match(html, /aucun cookie/i);
  assert.match(html, /hors (de l'|de l’)?Union européenne/i);
  assert.match(html, /art\. 6\.1\.f/);
});

test('CGU : avertissement actifs numériques et renvoi aux conditions du jeu', () => {
  const html = read('cgu.html');
  assert.match(html, /actif numérique/i);
  assert.match(html, /perte totale|risque de perte/i);
  assert.match(html, /fractalarena\.com/);
  assert.match(html, /droit français/i);
  assert.match(html, /conseil en investissement/i);
});

test('aucun texte provisoire dans les pages légales', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.doesNotMatch(html, /TODO|FIXME|Lorem ipsum|\[à compléter\]|XXX|SIREN à venir/i,
      `${page} contient un marqueur provisoire`);
  }
});

test('le sitemap déclare les pages légales', () => {
  const sitemap = read('sitemap.xml');
  for (const page of PAGES) assert.ok(sitemap.includes(page), `${page} absente du sitemap`);
});
