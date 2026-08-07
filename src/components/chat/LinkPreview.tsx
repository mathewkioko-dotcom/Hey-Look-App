import React, { useEffect, useState } from "react";
import { ExternalLink, Link2, Globe, ImageOff, Loader2 } from "lucide-react";

/** Extract the first http(s) URL from a string, or null if none. */
export const extractUrl = (text: string): string | null => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
};

const getDomain = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getFavicon = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return "";
  }
};

interface LinkMeta {
  title: string;
  description: string;
  image: string;
  loading: boolean;
}

interface LinkPreviewProps {
  url: string;
  /** When true, render in a larger "hero" layout (Instagram-style). */
  hero?: boolean;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, hero }) => {
  const [meta, setMeta] = useState<LinkMeta>({
    title: "",
    description: "",
    image: "",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const domain = getDomain(url);

    // Skeleton shown while fetching Open Graph metadata via a public proxy.
    setMeta((prev) => ({ ...prev, loading: true }));

    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=true`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "success" && data?.data) {
          const d = data.data;
          setMeta({
            title: d.title || domain,
            description: d.description || "",
            image: d.image?.url || "",
            loading: false,
          });
        } else {
          setMeta({
            title: domain,
            description: "",
            image: "",
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled)
          setMeta({
            title: domain,
            description: "",
            image: "",
            loading: false,
          });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Skeleton loading fallback
  if (meta.loading) {
    return (
      <div
        className={`w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-lg ${
          hero ? "max-w-md" : "max-w-sm"
        }`}
      >
        <div
          className={`${hero ? "h-44" : "h-28"} bg-slate-800/60 animate-pulse flex items-center justify-center`}
        >
          <Loader2 className="w-6 h-6 text-cyan-400/60 animate-spin" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-2.5 w-1/3 bg-slate-800 rounded-full animate-pulse" />
          <div className="h-3 w-full bg-slate-800 rounded-full animate-pulse" />
          <div className="h-3 w-2/3 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/90 hover:border-cyan-500/50 transition-colors shadow-lg group ${
        hero ? "max-w-md" : "max-w-sm"
      }`}
    >
      {/* Hero Image Row w/ Gradient Overlay */}
      {meta.image ? (
        <div className={`${hero ? "h-44" : "h-32"} relative overflow-hidden`}>
          <img
            src={meta.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />
          <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-slate-200/90 flex items-center gap-1.5">
            <Link2 className="w-3 h-3 text-cyan-300" />
            <span className="bg-slate-950/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
              Shared a link
            </span>
          </span>
        </div>
      ) : (
        <div
          className={`${hero ? "h-36" : "h-20"} flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-indigo-500/10`}
        >
          <ImageOff className="w-8 h-8 text-cyan-400/70" />
        </div>
      )}

      {/* Meta Row: favicon + domain */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-400">
          <img
            src={getFavicon(url)}
            alt=""
            className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="truncate">{getDomain(url)}</span>
          <ExternalLink className="w-3 h-3 ml-auto shrink-0 text-slate-400" />
        </div>

        <p
          className={`font-bold text-slate-100 line-clamp-2 ${hero ? "text-sm" : "text-xs"}`}
        >
          {meta.title || getDomain(url)}
        </p>

        {meta.description && (
          <p
            className={`text-slate-400 line-clamp-2 ${hero ? "text-xs" : "text-[11px]"}`}
          >
            {meta.description}
          </p>
        )}
      </div>
    </a>
  );
};
