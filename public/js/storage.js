const DB_NAME = 'storywriter';
const STORE = 'projects';
let dbPromise;
const openDb = () => dbPromise ||= new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
async function transaction(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode); const store = tx.objectStore(STORE); const request = action(store); let result;
    request.onsuccess = () => { result = request.result; }; request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Speichern wurde abgebrochen.'));
  });
}
export const listProjects = () => transaction('readonly', store => store.getAll());
export const getProject = id => transaction('readonly', store => store.get(id));
export async function saveProject(project) {
  project.updatedAt = new Date().toISOString();
  await transaction('readwrite', store => store.put(structuredClone(project)));
  if (project.directoryHandle) await writeProjectFiles(project);
  return project;
}
export const removeProject = id => transaction('readwrite', store => store.delete(id));
export async function connectFolder(project) {
  if (!window.showDirectoryPicker) throw new Error('Dein Browser unterstützt die Ordner-Verknüpfung nicht. Nutze Chrome oder Edge.');
  const root = await showDirectoryPicker({ mode: 'readwrite' });
  const safeName = project.title.replace(/[<>:"/\\|?*]/g, '_').trim() || 'Buchprojekt';
  project.directoryHandle = await root.getDirectoryHandle(safeName, { create: true });
  await saveProject(project);
}
async function write(handle, name, content) { const file = await handle.getFileHandle(name, { create: true }); const out = await file.createWritable(); await out.write(content); await out.close(); }
async function dir(root, name) { return root.getDirectoryHandle(name, { create: true }); }
async function writeProjectFiles(project) {
  const root = project.directoryHandle;
  if ((await root.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await root.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('Kein Schreibzugriff auf den Projektordner.');
  const plain = structuredClone(project); delete plain.directoryHandle;
  await write(root, 'project.json', JSON.stringify({ ...plain, chapters: plain.chapters.map(({ content, ...chapter }) => chapter) }, null, 2));
  const manuscript = await dir(root, 'manuscript');
  for (const [index, chapter] of project.chapters.entries()) await write(manuscript, `${String(index + 1).padStart(2, '0')}_${chapter.title.replace(/[^\p{L}\p{N}-]+/gu, '_')}.md`, `# ${chapter.title}\n\n${chapter.content}`);
  await write(await dir(root, 'notes'), 'gedanken.md', project.notes.map(n => `- [${n.status}] ${n.text}`).join('\n'));
  await write(await dir(root, 'characters'), 'characters.json', JSON.stringify(project.characters, null, 2));
  const story = await dir(root, 'story'); await write(story, 'plot.json', JSON.stringify(project.plotThreads, null, 2)); await write(story, 'timeline.json', JSON.stringify(project.timeline || [], null, 2));
  const ai = await dir(root, 'ai'); await write(ai, 'ai-memory.json', JSON.stringify(project.memory, null, 2)); await write(ai, 'book-summary.json', JSON.stringify({ bookSummary: project.memory.bookSummary }, null, 2));
}
export function download(name, content, type = 'application/json') { const url = URL.createObjectURL(new Blob([content], { type })); const a = Object.assign(document.createElement('a'), { href: url, download: name }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function exportProject(project) { const plain = structuredClone(project); delete plain.directoryHandle; download(`${project.title}.storywriter.json`, JSON.stringify(plain, null, 2)); }
export function exportManuscript(project) { download(`${project.title}.md`, project.chapters.map(c => `# ${c.title}\n\n${c.content}`).join('\n\n---\n\n'), 'text/markdown'); }
