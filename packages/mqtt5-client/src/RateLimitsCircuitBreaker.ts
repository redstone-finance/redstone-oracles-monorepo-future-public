export class RateLimitsCircuitBreaker {
  events: number[] = [];

  constructor(
    readonly interval: number,
    readonly maxEventsCountsInInterval: number
  ) {}

  recordEvent() {
    this.events.push(Date.now());
  }

  shouldBreakCircuit() {
    const now = Date.now();

    // we don't have take into account upper limit because we are single threaded
    this.events = this.events.filter(
      (occurredAt) => occurredAt >= now - this.interval
    );

    return this.events.length > this.maxEventsCountsInInterval;
  }
}
