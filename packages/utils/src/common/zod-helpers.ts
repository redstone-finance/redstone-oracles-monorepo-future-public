import { z } from "zod";

/**
 * Zod modifies data that is parsed.
 * Using this helper prevents modification.
 */
export function zodAssert<O>(
  schema: z.ZodSchema<O>,
  data: unknown
): asserts data is O {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Zod validation error: ${result.error.toString()}`);
  }
}
