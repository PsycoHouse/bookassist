import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace(/start\(\)\.catch[^\n]+/, '');
function setup() {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      classList: { add() {}, remove() {}, toggle() {}, contains() { return true; } },
      elements: { namedItem(name) { return elements.get(`field:${name}`); } },
      reset() {}, showModal() { this.open = true; }, close() { this.open = false; },
      querySelector() { return this.add; }, querySelectorAll() { return this.edits || []; },
      set innerHTML(html) {
        this.html = html;
        this.add = html.includes('data-view-add') ? {} : null;
        this.edits = [...html.matchAll(/data-edit="([^"]+)" data-id="([^"]*)"/g)].map(m => ({ dataset: { edit: m[1], id: m[2] } }));
        if (selector === '#form-fields') for (const m of html.matchAll(/name="([^"]+)"/g)) elements.set(`field:${m[1]}`, { value: '' });
      }
    });
    return elements.get(selector);
  };
  const context = vm.createContext({ document: { querySelector: element, querySelectorAll: () => [] },
    setTimeout: () => 1, clearTimeout() {}, console, Intl, Date, uid: () => 'new-id',
    FormData: class { constructor(data) { return Object.entries(data); } }, saveProject: async () => {},
  });
  vm.runInContext(source, context);
  const project = { id: 'project', chapters: [], notes: [{ id: 'note', text: 'Idee', status: 'unsortiert', createdAt: '2026-10-01', tags: ['keep'] }], characters: [{ id: 'character', name: 'Ada', background: 'Herkunft', custom: 'keep' }], plotThreads: [], timeline: [], memory: { bookSummary: 'Alt', importantFacts: ['keep'] } };
  context.fixture = project;
  vm.runInContext('project = fixture', context);
  const submit = data => element('#generic-form').onsubmit({ preventDefault() {}, target: data });
  const view = name => { vm.runInContext(`renderDataView('${name}')`, context); return element(`#${name}-view`); };
  return { element, project, view, submit };
}

test('Plot Thread opens from Story after other views were rendered and saves a new thread', () => {
  const { element, project, view, submit } = setup();
  const notes = view('notes');
  const characters = view('characters');
  view('story').add.onclick();
  assert.equal(element('#form-title').textContent, 'Plot Thread erstellen');
  assert.equal(element('#form-dialog').open, true);
  submit({ name: 'Rätsel', status: 'offen', description: 'Wer?', resolvedChapter: '' });
  assert.equal(project.plotThreads[0].name, 'Rätsel');
  assert.equal(project.notes.length, 1);
  assert.equal(project.characters.length, 1);
  assert.equal(typeof notes.add.onclick, 'function');
  assert.equal(typeof characters.add.onclick, 'function');
  assert.equal(element('#form-dialog').open, false);
  view('story').edits[0].onclick();
  assert.equal(element('field:name').value, 'Rätsel');
  submit({ name: 'Antwort', status: 'gelöst' });
  assert.equal(project.plotThreads.length, 1);
  assert.equal(project.plotThreads[0].status, 'gelöst');
});

test('figure and thought editing prefill fields and preserve identity and extra data', () => {
  const { element, project, view, submit } = setup();
  view('characters').edits[0].onclick();
  assert.equal(element('field:name').value, 'Ada');
  assert.equal(element('field:background').value, 'Herkunft');
  submit({ name: 'Ada neu', background: 'Neue Herkunft' });
  assert.equal(project.characters.length, 1);
  assert.equal(project.characters[0].id, 'character');
  assert.equal(project.characters[0].custom, 'keep');
  assert.equal(project.characters[0].name, 'Ada neu');
  view('notes').edits[0].onclick();
  assert.equal(element('field:text').value, 'Idee');
  submit({ text: 'Neue Idee', status: 'übernommen' });
  assert.equal(project.notes[0].text, 'Neue Idee');
  assert.deepEqual(project.notes[0].tags, ['keep']);
});

test('timeline entries and summary can be edited without losing memory facts', () => {
  const { element, project, view, submit } = setup();
  view('timeline').add.onclick();
  submit({ title: 'Ankunft', date: 'Tag 1', description: 'Start' });
  view('timeline').edits[0].onclick();
  assert.equal(element('field:title').value, 'Ankunft');
  submit({ title: 'Abreise', date: 'Tag 2' });
  assert.equal(project.timeline.length, 1);
  assert.equal(project.timeline[0].title, 'Abreise');
  view('memory').edits[0].onclick();
  assert.equal(element('field:bookSummary').value, 'Alt');
  submit({ bookSummary: 'Neue Zusammenfassung' });
  assert.equal(project.memory.bookSummary, 'Neue Zusammenfassung');
  assert.deepEqual(project.memory.importantFacts, ['keep']);
});

test('cancel closes the form without changing the figure', () => {
  const { element, project, view } = setup();
  view('characters').edits[0].onclick();
  element('field:name').value = 'Ungespeichert';
  element('#form-dialog').close();
  assert.equal(project.characters[0].name, 'Ada');
});
