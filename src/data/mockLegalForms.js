export const formsCategories = [
  "All",
  "Criminal Law",
  "Civil Law",
  "Corporate Law",
  "Property Law",
  "Consumer Law",
  "Administrative Law"
];

export const mockLegalForms = [
  {
    id: "vakalatnama",
    name: "Vakalatnama",
    category: "Criminal Law",
    description: "A legal document authorizing an advocate to represent a client in court.",
    lastUpdated: "2024-05-15",
    requiredInfo: ["Client Name", "Case Number", "Court Name", "Advocate Name", "Date"],
    preview: `IN THE COURT OF [HON'BLE JUDGE]
AT [LOCATION]

CASE NO: [CASE NUMBER]
YEAR: [YEAR]

[PLAINTIFF NAME], PLAINTIFF
V/S
[DEFENDANT NAME], DEFENDANT

VAKALATNAMA

I, [CLIENT NAME], hereby appoint [ADVOCATE NAME] as my advocate to represent me in the above matter.`,
    instructions: "1. Fill all details carefully\n2. Sign the document\n3. Submit to the court"
  },
  {
    id: "affidavit",
    name: "Affidavit",
    category: "Civil Law",
    description: "A sworn written statement of facts used as evidence in court.",
    lastUpdated: "2024-04-20",
    requiredInfo: ["Full Name", "Address", "Facts", "Date", "Place", "Signature"],
    preview: `AFFIDAVIT

I, [FULL NAME], S/o, D/o, W/o [FATHER'S/SPOUSE'S NAME], aged [AGE] years, residing at [ADDRESS], do hereby solemnly affirm and declare as under:

1. [STATE FACTS 1]
2. [STATE FACTS 2]

Solemnly affirmed on this [DATE] day of [MONTH] at [PLACE].`,
    instructions: "1. Ensure facts are true and accurate\n2. Sign before a notary or oath commissioner\n3. Attach necessary supporting documents"
  },
  {
    id: "legal-notice",
    name: "Legal Notice",
    category: "Civil Law",
    description: "A formal notice sent to a party to seek legal remedy or perform an obligation.",
    lastUpdated: "2024-06-01",
    requiredInfo: ["Sender Name", "Recipient Name", "Cause of Action", "Relief Sought", "Response Period"],
    preview: `LEGAL NOTICE

To,
[RECIPIENT NAME],
[ADDRESS]

Dear Sir/Madam,

Under instructions from my client [CLIENT NAME], I hereby serve you with this legal notice:

[DETAILS OF CAUSE OF ACTION]

You are called upon to [RELIEF SOUGHT] within [NUMBER] days.`,
    instructions: "1. Send via registered post or email\n2. Keep a copy for your records\n3. Consult an advocate before sending"
  },
  {
    id: "bail-application",
    name: "Bail Application",
    category: "Criminal Law",
    description: "A petition filed before a court seeking release of an accused person from custody.",
    lastUpdated: "2024-03-10",
    requiredInfo: ["Accused Name", "FIR Number", "Date of Arrest", "Offences", "Grounds for Bail"],
    preview: `IN THE COURT OF [HON'BLE JUDGE]
AT [LOCATION]

BAIL APPLICATION

[ACCUSED NAME]...APPLICANT
V/S
STATE...RESPONDENT

The applicant humbly submits as under:
1. The applicant was arrested on [DATE]
2. The applicant is innocent
3. The applicant undertakes to abide by all court conditions

Prayer: Release on bail.`,
    instructions: "1. File in the appropriate court\n2. Attach relevant documents\n3. Be present for the hearing"
  },
  {
    id: "written-statement",
    name: "Written Statement",
    category: "Civil Law",
    description: "A formal response filed by the defendant addressing each allegation in the plaint.",
    lastUpdated: "2024-05-25",
    requiredInfo: ["Case Number", "Court Name", "Defendant Name", "Plaintiff Name", "Response to Allegations"],
    preview: `IN THE COURT OF [HON'BLE JUDGE]
AT [LOCATION]

CASE NO: [CASE NUMBER]
YEAR: [YEAR]

[PLAINTIFF NAME], PLAINTIFF
V/S
[DEFENDANT NAME], DEFENDANT

WRITTEN STATEMENT

1. The allegations in the plaint are denied.
2. [RESPONSE TO EACH ALLEGATION]`,
    instructions: "1. File within the prescribed time limit\n2. Answer each allegation separately\n3. Attach supporting documents"
  },
  {
    id: "power-of-attorney",
    name: "Power of Attorney",
    category: "Corporate Law",
    description: "A document granting authority to another person to act on your behalf.",
    lastUpdated: "2024-04-05",
    requiredInfo: ["Principal Name", "Agent Name", "Powers Granted", "Duration", "Signatures"],
    preview: `POWER OF ATTORNEY

This Power of Attorney is made on [DATE] by [PRINCIPAL NAME], son of [FATHER'S NAME], residing at [ADDRESS], hereinafter called the 'Principal'.

1. I hereby appoint [AGENT NAME], son of [FATHER'S NAME], residing at [ADDRESS], as my attorney.
2. My attorney is authorized to [LIST POWERS].`,
    instructions: "1. Specify powers clearly\n2. Register if required\n3. Revoke when no longer needed"
  },
  {
    id: "rent-agreement",
    name: "Rent Agreement",
    category: "Property Law",
    description: "A contract between landlord and tenant for rental of a property.",
    lastUpdated: "2024-02-18",
    requiredInfo: ["Landlord Name", "Tenant Name", "Property Address", "Rent Amount", "Duration"],
    preview: `RENT AGREEMENT

This Rent Agreement is made on [DATE] between:

1. [LANDLORD NAME], son of [FATHER'S NAME], residing at [ADDRESS], hereinafter called the 'LANDLORD'
2. [TENANT NAME], son of [FATHER'S NAME], residing at [ADDRESS], hereinafter called the 'TENANT'

PROPERTY: [ADDRESS]

RENT: [AMOUNT] per month
DURATION: [DURATION] months`,
    instructions: "1. Include all essential terms\n2. Get it signed by both parties\n3. Consider registering the agreement"
  },
  {
    id: "rti-application",
    name: "RTI Application",
    category: "Administrative Law",
    description: "An application under Right to Information Act seeking information from a public authority.",
    lastUpdated: "2024-05-30",
    requiredInfo: ["Applicant Name", "Address", "Public Authority", "Information Sought", "Fee Details"],
    preview: `APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005

To,
[PIO NAME],
[PUBLIC AUTHORITY NAME],
[ADDRESS]

Subject: Application for information under RTI Act, 2005.

1. I, [APPLICANT NAME], seek the following information:
[LIST OF QUESTIONS]

2. Fee: Rs. [AMOUNT] paid via [MODE OF PAYMENT]`,
    instructions: "1. Keep questions specific\n2. Attach fee receipt\n3. Keep a copy for your reference"
  },
  {
    id: "consumer-complaint",
    name: "Consumer Complaint",
    category: "Consumer Law",
    description: "A complaint filed with a consumer forum for deficiency in goods or services.",
    lastUpdated: "2024-03-25",
    requiredInfo: ["Complainant Name", "Opposite Party", "Complain Details", "Relief Sought"],
    preview: `IN THE [FORUM NAME]
AT [LOCATION]

COMPLAINT CASE NO: [NUMBER]
YEAR: [YEAR]

[COMPLAINANT NAME], COMPLAINANT
V/S
[OPPOSITE PARTY NAME], OPPOSITE PARTY

COMPLAINT

1. The complainant is a consumer as defined under the Consumer Protection Act.
2. [DETAILS OF THE COMPLAINT]
3. Prayer: [RELIEF SOUGHT]`,
    instructions: "1. File within the limitation period\n2. Attach evidence (invoices, communications, etc.)\n3. Provide all relevant details"
  },
  {
    id: "partnership-deed",
    name: "Partnership Deed",
    category: "Corporate Law",
    description: "A legal document creating and governing a partnership between individuals.",
    lastUpdated: "2024-01-10",
    requiredInfo: ["Partner Names", "Business Name", "Capital Contribution", "Profit Sharing", "Duration"],
    preview: `PARTNERSHIP DEED

This Partnership Deed is made on [DATE] between:

1. [PARTNER 1 NAME], son of [FATHER'S NAME], residing at [ADDRESS]
2. [PARTNER 2 NAME], son of [FATHER'S NAME], residing at [ADDRESS]

BUSINESS NAME: [NAME]
BUSINESS ADDRESS: [ADDRESS]

CAPITAL: [CAPITAL DETAILS]
PROFIT SHARING: [RATIO]`,
    instructions: "1. Include all essential clauses\n2. Get it drafted by a professional\n3. Register the deed if required"
  }
];
