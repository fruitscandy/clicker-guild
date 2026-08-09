export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export class MemoryStorage implements StorageLike {
  readonly #items = new Map<string, string>();

  constructor(initialValues: Readonly<Record<string, string>> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.#items.set(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.#items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#items.set(key, value);
  }

  removeItem(key: string): void {
    this.#items.delete(key);
  }

  clear(): void {
    this.#items.clear();
  }
}
