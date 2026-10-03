import test from 'node:test'; import assert from 'node:assert/strict';
import { makeProject, totalWords, wordCount } from '../public/js/projects.js';
test('new project has portable MVP structure', () => { const p = makeProject({ title: 'Test' }); assert.equal(p.chapters.length, 1); assert.deepEqual(p.memory.openQuestions, []); assert.equal(p.trashedAt, null); });
test('German words and hyphenated terms are counted', () => { assert.equal(wordCount('Die Straße – local-first, Autor\'s Idee.'), 5); const p = makeProject({ title: 'Test' }); p.chapters[0].content = 'Eins zwei'; p.chapters.push({ content: 'drei', title: 'Zwei' }); assert.equal(totalWords(p), 3); });
