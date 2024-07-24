export const calculateTimestampDifferenceInMinutes = (
  timestamp1: string | number,
  timestamp2: string | number
): number => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const diffInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
};

export const calculateTimestampDifferenceInHumanReadableFormat = (
  timestamp1: string | number,
  timestamp2: string | number
): string => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  const timeDifferenceInMilliseconds = Math.abs(
    date1.getTime() - date2.getTime()
  );

  const days = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDifferenceInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (timeDifferenceInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor(
    (timeDifferenceInMilliseconds % (1000 * 60)) / 1000
  );

  return `${days ? `${days} days, ` : ""}${hours ? `${hours} hours, ` : ""}${
    minutes ? `${minutes} minutes ` : ""
  }and ${seconds} seconds`;
};

export const timestampToWarsawTime = (timestamp: string | number): string => {
  const options = {
    hour12: false,
    timeZone: "Europe/Warsaw",
  };
  const locale = "pl-PL";
  return new Date(timestamp).toLocaleString(locale, options);
};

export const increaseTimestampBy10Seconds = (timestamp: string): string => {
  const timestampAsDate = new Date(timestamp);
  timestampAsDate.setSeconds(timestampAsDate.getSeconds() + 10);

  return dateToInfluxDbString(timestampAsDate);
};

export const dateToInfluxDbString = (date: Date): string => {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
};
