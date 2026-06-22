import { ButtonLink } from './Button';

interface Props {
  titolo: string;
  descrizione: string;
  /** Link registrazione invece di solo login */
  invitaRegistrazione?: boolean;
}

export function AuthWallLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="font-mono text-sm uppercase text-cemento/40">Caricamento…</p>
    </div>
  );
}

export default function AuthWall({ titolo, descrizione, invitaRegistrazione = true }: Props) {
  return (
    <div className="rounded-app-lg border border-white/10 bg-white/[0.03] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">MotoGarage</p>
      <h2 className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-tight text-white">
        {titolo}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-cemento/65">{descrizione}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {invitaRegistrazione && (
          <ButtonLink href="/accedi#registrati">Registrati gratis</ButtonLink>
        )}
        <ButtonLink href="/accedi" variant="ghost">
          {invitaRegistrazione ? 'Accedi' : 'Vai al login'}
        </ButtonLink>
      </div>
    </div>
  );
}
