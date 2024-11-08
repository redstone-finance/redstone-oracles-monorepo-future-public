import { loggerFactory } from "@redstone-finance/utils/dist/src/logger";

export type Operation = () => Promise<void>;

export class OperationQueue {
  private queue: { id: string; operation: Operation }[] = [];
  private isProcessing = false;
  private activeOperations = new Set<string>();
  private logger = loggerFactory("operation-queue");

  enqueue(id: string, operation: Operation) {
    const existingOperationIndex = this.queue.findIndex((op) => op.id === id);

    if (existingOperationIndex !== -1) {
      this.queue[existingOperationIndex].operation = operation;
      this.logger.debug(`Replaced operation for [${id}] in the queue.`);

      return true;
    } else if (this.activeOperations.has(id)) {
      this.logger.debug(
        `Operation for [${id}] is currently processing and cannot be replaced.`
      );

      return false;
    } else {
      this.queue.push({ id, operation });
      this.logger.debug(`Added operation for [${id}] to the queue.`);

      //eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.processQueue();

      return true;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { id, operation } = this.queue.shift()!;
      this.activeOperations.add(id);
      try {
        this.logger.debug(`Running for ---> [${id}]`);
        await operation();
      } catch (error) {
        this.logger.error(`Operation for [${id}] failed:`, error);
      } finally {
        this.activeOperations.delete(id);
      }
    }

    this.isProcessing = false;
  }
}
