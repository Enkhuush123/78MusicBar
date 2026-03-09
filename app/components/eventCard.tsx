/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

type DbProps = {
  variant?: "db";
  id: string;
  title: string;
  imageUrl?: string | null;
  price: string;
  currency: string;
  venue: string;
  startsAt: Date | string;
  description?: string | null;
};

type MockProps = {
  variant: "mock";
  title: string;
  price: string;
  date: string;
  time?: string;
  place: string;
  image: string;
};

type Props = DbProps | MockProps;

export const EventCard = async (props: Props) => {
  const locale = await getServerLocale();
  if (props.variant === "mock") {
    return (
      <div className="jazz-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="h-52 w-full overflow-hidden">
          <img
            src={props.image}
            alt={props.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-5">
          <h3 className="jazz-heading text-2xl text-amber-100">{props.title}</h3>

          <div className="mt-2 space-y-1 text-sm text-amber-50/70">
            <p>
              {props.date}
              {props.time && ` • ${props.time}`}
            </p>
            <p>{props.place}</p>
            <p className="font-semibold text-amber-200">
              {tr(locale, "Price", "Үнэ")}: {props.price}
            </p>
          </div>

          <div className="mt-4">
            <Button className="w-full ger-btn-secondary" disabled>
              {tr(locale, "Coming soon", "Тун удахгүй")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const d = new Date(props.startsAt);
  const date = d.toLocaleDateString("mn-MN");
  const time = d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="jazz-panel overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1">
      <div className="h-52 w-full overflow-hidden">
        <img
          src={props.imageUrl || "/placeholder.jpg"}
          alt={props.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="jazz-heading text-2xl text-amber-100">{props.title}</h3>

        <div className="mt-2 space-y-1 text-sm text-amber-50/70">
          <p>
            {date} • {time}
          </p>
          <p>{props.venue}</p>
          <p>
            {tr(locale, "Price", "Үнэ")}:{" "}
            <span className="font-semibold text-amber-200">
              {props.price} {props.currency}
            </span>
          </p>
        </div>

        <div className="mt-4">
          <Button asChild className="w-full ger-btn-secondary">
            <Link href={`/events/${props.id}/reserve`}>
              {tr(locale, "Reserve table", "Ширээ захиалах")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
