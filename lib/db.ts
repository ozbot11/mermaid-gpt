import type { Project } from "@/types";

const DB_NAME = "mermaid-gpt";
const STORE_NAME = "projects";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

export async function getProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("updatedAt");
    const request = index.getAll();
    request.onsuccess = () => {
      const list = (request.result as Project[]).sort((a, b) => b.updatedAt - a.updatedAt);
      db.close();
      resolve(list);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getProject(id: number): Promise<Project | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as Project) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveProject(project: {
  id?: number;
  name: string;
  mermaidCode: string;
  description?: string;
}): Promise<Project> {
  const db = await openDB();
  const now = Date.now();
  const record: Omit<Project, "id"> & { id?: number } = {
    name: project.name.trim() || "Untitled",
    mermaidCode: project.mermaidCode,
    description: project.description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  if (project.id != null) {
    const existing = await getProject(project.id);
    if (existing) {
      record.id = project.id;
      record.createdAt = existing.createdAt;
    }
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = record.id != null
      ? store.put({ ...record, id: record.id })
      : store.add(record);
    request.onsuccess = () => {
      const id = (request.result as number) ?? (record.id as number);
      db.close();
      resolve({
        id,
        name: record.name,
        mermaidCode: record.mermaidCode,
        description: record.description,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteProject(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const request = tx.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}
