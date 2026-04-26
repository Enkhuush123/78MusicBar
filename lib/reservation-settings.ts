import { prisma } from "@/lib/prisma";

const RESERVATION_SETTINGS_SLUG = "reservation_settings";

type ReservationSettings = {
  paymentRequired: boolean;
  allowCustomDate: boolean;
};

const DEFAULT_SETTINGS: ReservationSettings = {
  paymentRequired: true,
  allowCustomDate: false,
};

function parseSettings(body?: string | null): ReservationSettings {
  if (!body) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(body) as Partial<ReservationSettings>;
    return {
      paymentRequired:
        typeof parsed.paymentRequired === "boolean"
          ? parsed.paymentRequired
          : DEFAULT_SETTINGS.paymentRequired,
      allowCustomDate:
        typeof parsed.allowCustomDate === "boolean"
          ? parsed.allowCustomDate
          : DEFAULT_SETTINGS.allowCustomDate,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getReservationSettings() {
  const page = await prisma.sitePage.findUnique({
    where: { slug: RESERVATION_SETTINGS_SLUG },
    select: { body: true },
  });
  return parseSettings(page?.body);
}

export async function setReservationSettings(settings: ReservationSettings) {
  return prisma.sitePage.upsert({
    where: { slug: RESERVATION_SETTINGS_SLUG },
    create: {
      slug: RESERVATION_SETTINGS_SLUG,
      title: "Reservation Settings",
      body: JSON.stringify(settings),
    },
    update: {
      body: JSON.stringify(settings),
    },
    select: { body: true },
  });
}
