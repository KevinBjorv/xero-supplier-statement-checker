import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight, Download } from "lucide-react";
import { BookingSheet } from "../../components/booking-sheet";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { BOOKING_URL, SITE_URL } from "../../lib/site";
import { languageAlternates } from "../../lib/locales";
import "./checker.css";

const title = "Kontroller leverandørutskrifter mot Xero | Bjorvand AI";
const description = "Sammenlign fakturareferanser og opprinnelige beløp med Xero. Få en rapport med avvik, kildereferanser og tydelige punkter for manuell kontroll.";
const route = "/workflows/xero-supplier-statement-checker";
const download = "https://github.com/KevinBjorv/xero-supplier-statement-checker/releases/download/v0.1.0/xero-supplier-statement-checker.json";
const sample = "/workflow-assets/xero-statement/sample-report.html";
const task = "Sette opp kontroll av leverandørutskrifter mot Xero";

export const metadata: Metadata = {
  title, description, alternates: languageAlternates(`${SITE_URL}${route}`),
  openGraph: { title, description, url: `${SITE_URL}${route}`, type: "website", locale: "nb_NO" },
};

function ImplementLink({ location }: { location: string }) {
  return <a className="button" href={`${BOOKING_URL}?oppgave=${encodeURIComponent(task)}`} data-booking-link data-booking-location={location} data-booking-task={task} data-booking-note="">Få arbeidsflyten satt opp<ArrowUpRight size={18} aria-hidden="true" /></a>;
}

