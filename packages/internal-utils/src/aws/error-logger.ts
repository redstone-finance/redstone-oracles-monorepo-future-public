import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { RedstoneCommon } from "@redstone-finance/utils";
import z from "zod";

const errorSeverities = ["critical", "error", "warning", "info"] as const;

export const ErrorSeveritiesEnum = z.enum(errorSeverities);
export type ErrorSeverity = z.infer<typeof ErrorSeveritiesEnum>;

const AWS_REGION = RedstoneCommon.getFromEnv(
  "AWS_REGION",
  z.string().default("eu-west-1")
);

const lambdaClient = new LambdaClient({ region: AWS_REGION });

function invokeLambda(functionName: string, payload: unknown) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
    LogType: "None",
  });

  return lambdaClient.send(command);
}

export async function sendErrorLog(
  functionName: string,
  errorLog: string,
  severity?: ErrorSeverity
) {
  try {
    await invokeLambda(functionName, { message: errorLog, severity });
  } catch (e) {
    throw new Error(
      `Error sending error log: ${RedstoneCommon.stringifyError(e)}`
    );
  }
}
