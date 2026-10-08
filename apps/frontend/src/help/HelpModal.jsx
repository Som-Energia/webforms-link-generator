import { useEffect, useRef } from "react";

const LINK_TYPES = [
  {
    title: "El teu enllaç personal",
    when: "Per a una contractació normal.",
    details:
      "És l'enllaç al formulari de contractació amb el teu usuari afegit. No caduca: el pots enviar quan vulguis i tantes vegades com calgui.",
  },
  {
    title: "Tarifa social",
    when: "Quan la persona té el bo social.",
    details:
      "Normalment el formulari no deixa continuar si el CUPS (el codi del punt de subministrament que surt a la factura de la llum) té tarifa social. Amb aquest enllaç, sí que es pot continuar.",
  },
  {
    title: "Enviament de signatura",
    when: "Quan la persona no pot signar en aquell moment.",
    details:
      "Al final del formulari apareix un botó per enviar la signatura per correu electrònic, perquè la persona pugui signar més tard des del seu correu.",
  },
];

export function HelpModal({ onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="help-modal-header">
          <h1 id="help-title">Com funciona el generador d'enllaços</h1>
          <button
            ref={closeButtonRef}
            type="button"
            className="help-modal-close"
            aria-label="Tanca l'ajuda"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.7 5.3a1 1 0 0 0-1.4 1.4L10.6 12l-5.3 5.3a1 1 0 1 0 1.4 1.4l5.3-5.3 5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 0 0-1.4-1.4L12 10.6 6.7 5.3Z" />
            </svg>
          </button>
        </header>

        <div className="help-modal-body">
          <section aria-labelledby="help-purpose">
            <h2 id="help-purpose">Per a què serveix?</h2>
            <p>
              Aquesta eina crea enllaços al formulari de contractació de Som
              Energia perquè els enviïs a les persones que acompanyes. Quan la
              persona contracta a través del teu enllaç, queda guardat que ha
              arribat gràcies a tu.
            </p>
            <p>
              També pots crear enllaços especials per a casos concrets, com
              persones amb bo social o que necessiten signar més tard.
            </p>
          </section>

          <section aria-labelledby="help-steps">
            <h2 id="help-steps">Pas a pas</h2>
            <ol className="help-steps">
              <li>
                <strong>Identifica't.</strong> La primera vegada et demanarem
                el teu usuari de l'ERP. Es queda guardat en aquest navegador.
                Si l'has de canviar, fes clic al teu nom, a dalt a la dreta, i
                tria <em>Editar</em>.
              </li>
              <li>
                <strong>Tria el formulari (només si cal).</strong> Si deixes la
                casella de l'adreça buida, es fa servir el formulari de
                contractació domèstica, que és el més habitual. Si necessites
                un altre formulari, obre'l al navegador, copia l'adreça de dalt
                de tot i enganxa-la a la casella.
              </li>
              <li>
                <strong>Decideix si vols afegir el teu usuari.</strong> Amb
                l'interruptor <em>Afegir el meu usuari</em> activat, els
                enllaços porten el teu usuari. Deixa'l activat sempre que
                vulguis que la contractació consti com a teva.
              </li>
              <li>
                <strong>Copia l'enllaç i envia'l.</strong> Fes clic al botó de
                copiar que hi ha al costat de cada enllaç i enganxa'l en un
                correu, un missatge o on el necessitis.
              </li>
            </ol>
          </section>

          <section aria-labelledby="help-link-types">
            <h2 id="help-link-types">Quin enllaç he de fer servir?</h2>
            <div className="help-link-types">
              {LINK_TYPES.map((linkType) => (
                <article key={linkType.title} className="help-link-type">
                  <h3>{linkType.title}</h3>
                  <p className="help-link-type-when">{linkType.when}</p>
                  <p>{linkType.details}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="help-tips">
            <h2 id="help-tips">Cal que tinguis en compte</h2>
            <ul className="help-tips">
              <li>
                Els enllaços de <strong>tarifa social</strong> i{" "}
                <strong>enviament de signatura</strong> caduquen al cap de 30
                minuts. Crea'ls just abans d'enviar-los. Si un enllaç ha
                caducat, prem una altra vegada <em>Genera l'enllaç</em> per
                tenir-ne un de nou.
              </li>
              <li>
                Si l'adreça del formulari no és correcta, la casella es posa
                en vermell i no es poden crear enllaços fins que la corregeixis
                o l'esborris amb la creu.
              </li>
              <li>
                Si apareix un missatge d'error en crear un enllaç, torna-ho a
                provar d'aquí a una estona. Si continua passant, copia el
                missatge i fes-lo arribar a l'equip tècnic.
              </li>
            </ul>
          </section>
        </div>

        <footer className="help-modal-footer">
          <button type="button" className="primary-button" onClick={onClose}>
            Entesos
          </button>
        </footer>
      </section>
    </div>
  );
}
