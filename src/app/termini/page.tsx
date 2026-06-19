export const metadata = {
  title: 'Termini di Servizio — MotoGarage',
  description: 'Le condizioni d\'uso della piattaforma MotoGarage.',
};

const AGGIORNAMENTO = '18 giugno 2026';

export default function PaginaTermini() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">Legale</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Termini di Servizio
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-asfalto/50">
        Ultimo aggiornamento: {AGGIORNAMENTO}
      </p>

      <div className="mt-8 space-y-6 text-asfalto/85 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_p]:mt-2 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        <p>
          Usando MotoGarage accetti questi termini. Sono scritti in modo semplice:
          l&apos;idea è che ci si comporti da persone civili e che la strada resti
          una cosa seria.
        </p>

        <h2>Cos&apos;è MotoGarage</h2>
        <p>
          MotoGarage è una piattaforma che raccoglie itinerari in moto, permette di
          registrare i propri giri, caricare foto e partecipare alla community. Gli
          itinerari sono proposti e aggiornati dagli utenti e dalla redazione.
        </p>

        <h2>Sicurezza prima di tutto</h2>
        <p>
          Gli itinerari e le informazioni sono indicativi. Le condizioni della
          strada cambiano: lavori, frane, meteo, chiusure. Prima di partire
          verifica sempre lo stato del percorso. Guida nel rispetto del codice
          della strada e dei limiti di velocità: MotoGarage non incoraggia in alcun
          modo comportamenti pericolosi o illegali. Sei l&apos;unico responsabile
          della tua guida.
        </p>

        <h2>Il tuo account</h2>
        <ul>
          <li>Devi fornire informazioni veritiere e tenere riservata la password.</li>
          <li>Sei responsabile di quello che accade dal tuo account.</li>
          <li>Devi avere almeno 16 anni (o l&apos;età minima prevista nel tuo Paese per dare consenso al trattamento dei dati).</li>
        </ul>

        <h2>I contenuti che pubblichi</h2>
        <p>
          Resti proprietario delle tue foto e dei tuoi contenuti. Pubblicandoli su
          MotoGarage ci dai il permesso di mostrarli all&apos;interno del servizio.
          Ti impegni a non caricare contenuti:
        </p>
        <ul>
          <li>di cui non hai i diritti;</li>
          <li>offensivi, illegali, violenti o che violano la privacy altrui;</li>
          <li>che incoraggiano comportamenti pericolosi alla guida.</li>
        </ul>
        <p>
          Possiamo rimuovere contenuti che violano queste regole e, nei casi gravi,
          sospendere l&apos;account.
        </p>

        <h2>Piano Pro</h2>
        <p>
          Alcune funzioni potranno in futuro essere riservate a un piano Pro a
          pagamento. Le condizioni economiche e di rinnovo saranno indicate con
          chiarezza al momento dell&apos;attivazione, prima di qualsiasi addebito.
        </p>

        <h2>Limitazione di responsabilità</h2>
        <p>
          MotoGarage è offerto &laquo;così com&apos;è&raquo;. Facciamo del nostro
          meglio per tenere le informazioni accurate e il servizio funzionante, ma
          non possiamo garantire l&apos;assenza di errori o interruzioni. Non siamo
          responsabili per danni derivanti dall&apos;uso del servizio o dalla
          guida, nei limiti consentiti dalla legge.
        </p>

        <h2>Modifiche e chiusura</h2>
        <p>
          Possiamo aggiornare questi termini o il servizio. Le modifiche rilevanti
          verranno segnalate nel sito. Puoi chiudere il tuo account quando vuoi.
        </p>

        <h2>Contatti</h2>
        <p>
          Per qualsiasi domanda:{' '}
          <a href="mailto:info@motogarage.it" className="text-cartello underline">
            info@motogarage.it
          </a>
          .
        </p>

        <p className="mt-8 rounded-app border border-asfalto/15 bg-cemento p-4 text-sm text-asfalto/60">
          Nota: questo testo è una base redatta in buona fede, non un parere
          legale. Prima di attivare i pagamenti è consigliabile farlo rivedere da
          un professionista.
        </p>
      </div>
    </div>
  );
}
