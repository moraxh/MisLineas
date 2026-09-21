import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { Separator } from "@/components/ui/separator";

export function SponsorLink({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="https://velartech.com.mx/"
      target="_blank"
      rel="sponsored noopener"
      referrerPolicy="strict-origin-when-cross-origin"
      className="inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Sponsored by Velar Technologies. Visitar sitio web"
    >
      <span
        className={
          footer
            ? "text-xs text-muted-foreground"
            : "hidden text-[11px] text-muted-foreground sm:block"
        }
      >
        {footer ? "Sponsored by" : "Con el apoyo de"}
      </span>
      <Image
        src="/branding/velar-logo.png"
        alt="Velar Technologies"
        width={88}
        height={34}
        className="h-auto w-[88px]"
      />
      <ArrowUpRight
        className="size-3 text-muted-foreground"
        aria-hidden="true"
      />
    </a>
  );
}
export function Header() {
  return (
    <header className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
      <a
        href="/"
        className="flex items-center gap-2 text-base font-semibold tracking-tight"
      >
        <Image src={logo} alt="" width={25} height={25} />
        MisLíneas
      </a>
      <SponsorLink />
    </header>
  );
}
export function Footer() {
  return (
    <footer className="space-y-5 pb-8 pt-8 text-center">
      <Separator />
      <div className="pt-3">
        <SponsorLink footer />
      </div>
      <div className="flex justify-center gap-5 text-xs text-muted-foreground">
        <a
          className="hover:underline"
          href="https://github.com/moraxh/MisLineas"
          target="_blank"
          rel="noopener noreferrer"
        >
          Código abierto
        </a>
        <a className="hover:underline" href="/aviso-de-privacidad">
          Privacidad
        </a>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Proyecto de Moraxh. No afiliado al Gobierno de México.
      </p>
    </footer>
  );
}
