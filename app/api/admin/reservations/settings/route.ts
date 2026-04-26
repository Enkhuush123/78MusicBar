import { requireAdmin } from "@/lib/admin";
import {
  getReservationSettings,
  setReservationSettings,
} from "@/lib/reservation-settings";

export async function GET() {
  await requireAdmin();
  return Response.json(await getReservationSettings());
}

export async function PATCH(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const current = await getReservationSettings();
  const paymentRequired =
    typeof body?.paymentRequired === "boolean"
      ? body.paymentRequired
      : current.paymentRequired;
  const allowCustomDate =
    typeof body?.allowCustomDate === "boolean"
      ? body.allowCustomDate
      : current.allowCustomDate;

  await setReservationSettings({ paymentRequired, allowCustomDate });
  return Response.json({ paymentRequired, allowCustomDate });
}
