/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import {
  AboutContent,
  Bilingual,
  defaultAboutContent,
  parseAboutContent,
} from "@/lib/about-content";

const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

type AboutDTO = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
};

export default function AdminAboutPage() {
  const [raw, setRaw] = useState<AboutDTO | null>(null);
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/about", { cache: "no-store" });
    if (!res.ok) return setMsg("Load failed");
    const d = (await res.json()) as AboutDTO;
    setRaw(d);
    setContent(parseAboutContent(d.body));
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) return setMsg("Upload failed");
      const d = await res.json();
      setRaw((p) => (p ? { ...p, imageUrl: d.url } : p));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!raw) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: raw.title,
          imageUrl: raw.imageUrl,
          body: JSON.stringify(content),
        }),
      });
      if (!res.ok) return setMsg("Save failed");
      setMsg("✅ Saved");
    } finally {
      setSaving(false);
    }
  };

  if (!raw) {
    return (
      <section className="jazz-panel rounded-2xl p-6">
        <p className="text-sm text-amber-100/80">{msg ?? "Loading..."}</p>
      </section>
    );
  }

  return (
    <section className="jazz-panel rounded-2xl p-6">
      <p className="jazz-heading text-amber-200">Content</p>
      <h1 className="jazz-heading text-4xl text-amber-50">About Us</h1>

      <div className="mt-6 grid gap-5">
        <Field label="Page Title">
          <input
            className="h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
            value={raw.title}
            onChange={(e) => setRaw({ ...raw, title: e.target.value })}
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <div>
            <Field label="Header Image">
              <input
                className="block w-full text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                }}
              />
              <input
                className="mt-3 h-11 w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 text-amber-50"
                value={raw.imageUrl ?? ""}
                onChange={(e) => setRaw({ ...raw, imageUrl: e.target.value })}
                placeholder="...or paste image url"
              />
              <p className="mt-2 text-xs text-amber-100/70">
                {uploading ? "Uploading..." : ""}
              </p>
            </Field>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-300/30 bg-black/20">
            {raw.imageUrl ? (
              <img src={raw.imageUrl} alt="about" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center text-xs text-amber-100/70">
                No image
              </div>
            )}
          </div>
        </div>

        <BilingualField
          label="Intro"
          value={content.intro}
          rows={3}
          onChange={(v) => setContent({ ...content, intro: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Story Heading"
            value={content.storyHeading}
            onChange={(v) => setContent({ ...content, storyHeading: v })}
          />
          <BilingualField
            label="Vibe Heading"
            value={content.vibeHeading}
            onChange={(v) => setContent({ ...content, vibeHeading: v })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Story Body"
            value={content.storyBody}
            rows={6}
            onChange={(v) => setContent({ ...content, storyBody: v })}
          />
          <BilingualField
            label="Vibe Body"
            value={content.vibeBody}
            rows={6}
            onChange={(v) => setContent({ ...content, vibeBody: v })}
          />
        </div>

        <BilingualField
          label="Quote"
          value={content.quote}
          onChange={(v) => setContent({ ...content, quote: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Details Heading"
            value={content.detailsHeading}
            onChange={(v) => setContent({ ...content, detailsHeading: v })}
          />
          <BilingualField
            label="Contact"
            value={content.contact}
            onChange={(v) => setContent({ ...content, contact: v })}
          />
        </div>

        <BilingualField
          label="Details Body"
          value={content.detailsBody}
          rows={3}
          onChange={(v) => setContent({ ...content, detailsBody: v })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField
            label="Address"
            value={content.address}
            onChange={(v) => setContent({ ...content, address: v })}
          />
          <BilingualField
            label="Hours"
            value={content.hours}
            onChange={(v) => setContent({ ...content, hours: v })}
          />
        </div>

        <button
          onClick={save}
          disabled={saving || uploading}
          className={cn(
            "h-11 rounded-xl font-semibold transition",
            saving || uploading
              ? "bg-neutral-200 text-neutral-500"
              : "bg-amber-300 text-neutral-900 hover:bg-amber-200",
          )}
        >
          {saving ? "Saving..." : "Save About Page"}
        </button>

        {msg && <p className="text-sm text-amber-100/80">{msg}</p>}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-amber-100/75">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  rows?: number;
}) {
  const cls =
    "w-full rounded-xl border border-amber-300/30 bg-black/20 px-3 py-2 text-amber-50";

  return (
    <div className="grid gap-2">
      <p className="text-sm text-amber-100/75">{label}</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-amber-100/60">EN</p>
          {rows ? (
            <textarea
              rows={rows}
              className={cls}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          ) : (
            <input
              className={`h-11 ${cls}`}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          )}
        </div>
        <div>
          <p className="mb-1 text-xs text-amber-100/60">MN</p>
          {rows ? (
            <textarea
              rows={rows}
              className={cls}
              value={value.mn}
              onChange={(e) => onChange({ ...value, mn: e.target.value })}
            />
          ) : (
            <input
              className={`h-11 ${cls}`}
              value={value.mn}
              onChange={(e) => onChange({ ...value, mn: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
