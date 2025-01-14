import { z } from "zod";

function flattenFields<T>(data: { fields: T }): T {
  return data.fields;
}

const ConfigContent = z
  .object({
    fields: z.object({
      signer_count_threshold: z.number(),
    }),
  })
  .transform(flattenFields);

const PricesContent = z
  .object({
    fields: z.object({
      id: z.object({
        id: z.string(),
      }),
    }),
  })
  .transform(flattenFields);

export const PriceAdapterDataContent = z
  .object({
    fields: z.object({
      prices: PricesContent,
      config: ConfigContent,
    }),
  })
  .transform(flattenFields);

const PriceData = z.object({
  feed_id: z.array(z.number()),
  timestamp: z.string(),
  value: z.string(),
  write_timestamp: z.string(),
});

const ValueContent = z
  .object({
    fields: PriceData,
  })
  .transform(flattenFields);

export const PriceDataContent = z
  .object({
    fields: z.object({
      value: ValueContent,
    }),
  })
  .transform(flattenFields);
