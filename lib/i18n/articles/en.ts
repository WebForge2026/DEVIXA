import type { Article } from './types';

export const en: Article[] = [
  {
    slug: 'ai-agent-automation',
    title: 'What can an AI agent automate in a business?',
    category: 'AI & Process Automation',
    metaDescription: 'Which tasks an AI agent can sensibly take over in a business, where fixed rules work better — and how to automate processes safely.',
    lede: 'Less than the hype suggests, more than most teams use. The useful question is not "can AI do this?" but "which part of this process needs judgement on unstructured input?"',
    readMinutes: 5,
    sections: [
      {
        heading: 'Start with the process, not the model',
        body: [
          'Most business processes are a chain of steps: something arrives, someone reads it, decides what it is, copies data somewhere, and triggers the next step. Only some of those steps need intelligence. The rest are rules.',
          'An AI agent earns its place where the input is messy — free text, scanned documents, voice notes, inconsistent customer requests — and a person currently spends time interpreting it.',
        ],
      },
      {
        heading: 'Good candidates',
        body: [
          'Classifying incoming requests and routing them to the right person or system. Extracting structured fields (order numbers, dates, amounts, addresses) from emails and documents. Drafting replies that a human approves. Summarising long threads, calls or reports. Searching internal knowledge in plain language instead of keywords.',
          'In each case the AI turns unstructured input into structured data — and from there, ordinary software takes over.',
        ],
      },
      {
        heading: 'Poor candidates',
        body: [
          'Calculations, pricing, invoicing, stock levels, permissions and anything with a legal or financial consequence should stay deterministic. A rule that is right 100% of the time beats a model that is right 98% of the time.',
          'If a step can be written as an if/then rule, write the rule.',
        ],
      },
      {
        heading: 'Keep a human in the loop where it matters',
        body: [
          'The safest pattern is: AI proposes, the system validates, a person confirms anything with consequences. Every AI decision is logged with its input, so errors can be traced and the prompts improved.',
          'Data stays in the EU, with providers and settings chosen so that business data is not used for model training.',
        ],
      },
    ],
    takeaway: 'Map the process first. Use AI for reading, classifying and extracting — and keep business rules as code.',
  },
  {
    slug: 'ai-document-processing',
    title: 'AI document processing workflows',
    category: 'AI & Document Processing',
    metaDescription: 'How AI reads, validates and transfers invoices, delivery notes and contracts into your ERP — with a review queue instead of retyping.',
    lede: 'Invoices, delivery notes, contracts, forms: documents are where data goes to be re-typed. A well-built workflow reads them once and puts the data where it belongs.',
    readMinutes: 4,
    sections: [
      {
        heading: 'The typical media break',
        body: [
          'A PDF arrives by email. Someone opens it, reads the supplier, the amounts and the order reference, and types them into the ERP or accounting system. It works — until volume grows, people are on holiday, or a typo costs a week of reconciliation.',
        ],
      },
      {
        heading: 'What a workflow looks like',
        body: [
          'Intake: documents are collected automatically from a mailbox, upload form or shared folder. Recognition: OCR turns scans into text; an AI model identifies the document type and extracts the fields you define. Validation: deterministic checks compare the result against your data — does the supplier exist, does the order number match, do the totals add up?',
          'Handover: clean records go straight into the target system via API. Anything uncertain lands in a review queue with the original document side by side.',
        ],
      },
      {
        heading: 'Why validation is the important part',
        body: [
          'Extraction is never perfect. The value comes from knowing which results are safe to post automatically and which need a person. Confidence thresholds and cross-checks against existing data make that decision explicit and auditable.',
        ],
      },
      {
        heading: 'Where to begin',
        body: [
          'Pick one document type with high volume and a clear target system. Measure how long it takes today. Build the workflow, run it alongside the manual process for a few weeks, then switch over once the review queue stays small.',
        ],
      },
    ],
    takeaway: 'Extraction is the easy part. Validation and a clean review queue are what make document automation trustworthy.',
  },
  {
    slug: 'ai-email-automation',
    title: 'AI email automation from inbox to workflow',
    category: 'Automation & Integration',
    metaDescription: 'How AI email automation classifies requests, extracts data and creates cases in your systems — GDPR-compliant on EU infrastructure.',
    lede: 'For many businesses the shared inbox is the real operating system. Orders, questions, complaints and attachments all arrive in the same place — and leave as manual work.',
    readMinutes: 4,
    sections: [
      {
        heading: 'The inbox as an unstructured queue',
        body: [
          'Every email needs the same first steps: what is this, who is it from, what do they want, and where does it go? People do this triage dozens or hundreds of times a day, and knowledge about open cases lives in individual inboxes.',
        ],
      },
      {
        heading: 'From email to structured case',
        body: [
          'An automation reads each incoming message and its attachments, recognises the sender (customer, supplier, partner), classifies the intent (order, enquiry, complaint, invoice) and extracts the relevant data.',
          'The result is a structured case in your system — a booking, an order, a ticket — linked to the original email. Simple, recurring requests can be answered with a drafted reply for one-click approval.',
        ],
      },
      {
        heading: 'Integration is the multiplier',
        body: [
          'The real gain appears when the email workflow talks to your other systems: checking order status in the ERP before drafting a reply, creating the customer record in the CRM, or notifying the right team in their chat tool. Without integration, AI only moves the copy-paste one step later.',
        ],
      },
      {
        heading: 'Guardrails',
        body: [
          'Nothing is sent automatically without rules you agree to. Every classification is visible and correctable, and corrections feed back into the configuration. Mail data is processed on EU infrastructure.',
        ],
      },
    ],
    takeaway: 'Turn emails into structured cases, connect them to your systems, and let people approve instead of re-typing.',
  },
];
