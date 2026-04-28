import { getReservationSettings } from "@/lib/reservation-settings";

export async function GET() {
  const settings = await getReservationSettings();
  return Response.json({ paymentRequired: settings.paymentRequired });
}
