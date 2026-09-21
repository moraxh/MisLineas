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
      className={
        isHeader
          ? "inline-flex shrink-0 items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-900"
          : "inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900"
      }
    >
      <span
        className={
          isHeader
            ? "hidden text-[11px] font-medium lg:inline"
            : "text-xs font-medium"
        }
      >
        Patrocinado por
      </span>
      <Image
        src="/branding/velar-logo.png"
        alt="Velar Technologies"
        width={isPage ? 132 : isHeader ? 88 : 108}
        height={isPage ? 50 : isHeader ? 34 : 41}
        className={
          isPage ? "h-10 w-auto" : isHeader ? "h-7 w-auto" : "h-8 w-auto"
        }
      />
    </a>
  );
}
