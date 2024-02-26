import { z, ZodDefault, ZodOptional, ZodType, ZodTypeDef } from "zod";

type GetFromEnvType = {
  /** JSON.parse is used by default before passing the env variable to schema.parse */
  <T>(name: string, schema: ZodDefault<ZodType<T>>, parseAsJSON?: boolean): T;
  /** JSON.parse is used by default before passing the env variable to schema.parse */
  <T>(
    name: string,
    schema: ZodOptional<ZodType<T>>,
    parseAsJSON?: boolean
  ): T | undefined;
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
  const envValue = process.env[name];
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
    console.log(`failed to parse ${name} env variable, value ${envValue}`);
    throw new Error(`failed to parse ${name} env variable`, { cause: e });
  }
};
