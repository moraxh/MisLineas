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
      rel="sponsored noopener"
      referrerPolicy="strict-origin-when-cross-origin"
      aria-label="Patrocinado por Velar Technologies"
      title="Patrocinado por Velar Technologies"
      className={
        isHeader
          ? "inline-flex shrink-0 items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-1.5 text-zinc-500 transition-colors hover:border-sky-200 hover:bg-sky-50"
          : "inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900"
      }
    >
      <span className="text-[11px] font-medium leading-none whitespace-nowrap">
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
