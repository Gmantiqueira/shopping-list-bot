type DebounceCallback = () => Promise<void> | void;

export class Debouncer {
  private timeoutId: NodeJS.Timeout | null = null;
  private pendingCallbacks: DebounceCallback[] = [];

  constructor(private readonly delayMs: number = 1000) {}

  debounce(callback: DebounceCallback): void {
    this.pendingCallbacks.push(callback);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(async () => {
      const callbacks = [...this.pendingCallbacks];
      this.pendingCallbacks = [];
      this.timeoutId = null;

      for (const cb of callbacks) {
        await cb();
      }
    }, this.delayMs);
  }

  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingCallbacks = [];
  }
}
