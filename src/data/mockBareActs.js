export const categories = [
  "All",
  "Criminal Law",
  "Civil Law",
  "Constitutional Law",
  "Corporate Law",
  "Taxation",
  "Labour Law",
  "Technology Law"
];

export const mockBareActs = [
  {
    id: "bns",
    name: "Bharatiya Nyaya Sanhita",
    shortName: "BNS",
    category: "Criminal Law",
    totalSections: 358,
    lastUpdated: "2023-12-25",
    description: "The Bharatiya Nyaya Sanhita is the new criminal code of India, replacing the Indian Penal Code (IPC).",
    chapters: [
      {
        id: "ch1",
        title: "Chapter I",
        subtitle: "Preliminary",
        sections: [
          { number: "1", title: "Short title, commencement and application", content: "This Act may be called the Bharatiya Nyaya Sanhita, 2023..." },
          { number: "2", title: "Definitions", content: "In this Sanhita, unless the context otherwise requires..." }
        ]
      },
      {
        id: "ch2",
        title: "Chapter II",
        subtitle: "Of Punishments",
        sections: [
          { number: "4", title: "Punishments", content: "The punishments to which offenders are liable under the provisions of this Sanhita are..." },
          { number: "5", title: "Commutation of sentence", content: "Appropriate Government may commute sentence..." }
        ]
      }
    ]
  },
  {
    id: "bnss",
    name: "Bharatiya Nagarik Suraksha Sanhita",
    shortName: "BNSS",
    category: "Criminal Law",
    totalSections: 531,
    lastUpdated: "2023-12-25",
    description: "The BNSS replaces the Code of Criminal Procedure (CrPC).",
    chapters: [
      {
        id: "ch1",
        title: "Chapter I",
        subtitle: "Preliminary",
        sections: [
          { number: "1", title: "Short title, extent and commencement", content: "This Act may be called the Bharatiya Nagarik Suraksha Sanhita..." },
        ]
      }
    ]
  },
  {
    id: "bsa",
    name: "Bharatiya Sakshya Adhiniyam",
    shortName: "BSA",
    category: "Criminal Law",
    totalSections: 170,
    lastUpdated: "2023-12-25",
    description: "The BSA replaces the Indian Evidence Act.",
    chapters: [
      {
        id: "ch1",
        title: "Chapter I",
        subtitle: "Preliminary",
        sections: [
          { number: "1", title: "Short title and commencement", content: "..." },
        ]
      }
    ]
  },
  {
    id: "constitution",
    name: "Constitution of India",
    shortName: "Constitution",
    category: "Constitutional Law",
    totalSections: 395,
    lastUpdated: "1950-01-26",
    description: "The supreme law of India.",
    chapters: [
      {
        id: "part3",
        title: "Part III",
        subtitle: "Fundamental Rights",
        sections: [
          { number: "21", title: "Protection of life and personal liberty", content: "No person shall be deprived of his life or personal liberty except according to procedure established by law." },
        ]
      }
    ]
  },
  {
    id: "contract",
    name: "Indian Contract Act",
    shortName: "Contract Act",
    category: "Civil Law",
    totalSections: 266,
    lastUpdated: "1872-09-01",
    description: "The law relating to contracts in India.",
    chapters: [
      {
        id: "ch1",
        title: "Chapter I",
        subtitle: "Of the communication, acceptance and revocation of proposals",
        sections: [
          { number: "3", title: "Communication, acceptance and revocation of proposals", content: "..." },
        ]
      }
    ]
  },
  {
    id: "companies",
    name: "Companies Act",
    shortName: "Companies Act",
    category: "Corporate Law",
    totalSections: 470,
    lastUpdated: "2013-08-30",
    description: "The law regulating the incorporation, responsibilities, and dissolution of companies.",
    chapters: []
  },
  {
    id: "itact",
    name: "Information Technology Act",
    shortName: "IT Act",
    category: "Technology Law",
    totalSections: 94,
    lastUpdated: "2000-10-17",
    description: "An Act to provide legal recognition for transactions carried out by means of electronic data interchange.",
    chapters: []
  },
  {
    id: "gst",
    name: "Central Goods and Services Tax Act",
    shortName: "CGST Act",
    category: "Taxation",
    totalSections: 174,
    lastUpdated: "2017-07-01",
    description: "An Act to make a provision for levy and collection of tax on intra-State supply of goods or services or both by the Central Government.",
    chapters: []
  }
];
