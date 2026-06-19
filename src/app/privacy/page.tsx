export const metadata = {
  title: 'Privacy Policy — MotoGarage',
  description: 'Come MotoGarage tratta i dati personali degli utenti.',
};

const AGGIORNAMENTO = '18 giugno 2026';

export default function PaginaPrivacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">Legale</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-asfalto/50">
        Ultimo aggiornamento: {AGGIORNAMENTO}
      </p>

      <div className="mt-8 space-y-6 text-asfalto/85 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_p]:mt-2 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        <p>
          MotoGarage rispetta la tua privacy. Questa pagina spiega in modo chiaro
          quali dati raccogliamo, perché, e quali diritti hai. Usiamo solo i dati
          necessari a far funzionare il servizio.
        </p>

        <h2>Chi tratta i dati</h2>
        <p>
          Il titolare del trattamento è [TITOLARE — nome e dati da inserire].
          Per qualsiasi richiesta sui tuoi dati puoi scrivere a{' '}
          <a href="mailto:info@motogarage.it" className="text-cartello underline">
            info@motogarage.it
          </a>
          .
        </p>

        <h2>Quali dati raccogliamo</h2>
        <ul>
          <li>
            <strong>Dati dell&apos;account</strong>: email, username e password
            (la password è gestita in forma cifrata, non la vediamo mai in chiaro).
          </li>
          <li>
            <strong>Dati del profilo</strong> che scegli di inserire: foto, tipo
            di moto, eventuali informazioni che aggiungi.
          </li>
          <li>
            <strong>Contenuti che pubblichi</strong>: foto, commenti, giri
            registrati e relative statistiche (km, durata, tracciato GPS).
          </li>
          <li>
            <strong>Posizione</strong>: solo quando usi la registrazione di un
            giro o carichi una foto geolocalizzata, e solo se dai il permesso. La
            posizione non viene raccolta in background.
          </li>
          <li>
            <strong>Email per la lista d&apos;attesa</strong>: se ti iscrivi per
            essere avvisato del lancio del piano Pro.
          </li>
        </ul>

        <h2>Perché li usiamo</h2>
        <ul>
          <li>Per permetterti di accedere e usare il tuo account.</li>
          <li>Per mostrare i tuoi contenuti (foto, commenti, giri) nel sito e, se scegli di renderli pubblici, nella community.</li>
          <li>Per calcolare le tue statistiche e i badge.</li>
          <li>Per avvisarti, se lo hai chiesto, del lancio di nuove funzioni.</li>
        </ul>
        <p>
          Non vendiamo i tuoi dati a nessuno e non li usiamo per pubblicità di
          terzi.
        </p>

        <h2>Fornitori che ci aiutano</h2>
        <p>
          Per far funzionare il servizio ci appoggiamo ad alcuni fornitori
          affidabili, che trattano i dati per nostro conto:
        </p>
        <ul>
          <li><strong>Supabase</strong>: database e autenticazione (dove sono salvati account e contenuti).</li>
          <li><strong>Vercel</strong>: hosting del sito.</li>
          <li><strong>Stripe</strong>: gestione dei pagamenti, solo quando e se attiveremo il piano Pro a pagamento.</li>
        </ul>
        <p>
          Questi fornitori possono trattare i dati anche fuori dall&apos;Italia, nel
          rispetto delle garanzie previste dal GDPR.
        </p>

        <h2>Per quanto tempo li conserviamo</h2>
        <p>
          Conserviamo i tuoi dati finché hai un account attivo. Se chiedi la
          cancellazione, rimuoviamo i tuoi dati personali entro tempi ragionevoli,
          salvo quanto dobbiamo conservare per obblighi di legge.
        </p>

        <h2>I tuoi diritti</h2>
        <p>Secondo il GDPR hai diritto di:</p>
        <ul>
          <li>accedere ai tuoi dati e chiederne una copia;</li>
          <li>correggere dati errati;</li>
          <li>chiedere la cancellazione del tuo account e dei tuoi dati;</li>
          <li>opporti o limitare alcuni trattamenti;</li>
          <li>proporre reclamo al Garante per la protezione dei dati personali.</li>
        </ul>
        <p>
          Per esercitare questi diritti scrivi a{' '}
          <a href="mailto:info@motogarage.it" className="text-cartello underline">
            info@motogarage.it
          </a>
          .
        </p>

        <h2>Modifiche</h2>
        <p>
          Possiamo aggiornare questa policy. In caso di modifiche importanti lo
          segnaleremo nel sito. La data in alto indica l&apos;ultimo aggiornamento.
        </p>

        <p className="mt-8 rounded-app border border-asfalto/15 bg-cemento p-4 text-sm text-asfalto/60">
          Nota: questo testo è una base redatta in buona fede secondo le pratiche
          standard GDPR, non un parere legale. Prima di attivare i pagamenti è
          consigliabile farlo rivedere da un professionista.
        </p>
      </div>
    </div>
  );
}
