function splitLocalIso(value: string): { date: string; time: string } {
  const [date = "", timePart = "00:00:00"] = value.split("T");
  return { date, time: timePart.slice(0, 5) };
}

export function localIsoToDate(value: string): string {
  return splitLocalIso(value).date;
}

export function localIsoToTime(value: string): string {
  return splitLocalIso(value).time;
}

export function localIsoToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = localIsoToTime(value).split(":");
  return Number(hours) * 60 + Number(minutes);
}
