import type { Article } from './types';

export const de: Article[] = [
  {
    slug: 'ai-agent-automation',
    title: 'Was kann ein KI-Agent in einem Unternehmen automatisieren?',
    category: 'KI & Prozessautomatisierung',
    metaDescription: 'Welche Aufgaben ein KI-Agent im Unternehmen sinnvoll übernimmt, wo feste Regeln besser sind — und wie Sie Prozesse sicher automatisieren.',
    lede: 'Weniger, als der Hype verspricht — mehr, als die meisten Teams nutzen. Die sinnvolle Frage lautet nicht „Kann KI das?“, sondern „Welcher Teil dieses Prozesses braucht Urteilsvermögen bei unstrukturierten Eingaben?“',
    readMinutes: 5,
    sections: [
      {
        heading: 'Mit dem Prozess beginnen, nicht mit dem Modell',
        body: [
          'Die meisten Geschäftsprozesse sind eine Kette von Schritten: Etwas kommt an, jemand liest es, entscheidet, worum es geht, überträgt Daten und stößt den nächsten Schritt an. Nur einige dieser Schritte brauchen Intelligenz. Der Rest sind Regeln.',
          'Ein KI-Agent lohnt sich dort, wo die Eingabe unordentlich ist — Freitext, gescannte Dokumente, Sprachnachrichten, uneinheitliche Kundenanfragen — und heute ein Mensch Zeit mit der Interpretation verbringt.',
        ],
      },
      {
        heading: 'Gute Kandidaten',
        body: [
          'Eingehende Anfragen klassifizieren und an die richtige Person oder das richtige System weiterleiten. Strukturierte Felder (Auftragsnummern, Daten, Beträge, Adressen) aus E-Mails und Dokumenten extrahieren. Antworten entwerfen, die ein Mensch freigibt. Lange Verläufe, Gespräche oder Berichte zusammenfassen. Internes Wissen in natürlicher Sprache statt mit Stichworten durchsuchen.',
          'In jedem Fall macht die KI aus unstrukturierten Eingaben strukturierte Daten — und ab dort übernimmt normale Software.',
        ],
      },
      {
        heading: 'Schlechte Kandidaten',
        body: [
          'Berechnungen, Preise, Rechnungen, Lagerbestände, Berechtigungen und alles mit rechtlichen oder finanziellen Folgen sollte deterministisch bleiben. Eine Regel, die zu 100 % stimmt, schlägt ein Modell, das zu 98 % stimmt.',
          'Wenn sich ein Schritt als Wenn-dann-Regel formulieren lässt, schreiben Sie die Regel.',
        ],
      },
      {
        heading: 'Menschen dort einbinden, wo es zählt',
        body: [
          'Das sicherste Muster: Die KI schlägt vor, das System prüft, ein Mensch bestätigt alles mit Konsequenzen. Jede KI-Entscheidung wird mit ihrer Eingabe protokolliert, damit Fehler nachvollziehbar sind und Prompts verbessert werden können.',
          'Die Daten bleiben in der EU — mit Anbietern und Einstellungen, die verhindern, dass Geschäftsdaten zum Modelltraining verwendet werden.',
        ],
      },
    ],
    takeaway: 'Erst den Prozess abbilden. KI zum Lesen, Klassifizieren und Extrahieren nutzen — Geschäftsregeln bleiben Code.',
  },
  {
    slug: 'ai-document-processing',
    title: 'KI-Workflows für die Dokumentenverarbeitung',
    category: 'KI & Dokumentenverarbeitung',
    metaDescription: 'Wie KI Rechnungen, Lieferscheine und Verträge ausliest, prüft und ins ERP überträgt — mit Validierung und Prüfliste statt Abtippen.',
    lede: 'Rechnungen, Lieferscheine, Verträge, Formulare: In Dokumenten werden Daten abgetippt. Ein guter Workflow liest sie einmal und legt die Daten dort ab, wo sie hingehören.',
    readMinutes: 4,
    sections: [
      {
        heading: 'Der typische Medienbruch',
        body: [
          'Ein PDF kommt per E-Mail. Jemand öffnet es, liest Lieferant, Beträge und Bestellreferenz und tippt sie ins ERP oder die Buchhaltung. Das funktioniert — bis das Volumen wächst, jemand im Urlaub ist oder ein Tippfehler eine Woche Abstimmung kostet.',
        ],
      },
      {
        heading: 'So sieht ein Workflow aus',
        body: [
          'Eingang: Dokumente werden automatisch aus einem Postfach, Upload-Formular oder freigegebenen Ordner gesammelt. Erkennung: OCR macht aus Scans Text; ein KI-Modell erkennt den Dokumenttyp und extrahiert die definierten Felder. Prüfung: Deterministische Checks gleichen das Ergebnis mit Ihren Daten ab — existiert der Lieferant, passt die Bestellnummer, stimmen die Summen?',
          'Übergabe: Saubere Datensätze gehen per API direkt ins Zielsystem. Alles Unsichere landet in einer Prüfliste, mit dem Originaldokument daneben.',
        ],
      },
      {
        heading: 'Warum die Prüfung der wichtigste Teil ist',
        body: [
          'Extraktion ist nie perfekt. Der Wert entsteht durch das Wissen, welche Ergebnisse automatisch gebucht werden dürfen und welche ein Mensch ansehen muss. Konfidenzschwellen und Abgleiche mit vorhandenen Daten machen diese Entscheidung explizit und prüfbar.',
        ],
      },
      {
        heading: 'Wo man anfängt',
        body: [
          'Wählen Sie einen Dokumenttyp mit hohem Volumen und klarem Zielsystem. Messen Sie, wie lange er heute dauert. Bauen Sie den Workflow, lassen Sie ihn einige Wochen parallel zum manuellen Prozess laufen und stellen Sie um, sobald die Prüfliste klein bleibt.',
        ],
      },
    ],
    takeaway: 'Extraktion ist der einfache Teil. Prüfung und eine saubere Prüfliste machen Dokumentenautomatisierung vertrauenswürdig.',
  },
  {
    slug: 'ai-email-automation',
    title: 'KI-E-Mail-Automatisierung vom Posteingang zum Workflow',
    category: 'Automatisierung & Integration',
    metaDescription: 'Wie KI-E-Mail-Automatisierung Anfragen klassifiziert, Daten extrahiert und Vorgänge in Ihren Systemen anlegt — DSGVO-konform in der EU.',
    lede: 'Für viele Unternehmen ist das gemeinsame Postfach das eigentliche Betriebssystem. Bestellungen, Fragen, Reklamationen und Anhänge kommen am selben Ort an — und gehen als Handarbeit wieder hinaus.',
    readMinutes: 4,
    sections: [
      {
        heading: 'Das Postfach als unstrukturierte Warteschlange',
        body: [
          'Jede E-Mail braucht dieselben ersten Schritte: Was ist das, von wem kommt es, was will die Person, wohin gehört es? Diese Sichtung passiert Dutzende oder Hunderte Male am Tag, und das Wissen über offene Vorgänge steckt in einzelnen Postfächern.',
        ],
      },
      {
        heading: 'Von der E-Mail zum strukturierten Vorgang',
        body: [
          'Eine Automatisierung liest jede eingehende Nachricht samt Anhängen, erkennt den Absender (Kunde, Lieferant, Partner), klassifiziert das Anliegen (Bestellung, Anfrage, Reklamation, Rechnung) und extrahiert die relevanten Daten.',
          'Das Ergebnis ist ein strukturierter Vorgang in Ihrem System — eine Buchung, ein Auftrag, ein Ticket — verknüpft mit der Original-E-Mail. Einfache, wiederkehrende Anfragen erhalten einen Antwortentwurf zur Freigabe per Klick.',
        ],
      },
      {
        heading: 'Integration ist der Multiplikator',
        body: [
          'Der eigentliche Gewinn entsteht, wenn der E-Mail-Workflow mit Ihren anderen Systemen spricht: den Auftragsstatus im ERP prüfen, bevor eine Antwort entworfen wird, den Kunden im CRM anlegen oder das richtige Team im Chat benachrichtigen. Ohne Integration verschiebt KI das Kopieren und Einfügen nur einen Schritt nach hinten.',
        ],
      },
      {
        heading: 'Leitplanken',
        body: [
          'Nichts wird automatisch versendet ohne Regeln, denen Sie zugestimmt haben. Jede Klassifizierung ist sichtbar und korrigierbar, Korrekturen fließen in die Konfiguration zurück. E-Mail-Daten werden auf EU-Infrastruktur verarbeitet.',
        ],
      },
    ],
    takeaway: 'E-Mails in strukturierte Vorgänge verwandeln, mit Ihren Systemen verbinden — und Menschen freigeben statt abtippen lassen.',
  },
];
