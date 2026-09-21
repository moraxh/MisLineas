import Image from "next/image";

const VELAR_URL = "https://velartech.com.mx/";

interface SponsorLinkProps {
  variant: "header" | "footer" | "page";
}

export function SponsorLink({ variant }: SponsorLinkProps) {
  const isHeader = variant === "header";
  const isPage = variant === "page";

  return (
    <a
      href={VELAR_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label="Patrocinado por Velar Technologies"
      title="Patrocinado por Velar Technologies"
      className={
        isHeader
          ? "inline-flex shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-50/70 px-2 py-1 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-100"
          : "inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900"
      }
    >
      <span className={isHeader ? "sr-only" : "text-xs font-medium"}>
        Patrocinado por
      </span>
      <Image
        src="/branding/velar-logo.png"
        alt="Velar Technologies"
        width={isPage ? 132 : isHeader ? 88 : 108}
        height={isPage ? 50 : isHeader ? 34 : 41}
        className={
          isPage ? "h-10 w-auto" : isHeader ? "h-6 w-auto" : "h-8 w-auto"
        }
      />
    </a>
  );
}
