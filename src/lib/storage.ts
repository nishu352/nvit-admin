// ============================================================
// Safe Storage Utility — with in-memory fallback
// Protects against SecurityError in incognito / iframe / strict privacy modes
// ============================================================

class SafeStorage {
  private memoryStore: Map<string, string> = new Map();

  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory store when localStorage access is restricted
    }
    return this.memoryStore.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.memoryStore.set(key, value);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback silently
    }
  }

  removeItem(key: string): void {
    this.memoryStore.delete(key);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback silently
    }
  }
}

export const safeStorage = new SafeStorage();
