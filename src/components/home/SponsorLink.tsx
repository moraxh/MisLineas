import Image from "next/image";

const VELAR_URL = "https://velartech.com.mx/";

interface SponsorLinkProps {
  variant: "header" | "footer" | "page" | "redesign-header";
  className?: string;
}

export function SponsorLink({ variant, className = "" }: SponsorLinkProps) {
  const isHeader = variant === "header";
  const isPage = variant === "page";
  const isRedesignHeader = variant === "redesign-header";
  const linkClassName = isHeader
    ? "inline-flex shrink-0 items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-1.5 text-zinc-500 transition-colors hover:border-sky-200 hover:bg-sky-50"
    : isRedesignHeader
      ? "inline-flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
      : "inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900";

  return (
    <a
      href={VELAR_URL}
      target="_blank"
      rel="sponsored noopener"
      referrerPolicy="strict-origin-when-cross-origin"
      aria-label="Patrocinado por Velar Technologies"
      title="Patrocinado por Velar Technologies"
      className={`${linkClassName} ${className}`}
    >
      <span
        className={
          isRedesignHeader
            ? "text-[11px] font-medium leading-none whitespace-nowrap text-zinc-500"
            : "text-[11px] font-medium leading-none whitespace-nowrap"
        }
      >
        Patrocinado por
      </span>
      <span className={isRedesignHeader ? "block shrink-0" : undefined}>
        <Image
          src="/branding/velar-logo.png"
          alt="Velar Technologies"
          width={isRedesignHeader ? 220 : isPage ? 132 : isHeader ? 88 : 108}
          height={isRedesignHeader ? 84 : isPage ? 50 : isHeader ? 34 : 41}
          className={
            isRedesignHeader
              ? "block h-9 w-auto sm:h-10"
              : isPage
                ? "h-10 w-auto"
                : isHeader
                  ? "h-6 w-auto"
                  : "h-8 w-auto"
          }
        />
      </span>
    </a>
  );
}
