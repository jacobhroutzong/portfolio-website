import { fresh, parseProgress, type Progress } from "./engine";
export interface ProgressStore {
  load(): Promise<Progress>;
  save(p: Progress): Promise<void>;
}
export class IndexedStore implements ProgressStore {
  private async db() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("ascent-v1", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("progress");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async load() {
    const db = await this.db();
    try {
      return await new Promise<Progress>((resolve, reject) => {
        const r = db
          .transaction("progress")
          .objectStore("progress")
          .get("learner");
        r.onsuccess = () => {
          try {
            resolve(r.result ? parseProgress(r.result) : fresh());
          } catch (e) {
            reject(e);
          }
        };
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  }
  async save(p: Progress) {
    const db = await this.db();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("progress", "readwrite");
        tx.objectStore("progress").put(structuredClone(p), "learner");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }
}
