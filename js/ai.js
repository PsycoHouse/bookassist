export function buildContext(project, chapter, selectedText = '') {
  return { project: { title: project.title, genre: project.genre, description: project.description }, storySummary: project.memory.bookSummary, relevantCharacters: project.characters.slice(0, 10), currentChapter: { title: chapter?.title, content: chapter?.content?.slice(-12000) }, selectedText, openPlotThreads: project.plotThreads.filter(thread => thread.status !== 'gelöst'), recentThoughts: project.notes.slice(-8) };
}
export async function askAI(project, chapter, action, message, selectedText = '') {
  const response = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, message, selectedText, projectContext: buildContext(project, chapter, selectedText) }) });
  if (!response.ok) throw new Error('Der AI-Assistent ist momentan nicht erreichbar. Dein Text wurde weiterhin gespeichert.');
  return (await response.json()).answer;
}
