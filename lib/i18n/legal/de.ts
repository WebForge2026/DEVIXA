import { fill, legal, type LegalDocs } from '@/lib/legal';

const p = (key: string) => `bitte ergänzen: ${key}`;

export const de: LegalDocs = {
  imprint: {
    title: 'Impressum',
    updatedLabel: `Stand: ${legal.updated}`,
    sections: [
      {
        heading: 'Angaben gemäß § 5 DDG',
        body: [
          `${legal.company} (${legal.companyBg})`,
          `Eingetragener Sitz: ${fill(legal.address, p('Geschäftsadresse'))}, Bulgarien`,
          'Devixa ist eine Marke der Creative Solutions 88 EOOD.',
        ],
      },
      {
        heading: 'Vertreten durch',
        body: [`Geschäftsführer (Управител): ${fill(legal.managingDirector, p('Name des Geschäftsführers'))}`],
      },
      {
        heading: 'Kontakt',
        body: [
          `E-Mail: ${legal.emails.office}`,
          `Support: ${legal.emails.support}`,
          `Telefon Deutschland: ${legal.phones.de}`,
          `Telefon Bulgarien: ${legal.phones.bg}`,
        ],
      },
      {
        heading: 'Registereintrag',
        body: [
          'Eingetragen im Handelsregister der Agentur für Eintragungen (Агенция по вписванията), Republik Bulgarien.',
          `Einheitliche Identifikationsnummer (ЕИК): ${fill(legal.uic, p('ЕИК'))}`,
        ],
      },
      {
        heading: 'Umsatzsteuer-Identifikationsnummer',
        body: [`USt-IdNr.: ${fill(legal.vatId, p('USt-IdNr.'))}`],
      },
      {
        heading: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
        body: [`${fill(legal.managingDirector, p('Name des Geschäftsführers'))}, Anschrift wie oben.`],
      },
      {
        heading: 'Verbraucherstreitbeilegung',
        body: [
          'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        ],
      },
      {
        heading: 'Haftung für Inhalte',
        body: [
          'Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.',
        ],
      },
      {
        heading: 'Haftung für Links',
        body: [
          'Unsere Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.',
        ],
      },
      {
        heading: 'Urheberrecht',
        body: [
          'Die auf dieser Website erstellten Inhalte, Gestaltungen und Grafiken unterliegen dem Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der Creative Solutions 88 EOOD.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Datenschutzerklärung',
    updatedLabel: `Stand: ${legal.updated}`,
    sections: [
      {
        heading: '1. Verantwortlicher',
        body: [
          `Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist: ${legal.company}, ${fill(legal.address, p('Geschäftsadresse'))}, Bulgarien.`,
          `Vertreten durch: ${fill(legal.managingDirector, p('Name des Geschäftsführers'))}. E-Mail: ${legal.emails.office}, Telefon: ${legal.phones.de}.`,
        ],
      },
      {
        heading: '2. Überblick',
        body: [
          'Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb dieser Website und die Beantwortung Ihrer Anfragen erforderlich ist. Wir setzen keine Tracking-Tools von Drittanbietern, keine Werbe-Cookies und keine Social-Media-Plugins ein; Besuche zählen wir anonym und ohne Cookies auf unserem eigenen Server (Abschnitt 7).',
        ],
      },
      {
        heading: '3. Hosting und Server-Logfiles',
        body: [
          `Diese Website wird gehostet bei: ${fill(legal.hostingProvider, p('Hosting-Anbieter mit Anschrift'))}. Beim Aufruf der Website verarbeitet der Hosting-Anbieter automatisch technische Daten, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Referrer-URL, Browsertyp und Betriebssystem.`,
          'Diese Daten sind erforderlich, um die Website auszuliefern sowie ihre Stabilität und Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Betrieb). Die Logdaten werden nur so lange gespeichert, wie es für diese Zwecke erforderlich ist, und anschließend gelöscht.',
        ],
      },
      {
        heading: '4. Kontaktformular und Kostenrechner',
        body: [
          'Wenn Sie uns über das Kontaktformular eine Anfrage senden, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, optional Ihr Unternehmen, die Projektart, das geschätzte Budget und Ihre Nachricht. Wenn Sie eine Konfiguration aus dem Kostenrechner senden, verarbeiten wir die gewählten Optionen, den berechneten Richtwert und Ihre E-Mail-Adresse.',
          'Zweck ist die Bearbeitung und Beantwortung Ihrer Anfrage sowie gegebenenfalls die Erstellung eines Angebots. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) und, soweit Ihre Anfrage keinen Vertragsbezug hat, Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).',
          `Die Daten werden in einer Datenbank des Anbieters Supabase Inc. gespeichert, die in einem Rechenzentrum in der EU betrieben wird (Region: ${legal.databaseRegion}). Supabase verarbeitet die Daten ausschließlich in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags nach Art. 28 DSGVO.`,
          'Wir löschen Ihre Anfragedaten, sobald sie nicht mehr erforderlich sind — spätestens sechs Monate nach Abschluss der Kommunikation, sofern kein Vertrag zustande kommt. Kommt ein Vertrag zustande, gelten die gesetzlichen Aufbewahrungsfristen.',
        ],
      },
      {
        heading: '5. Kontakt per E-Mail oder Telefon',
        body: [
          'Wenn Sie uns per E-Mail oder Telefon kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung Ihres Anliegens. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO. Für die Löschung gilt Abschnitt 4 entsprechend.',
        ],
      },
      {
        heading: '6. Cookies und lokale Speicherung',
        body: [
          'Wir verwenden ausschließlich ein technisch notwendiges Cookie („NEXT_LOCALE“), das Ihre gewählte Sprache für ein Jahr speichert. Es enthält keine personenbezogenen Daten und wird nicht für Tracking genutzt. Die Speicherung ist nach § 25 Abs. 2 Nr. 2 TDDDG ohne Einwilligung zulässig, weil sie für die von Ihnen gewünschte Darstellung in Ihrer Sprache erforderlich ist.',
        ],
      },
      {
        heading: '7. Anonyme Besucherstatistik (ohne Cookies)',
        body: [
          'Um die Nutzung dieser Website zu verstehen, zählen wir Seitenaufrufe auf unserem eigenen Server — ohne Cookies und ohne Speicherung auf Ihrem Gerät. Erfasst werden die aufgerufene Seite, die Sprache, der Zeitpunkt und ob der Kostenrechner angesehen oder benutzt wurde.',
          'Zur Unterscheidung von Besuchen bilden wir aus IP-Adresse und Browserkennung zusammen mit einem geheimen, täglich wechselnden Wert eine verkürzte Prüfsumme (Hash). IP-Adresse und Browserkennung selbst werden nicht gespeichert; ein Wiedererkennen über Tage hinweg oder eine Zuordnung zu Ihrer Person ist nicht möglich. Senden Sie das Signal „Do Not Track“ oder „Global Privacy Control“, findet keine Zählung statt.',
          'Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Verbesserung unseres Angebots). Die Statistikdaten werden nach spätestens 13 Monaten gelöscht.',
        ],
      },
      {
        heading: '8. Schriftarten',
        body: [
          'Die auf dieser Website verwendeten Schriftarten werden lokal von unserem Server ausgeliefert. Es findet keine Verbindung zu Servern von Google oder anderen Schriftanbietern statt.',
        ],
      },
      {
        heading: '9. Externe Links',
        body: [
          'Unsere Website enthält Links zu Websites von Kundenprojekten. Erst wenn Sie einen solchen Link anklicken, werden Daten an den jeweiligen Betreiber übertragen. Für die Datenverarbeitung dort ist der jeweilige Betreiber verantwortlich.',
        ],
      },
      {
        heading: '10. Empfänger und Übermittlung in Drittländer',
        body: [
          'Ihre Daten erhalten nur unsere Mitarbeiter, soweit sie diese zur Bearbeitung Ihrer Anfrage benötigen, sowie die genannten Auftragsverarbeiter (Hosting, Datenbank). Eine Weitergabe zu Werbezwecken findet nicht statt.',
          'Sofern ein Dienstleister seinen Sitz außerhalb der EU hat, erfolgt eine Übermittlung nur auf Grundlage eines Angemessenheitsbeschlusses der EU-Kommission (z. B. EU-U.S. Data Privacy Framework) oder der EU-Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO.',
        ],
      },
      {
        heading: '11. Ihre Rechte',
        body: [
          'Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie das Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO).',
          'Widerspruchsrecht: Soweit wir Ihre Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen die Verarbeitung einlegen (Art. 21 DSGVO).',
          `Zur Ausübung Ihrer Rechte genügt eine E-Mail an ${legal.emails.office}.`,
        ],
      },
      {
        heading: '12. Beschwerderecht bei einer Aufsichtsbehörde',
        body: [
          'Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren — insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes. Für uns zuständig ist die bulgarische Kommission für den Schutz personenbezogener Daten (Комисия за защита на личните данни), бул. „Проф. Цветан Лазаров“ 2, 1592 Sofia, www.cpdp.bg.',
        ],
      },
      {
        heading: '13. Datensicherheit',
        body: [
          'Diese Website nutzt eine TLS-Verschlüsselung. Sie erkennen eine verschlüsselte Verbindung am Schloss-Symbol in der Adresszeile Ihres Browsers. Der Zugriff auf gespeicherte Anfragen ist auf berechtigte Personen beschränkt.',
        ],
      },
      {
        heading: '14. Keine automatisierte Entscheidungsfindung',
        body: ['Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO findet nicht statt.'],
      },
      {
        heading: '15. Änderungen',
        body: [
          'Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage oder unsere Datenverarbeitung ändert. Es gilt die jeweils auf dieser Seite veröffentlichte Fassung.',
        ],
      },
    ],
  },
};
