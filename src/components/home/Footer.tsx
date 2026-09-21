import Image from "next/image";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-20 pt-8 border-t border-zinc-200 flex flex-col gap-4 text-sm text-zinc-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-medium text-zinc-900">
          <Image
            src={logo}
            alt="MisLíneas"
            width={20}
            height={20}
            className="rounded"
          />{" "}
          MisLíneas
        </div>
        <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center items-center gap-x-4 gap-y-2 text-xs font-medium">
          <span className="whitespace-nowrap">
            Plataforma ciudadana independiente
          </span>
          <span className="hidden md:block text-zinc-300">&bull;</span>
          <span className="whitespace-nowrap">
            No afiliado al Gobierno de México
          </span>
          <span className="hidden md:block text-zinc-300">&bull;</span>
          <a
            href="/aviso-de-privacidad"
            className="whitespace-nowrap hover:text-black transition-colors"
          >
            Aviso de Privacidad
          </a>
          <span className="hidden md:block text-zinc-300">&bull;</span>
          <a
            href="https://github.com/moraxh/MisLineas"
            className="whitespace-nowrap hover:text-black transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Repositorio Open Source
          </a>
          <span className="hidden md:block text-zinc-300">&bull;</span>
          <a
            href="mailto:contact@moraxh.dev"
            className="flex items-center gap-1.5 whitespace-nowrap hover:text-black transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            contact@moraxh.dev
          </a>
        </div>
        <a
          href="/donar"
          className="flex items-center gap-1.5 whitespace-nowrap text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-full font-medium transition-colors shrink-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.23l7.65-7.22.77-.78a5.4 5.4 0 0 0 0-7.65z" />
          </svg>
          Apoyar el proyecto
        </a>
      </div>
      <p className="text-center text-xs text-zinc-400 max-w-2xl mx-auto">
        Las donaciones son voluntarias y se destinan únicamente a cubrir costos
        de infraestructura (hosting, dominio y proxies). MisLíneas sigue siendo
        un proyecto sin fines de lucro.
      </p>
    </footer>
  );
}