export default function SupplierStatementCheckerPage() {
  return (
    <div className="checker-page">
      <a className="skip-link" href="#innhold">Hopp til innholdet</a>
      <SiteHeader bookingLocation="xero-checker-header" bookingTask={task} />
      <main id="innhold">
        <section className="shell checker-hero">
          <div>
            <h1>Leverandørutskriften sier én ting.<br /><span>Hva ligger i Xero?</span></h1>
            <p className="checker-lead">Last opp utskriften. Velg leverandøren. Få en konkret liste over hvilke linjer som stemmer, avviker eller trenger en nærmere titt.</p>
            <p>Arbeidsflyten sammenligner fakturareferanser og opprinnelige fakturabeløp. Du får kilden bak hvert resultat, og ingenting bokføres eller sendes.</p>
            <div className="checker-actions"><a className="button button-secondary" href={download}><Download size={18} aria-hidden="true" />Last ned arbeidsflyten</a><ImplementLink location="xero-checker-hero" /></div>
            <a className="checker-text-link" href="#eksempel">Se rapporten først<ArrowDown size={16} aria-hidden="true" /></a>
          </div>
          <div className="checker-report-preview" aria-label="Eksempel på rapport med syntetiske data">
            <div className="checker-report-top"><strong>Xero Supplier Statement Checker</strong><span>Syntetisk eksempel</span></div>
            <div className="checker-counts"><div><strong>2</strong><span>Samsvar</span></div><div><strong>1</strong><span>Beløpsavvik</span></div><div><strong>1</strong><span>Ikke funnet</span></div><div><strong>6</strong><span>Må vurderes</span></div></div>
            <div className="checker-example-line"><span>INV-101</span><strong>250,00 / 245,00 GBP</strong><p>Opprinnelige beløp avviker. Kontroller fakturaen og begge registreringene.</p></div>
            <div className="checker-example-line"><span>INV-107</span><strong>Utestående beløp alene</strong><p>Referansen finnes. Beløpet må vurderes fordi opprinnelig fakturatotal mangler.</p></div>
            <p className="checker-caption">10 linjer. Alle er med i rapporten. Tallene kommer fra den publiserte testfilen.</p>
          </div>
        </section>

        <section id="eksempel" className="shell checker-section checker-two-columns">
          <div><h2>Start med avvikene.<br />Behold grunnlaget.</h2><p className="checker-lead">Du skal kunne se hvorfor en linje ble markert, og finne tilbake til dokumentet.</p></div>
          <div><p>Rapporten viser fakturareferanse, side eller rad i utskriften, sammenlignede beløp, aktuelle Xero-fakturaer og et forslag til neste kontroll.</p><p>Eksempelet inneholder blant annet en betalt faktura, et beløpsavvik, en kreditnota, duplikater og en linje med bare utestående beløp. Alle data er oppdiktet.</p><a className="checker-text-link" href={sample} target="_blank" rel="noreferrer">Åpne hele eksempelrapporten på engelsk<ArrowUpRight size={16} aria-hidden="true" /></a></div>
        </section>

        <section className="checker-dark"><div className="shell checker-section"><h2>Fra utskrift til kontrolliste.</h2><ol className="checker-steps"><li><h3>Last opp og velg</h3><p>Bruk en tekstbasert PDF eller UTF-8 CSV. Velg én Xero-organisasjon, leverandør, valuta og utskriftsdato.</p></li><li><h3>Bekreft linjene</h3><p>Se gjennom uttrekket, korriger ved behov og bekreft at alle transaksjonslinjene er med. PDF-uttrekk bruker valgfritt OpenAI.</p></li><li><h3>Kontroller og last ned</h3><p>Arbeidsflyten henter også eldre og betalte fakturaer. Du får HTML, CSV og JSON samlet i en ZIP-fil.</p></li></ol></div></section>

        <section className="shell checker-section checker-two-columns"><h2>Tydelige grenser.<br />Synlig usikkerhet.</h2><div><ul className="checker-limits"><li>Kun lesetilgang til Xero. Ingen posteringer eller automatisk e-post.</li><li>En utestående saldo sammenlignes aldri med en opprinnelig fakturatotal.</li><li>Krediteringer, delbetalinger, kanselleringer, duplikater og tvetydige treff krever vurdering.</li><li>Ufullstendig uthenting stopper kontrollen. Den gir ikke et falskt «ikke funnet».</li><li>Dagens Xero-data er ikke et historisk øyeblikksbilde fra utskriftsdatoen.</li><li>Skannede dokumenter, valutaomregning og full saldo- eller betalingsavstemming er utenfor omfanget.</li></ul><p>Et avvik er en observasjon. Det fastslår ikke gjeld, manglende bilag eller regnskapsfeil.</p></div></section>

        <section className="shell checker-section checker-two-columns"><h2>Dette trenger du.</h2><div><p>En n8n-installasjon du kontrollerer, tilgang til riktig Xero-organisasjon og en egen Xero OAuth-app med lesetilgang. Oppsettet bruker standardnoder og er laget for n8n Cloud og egen drift.</p><p>CSV og testeksempelet krever ingen AI-nøkkel. PDF-uttrekk krever en OpenAI API-nøkkel og tillatelse til å sende dokumentteksten dit. Xero-data sendes ikke til AI for matching.</p><p>Du dekker eventuell n8n-drift, Xero-appabonnement og OpenAI-bruk. Pris og datalagring avhenger av leverandørene og oppsettet ditt. Veiledningen forklarer begrensninger, logging og sletting.</p><p>Koden og malen er tilgjengelige med MIT-lisens. Oppsett, tilpasning og eventuell oppfølging avtales separat.</p></div></section>

        <section className="checker-closing shell checker-section"><h2>Prøv selv.<br />Eller få det satt opp for teamet.</h2><p className="checker-lead">Ta med en representativ utskrift og beskriv hvordan dere kontrollerer den i dag. Vi avklarer format, tilganger, manuelle kontrollpunkter og pris før arbeidet starter.</p><div className="checker-actions"><a className="button button-secondary" href={download}><Download size={18} aria-hidden="true" />Last ned arbeidsflyten</a><ImplementLink location="xero-checker-closing" /></div></section>
      </main>
      <SiteFooter />
      <BookingSheet bookingUrl={BOOKING_URL} />
    </div>
  );
}
