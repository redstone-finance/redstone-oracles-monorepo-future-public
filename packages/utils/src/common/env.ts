import { ZodType, ZodTypeDef, z, type ZodTypeAny } from "zod";
import { isNodeRuntime } from "./runtime";

type GetFromEnvType = {
  /** JSON.parse is used by default before passing the env variable to schema.parse */
  <T extends ZodTypeAny>(
    name: string,
    schema: T,
    parseAsJSON?: boolean
  ): z.infer<typeof schema>;
  /** JSON.parse is NOT used before passing the env variable to schema.parse */
  (name: string): string;
  /** if schema is provided JSON.parse is used before passing the env variable to schema.parse */
  <T>(name: string, schema?: ZodType<T>, parseAsJSON?: boolean): T;
};

export const getFromEnv: GetFromEnvType = <T = string>(
  name: string,
  schema?: ZodType<T, ZodTypeDef, T | undefined>,
  parseAsJSON = !!schema
) => {
  const envValue = isNodeRuntime() ? process.env[name] : undefined;
  let envValueParsed: unknown = envValue;
  if (parseAsJSON && envValue) {
    try {
      envValueParsed = JSON.parse(envValue);
    } catch (e) {
      // ignore, if value cannot be parsed as a JSON it will be treated as a string
    }
  }
  try {
    return (schema ?? z.string()).parse(envValueParsed);
  } catch (e) {
    // eslint-disable-next-line no-console -- we cannot use logger here to avoid cyclic dependency between logger and env modules
    console.error(`failed to parse ${name} env variable, value ${envValue}`);
    throw new Error(`failed to parse ${name} env variable`, { cause: e });
  }
};
