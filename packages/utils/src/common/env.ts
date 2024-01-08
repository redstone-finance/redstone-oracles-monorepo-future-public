import { z, ZodDefault, ZodOptional, ZodType, ZodTypeDef } from "zod";

type GetFromEnvType = {
  <T>(name: string, schema: ZodDefault<ZodType<T>>): T;
  <T>(name: string, schema: ZodOptional<ZodType<T>>): T | undefined;
  <T>(name: string, schema: ZodType<T>): T;
  (name: string): string;
};

export const getFromEnv: GetFromEnvType = <T = string>(
  name: string,
  schema?: ZodType<T, ZodTypeDef, T | undefined>
) => {
  const envValue = process.env[name];
  let envValueParsed: unknown = envValue;
  if (envValue) {
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
