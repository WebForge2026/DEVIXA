import { fill, legal, type LegalDocs } from '@/lib/legal';

const p = (key: string) => `to be added: ${key}`;

export const en: LegalDocs = {
  imprint: {
    title: 'Legal notice',
    updatedLabel: `Last updated: ${legal.updated}`,
    sections: [
      {
        heading: 'Information pursuant to § 5 DDG (German Digital Services Act)',
        body: [
          `${legal.company} (${legal.companyBg})`,
          `Registered office: ${fill(legal.address, p('business address'))}, Bulgaria`,
          'Devixa is a brand of Creative Solutions 88 EOOD.',
        ],
      },
      {
        heading: 'Represented by',
        body: [`Managing director (Управител): ${fill(legal.managingDirector, p('managing director'))}`],
      },
      {
        heading: 'Contact',
        body: [
          `Email: ${legal.emails.office}`,
          `Support: ${legal.emails.support}`,
          `Phone Germany: ${legal.phones.de}`,
          `Phone Bulgaria: ${legal.phones.bg}`,
        ],
      },
      {
        heading: 'Company registration',
        body: [
          'Registered in the Commercial Register of the Registry Agency (Агенция по вписванията), Republic of Bulgaria.',
          `Unified identification code (UIC / ЕИК): ${fill(legal.uic, p('UIC'))}`,
        ],
      },
      {
        heading: 'VAT identification number',
        body: [`VAT ID: ${fill(legal.vatId, p('VAT ID'))}`],
      },
      {
        heading: 'Responsible for content pursuant to § 18 (2) MStV',
        body: [`${fill(legal.managingDirector, p('managing director'))}, address as above.`],
      },
      {
        heading: 'Consumer dispute resolution',
        body: ['We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.'],
      },
      {
        heading: 'Liability for content',
        body: [
          'The content of this website has been prepared with great care. However, we cannot guarantee that it is accurate, complete or up to date. As a service provider we are responsible for our own content under general law, but we are not obliged to monitor third-party information transmitted or stored.',
        ],
      },
      {
        heading: 'Liability for links',
        body: [
          'This website contains links to external third-party websites whose content we cannot influence. The respective provider or operator is always responsible for that content. If we become aware of any legal infringement, we will remove such links immediately.',
        ],
      },
      {
        heading: 'Copyright',
        body: [
          'The content, design and graphics on this website are protected by copyright. Any reproduction, editing, distribution or other use beyond the limits of copyright law requires the written consent of Creative Solutions 88 EOOD.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    updatedLabel: `Last updated: ${legal.updated}`,
    sections: [
      {
        heading: '1. Controller',
        body: [
          `The controller responsible for data processing on this website within the meaning of the General Data Protection Regulation (GDPR) is: ${legal.company}, ${fill(legal.address, p('business address'))}, Bulgaria.`,
          `Represented by: ${fill(legal.managingDirector, p('managing director'))}. Email: ${legal.emails.office}, phone: ${legal.phones.de}.`,
        ],
      },
      {
        heading: '2. Overview',
        body: [
          'We only process personal data where this is necessary to operate this website and to answer your enquiries. We do not use third-party tracking tools, advertising cookies or social media plugins; we count visits anonymously and without cookies on our own server (section 7).',
        ],
      },
      {
        heading: '3. Hosting and server log files',
        body: [
          `This website is hosted by: ${fill(legal.hostingProvider, p('hosting provider with address'))}. When you visit the website, the hosting provider automatically processes technical data sent by your browser: IP address, date and time of access, page requested, referrer URL, browser type and operating system.`,
          'This data is required to deliver the website and to ensure its stability and security. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in secure and reliable operation). Log data is kept only as long as necessary for these purposes and then deleted.',
        ],
      },
      {
        heading: '4. Contact form and cost calculator',
        body: [
          'When you send us an enquiry via the contact form, we process your name, email address, optionally your company, the project type, the estimated budget and your message. When you send a configuration from the cost calculator, we process the selected options, the calculated estimate and your email address.',
          'The purpose is to handle and answer your enquiry and, where applicable, to prepare a quote. The legal basis is Art. 6(1)(b) GDPR (pre-contractual measures) and, where your enquiry is not related to a contract, Art. 6(1)(f) GDPR (legitimate interest in answering enquiries).',
          `The data is stored in a database operated by Supabase Inc. in a data centre in the EU (region: ${legal.databaseRegion}). Supabase processes the data solely on our behalf under a data processing agreement pursuant to Art. 28 GDPR.`,
          'We delete your enquiry data as soon as it is no longer required — at the latest six months after our communication has ended if no contract is concluded. If a contract is concluded, statutory retention periods apply.',
        ],
      },
      {
        heading: '5. Contact by email or phone',
        body: [
          'If you contact us by email or phone, we process the data you provide in order to handle your request. The legal basis is Art. 6(1)(b) or (f) GDPR. Section 4 applies accordingly to deletion.',
        ],
      },
      {
        heading: '6. Cookies and local storage',
        body: [
          'We only use one technically necessary cookie ("NEXT_LOCALE"), which stores your chosen language for one year. It contains no personal data and is not used for tracking. Storing it requires no consent, as it is strictly necessary to display the website in the language you requested (§ 25(2) no. 2 TDDDG, Art. 5(3) ePrivacy Directive).',
        ],
      },
      {
        heading: '7. Anonymous visitor statistics (no cookies)',
        body: [
          'To understand how this website is used, we count page views on our own server — without cookies and without storing anything on your device. We record the page, the language, the time and whether the cost calculator was viewed or used.',
          'To tell visits apart, we combine IP address and browser identifier with a secret value that changes daily and store only a shortened checksum (hash). The IP address and browser identifier themselves are not stored; recognising you across days or identifying you is not possible. If your browser sends "Do Not Track" or "Global Privacy Control", nothing is counted.',
          'The legal basis is Art. 6(1)(f) GDPR (legitimate interest in improving our services). Statistics are deleted after 13 months at the latest.',
        ],
      },
      {
        heading: '8. Fonts',
        body: ['The fonts used on this website are served locally from our own server. No connection is made to Google or other font providers.'],
      },
      {
        heading: '9. External links',
        body: [
          'Our website contains links to websites of client projects. Data is only transferred to the respective operator once you click such a link. That operator is responsible for any processing on their website.',
        ],
      },
      {
        heading: '10. Recipients and transfers to third countries',
        body: [
          'Your data is only accessible to our staff insofar as they need it to handle your enquiry, and to the processors named above (hosting, database). We do not share data for advertising purposes.',
          'Where a service provider is based outside the EU, data is only transferred on the basis of an adequacy decision of the European Commission (e.g. the EU-U.S. Data Privacy Framework) or the EU standard contractual clauses pursuant to Art. 46(2)(c) GDPR.',
        ],
      },
      {
        heading: '11. Your rights',
        body: [
          'You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and data portability (Art. 20), as well as the right to withdraw any consent at any time with effect for the future (Art. 7(3) GDPR).',
          'Right to object: where we process your data on the basis of Art. 6(1)(f) GDPR, you may object to the processing at any time on grounds relating to your particular situation (Art. 21 GDPR).',
          `To exercise your rights, simply send an email to ${legal.emails.office}.`,
        ],
      },
      {
        heading: '12. Right to lodge a complaint',
        body: [
          'You have the right to lodge a complaint with a data protection supervisory authority, in particular in the member state of your habitual residence, place of work or the place of the alleged infringement. The authority responsible for us is the Bulgarian Commission for Personal Data Protection (Комисия за защита на личните данни), 2 Prof. Tsvetan Lazarov Blvd., 1592 Sofia, www.cpdp.bg.',
        ],
      },
      {
        heading: '13. Data security',
        body: [
          'This website uses TLS encryption, which you can recognise by the padlock symbol in your browser’s address bar. Access to stored enquiries is restricted to authorised persons.',
        ],
      },
      {
        heading: '14. No automated decision-making',
        body: ['We do not use automated decision-making, including profiling, within the meaning of Art. 22 GDPR.'],
      },
      {
        heading: '15. Changes',
        body: ['We update this privacy policy when the law or our data processing changes. The version published on this page applies.'],
      },
    ],
  },
};
