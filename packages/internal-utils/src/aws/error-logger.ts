import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { RedstoneCommon } from "@redstone-finance/utils";
import z from "zod";

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

export async function sendErrorLog(functionName: string, errorLog: string) {
  try {
    await invokeLambda(functionName, { message: errorLog });
  } catch (e) {
    throw new Error(
      `Error sending error log: ${RedstoneCommon.stringifyError(e)}`
    );
  }
}
