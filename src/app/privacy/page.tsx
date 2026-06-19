export const metadata = {
  title: 'Privacy Policy — MotoGarage',
  description: 'Come MotoGarage tratta i dati personali degli utenti.',
};

const AGGIORNAMENTO = '19 giugno 2026';

export default function PaginaPrivacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">Legale</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">Privacy Policy</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-asfalto/50">Ultimo aggiornamento: {AGGIORNAMENTO}</p>

      <div className="mt-8 space-y-6 text-asfalto/85 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_p]:mt-2 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        <p>MotoGarage usa soltanto i dati necessari a fornire account, community, tracking, itinerari e garage digitale.</p>

        <h2>Titolare</h2>
        <p>
          Il titolare del trattamento è [TITOLARE — dati da completare]. Per richieste puoi scrivere a{' '}
          <a href="mailto:info@motogarage.it" className="text-cartello underline">info@motogarage.it</a>.
        </p>

        <h2>Dati raccolti</h2>
        <ul>
          <li><strong>Account:</strong> email, username e password cifrata gestita da Supabase.</li>
          <li><strong>Profilo:</strong> avatar, tipo e modello di moto, bio facoltativa.</li>
          <li><strong>Community:</strong> foto, commenti, like, articoli e giri resi pubblici.</li>
          <li><strong>Tracking:</strong> tracciato GPS e statistiche quando avvii volontariamente una registrazione.</li>
          <li><strong>Garage digitale:</strong> foto della moto, dati identificativi del modello e file 3D approvato.</li>
          <li><strong>Lista Pro:</strong> email lasciata volontariamente per partecipare alla beta.</li>
        </ul>

        <h2>Uso delle foto della moto</h2>
        <p>
          Le foto inviate per il gemello digitale sono private, accessibili al proprietario e agli amministratori incaricati della lavorazione. Vengono usate esclusivamente per creare e controllare il modello 3D.
        </p>

        <h2>Fornitori</h2>
        <ul>
          <li><strong>Supabase:</strong> database, autenticazione e storage.</li>
          <li><strong>Vercel:</strong> hosting dell’applicazione.</li>
        </ul>

        <h2>Conservazione</h2>
        <p>I dati restano disponibili finché l’account è attivo o finché sono necessari al servizio. Puoi chiederne cancellazione o modifica.</p>

        <h2>Diritti</h2>
        <ul>
          <li>accesso e copia dei dati;</li>
          <li>rettifica dei dati inesatti;</li>
          <li>cancellazione dell’account e dei contenuti;</li>
          <li>limitazione o opposizione al trattamento;</li>
          <li>reclamo al Garante per la protezione dei dati personali.</li>
        </ul>

        <p className="mt-8 rounded-app border border-asfalto/15 bg-cemento p-4 text-sm text-asfalto/60">
          Questo testo è una base informativa e non sostituisce la revisione di un professionista legale.
        </p>
      </div>
    </div>
  );
}
