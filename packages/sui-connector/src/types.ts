import { z } from "zod";

export const PriceAdapterDataContent = z.object({
  fields: z.object({
    prices: z.object({
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
      }),
    }),
    config: z.object({
      fields: z.object({
        signer_count_threshold: z.number(),
      }),
    }),
  }),
});

export const PriceDataContent = z.object({
  fields: z.object({
    value: z.object({
      fields: z.object({
        feed_id: z.array(z.number()),
        timestamp: z.string(),
        value: z.string(),
        write_timestamp: z.string(),
      }),
    }),
  }),
});

export const ClockDataContent = z.object({
  fields: z.object({
    timestamp_ms: z.string(),
  }),
});
