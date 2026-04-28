/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { formatEventDate, formatEventTime } from "@/lib/event-datetime";

type DbProps = {
  variant?: "db";
  id: string;
  title: string;
  imageUrl?: string | null;
  price: string;
  currency: string;
  venue: string;
  djName?: string | null;
  djType?: string | null;
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
      <div className="jazz-panel min-w-0 overflow-hidden rounded-2xl shadow-sm">
        <div className="h-44 w-full overflow-hidden sm:h-52">
          <img
            src={props.image}
            alt={props.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="jazz-heading text-[1.55rem] text-amber-100 sm:text-2xl">{props.title}</h3>

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

  const date = formatEventDate(props.startsAt, locale);
  const time = formatEventTime(props.startsAt);

  return (
    <div className="jazz-panel min-w-0 overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1">
      <div className="h-44 w-full overflow-hidden sm:h-52">
        <img
          src={props.imageUrl || "/placeholder.jpg"}
          alt={props.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="jazz-heading text-[1.55rem] text-amber-100 sm:text-2xl">{props.title}</h3>

        <div className="mt-2 space-y-1 text-sm text-amber-50/70">
          <p>
            {date} • {time}
          </p>
          <p>{props.venue}</p>
          {props.djName ? (
            <p>
              {tr(locale, "DJ name", "DJ нэр")}:{" "}
              <span className="font-semibold text-amber-200">{props.djName}</span>
            </p>
          ) : null}
          {props.djType ? (
            <p>
              {tr(locale, "DJ type", "DJ төрөл")}:{" "}
              <span className="font-semibold text-amber-200">{props.djType}</span>
            </p>
          ) : null}
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
