const EVENING_SURCHARGE = 5000;
const LATE_SURCHARGE = 10000;
const BUSY_SURCHARGE = 5000;
const PEAK_SURCHARGE = 10000;

function minutesOf(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function getReservationSurcharge(
  reservedFor: string | Date,
  occupiedTables = 0,
) {
  const date = reservedFor instanceof Date ? reservedFor : new Date(reservedFor);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  let amount = 0;
  const minutes = minutesOf(date);

  if (minutes >= 23 * 60) {
    amount = Math.max(amount, LATE_SURCHARGE);
  } else if (minutes >= 21 * 60) {
    amount = Math.max(amount, EVENING_SURCHARGE);
  }

  if (occupiedTables >= 16) {
    amount = Math.max(amount, PEAK_SURCHARGE);
  } else if (occupiedTables >= 10) {
    amount = Math.max(amount, BUSY_SURCHARGE);
  }

  return amount;
}
