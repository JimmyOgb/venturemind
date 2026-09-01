// Mock localStorage for Node test environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockStorage = new LocalStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
});

if (typeof window === 'undefined') {
  // @ts-expect-error test mock
  globalThis.window = globalThis;
}
