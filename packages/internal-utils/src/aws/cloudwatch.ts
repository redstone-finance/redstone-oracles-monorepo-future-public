import {
  CloudWatch,
  CloudWatchClient,
  PutMetricDataCommand,
  StandardUnit,
  StateValue,
} from "@aws-sdk/client-cloudwatch";
import { AWS_REGION } from "./aws";

const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cloudwatch = new CloudWatch({ region: AWS_REGION });

export async function sendMetrics(
  namespace: string,
  metricName: string,
  values: {
    value: number;
    dimensions: {
      Name: string;
      Value: string;
    }[];
  }[] = [],
  unit = StandardUnit.Count
) {
  const params = {
    MetricData: values.map(({ value, dimensions }) => {
      return {
        MetricName: metricName,
        Dimensions: dimensions,
        Unit: unit,
        Value: value,
      };
    }),
    Namespace: namespace,
  };

  const command = new PutMetricDataCommand(params);

  try {
    await cloudWatchClient.send(command);
  } catch (error) {
    console.error("Error sending metric data:", error);
  }
}

export async function setAlarmState(
  alarmName: string,
  state: StateValue = StateValue.INSUFFICIENT_DATA
) {
  return await cloudwatch.setAlarmState({
    AlarmName: alarmName,
    StateValue: state,
    StateReason: `Alarm state set to ${state} by lambda function`,
  });
}
