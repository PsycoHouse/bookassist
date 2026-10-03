export const uid = () => crypto.randomUUID();
export function makeProject(values) {
  const now = new Date().toISOString();
  return { id: uid(), ...values, createdAt: now, updatedAt: now, trashedAt: null, chapters: [{ id: uid(), title: 'Kapitel 1', content: '' }], notes: [], characters: [], plotThreads: [], timeline: [], memory: { bookSummary: '', importantFacts: [], characters: [], relationships: [], openQuestions: [], plotThreads: [], timelineFacts: [] } };
}
export const wordCount = text => (text.trim().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
export const totalWords = project => project.chapters.reduce((sum, chapter) => sum + wordCount(chapter.content), 0);
