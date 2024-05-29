export class SimpleCache<T> {
  private value: T | undefined;
  private timestamp = 0;

  constructor(private readonly ttl: number) {}

  get(comp: () => T): T {
    if (!this.value || Date.now() - this.timestamp > this.ttl) {
      this.value = comp();
      this.timestamp = Date.now();
    }
    return this.value;
  }
}
