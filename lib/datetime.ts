export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateTimeLocalInput(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

export function toDateInput(value?: string | Date | null) {
  const local = toDateTimeLocalInput(value);
  return local ? local.slice(0, 10) : "";
}

export function toTimeInput(value?: string | Date | null) {
  const local = toDateTimeLocalInput(value);
  return local ? local.slice(11, 16) : "";
}

export function combineDateAndTime(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}
