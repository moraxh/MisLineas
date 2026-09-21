export function Notices() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500">
      <span>Proyecto ciudadano independiente</span>
      <span
        className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block"
        aria-hidden="true"
      />
      <span>Más de 250,000 consultas realizadas</span>
      <span
        className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block"
        aria-hidden="true"
      />
      <span>No afiliado a operadoras ni al gobierno</span>
    </div>
  );
}
