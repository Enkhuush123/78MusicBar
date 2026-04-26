import ReservationClient from "@/app/components/reservation/ReservationClient";
import {
  DAILY_RESERVATION_END_HOUR,
  DAILY_RESERVATION_START_HOUR,
} from "@/lib/daily-reservation";
import { getReservationSettings } from "@/lib/reservation-settings";

export default async function DailyReservationPage() {
  const settings = await getReservationSettings();
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setHours(DAILY_RESERVATION_START_HOUR, 0, 0, 0);
  const endsAt = new Date(now);
  endsAt.setHours(DAILY_RESERVATION_END_HOUR, 0, 0, 0);

  return (
    <ReservationClient
      bookingMode="daily"
      eventTitle="Reserve a Table Today"
      eventPrice={0}
      eventCurrency="MNT"
      startsAt={startsAt.toISOString()}
      endsAt={endsAt.toISOString()}
      eventDescription="Today reservations are available from 18:00 to 22:00."
      eventImageUrl={null}
      heroLogoSrc="/78MusicBar.png"
      venue="78MusicBar"
      paymentRequired={settings.paymentRequired}
      allowCustomDate={false}
    />
  );
}
