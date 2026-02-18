
// Basic dictionary of common English words and legal terms
// This is not exhaustive but covers enough to provide a reasonable heuristic for prompt quality

const commonWords = new Set([
    // Common English words
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there",
    "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no",
    "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then",
    "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well",
    "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "are", "was", "were", "has", "had",
    "been", "being", "am", "file", "filing", "draft", "drafting", "legal", "law", "court", "judge", "judgment", "case", "matter",
    "petition", "agreement", "contract", "notice", "appeal", "writ", "plaint", "suit", "respondent", "petitioner", "plaintiff",
    "defendant", "appellant", "applicant", "honor", "honour", "justice", "bench", "high", "supreme", "district", "section", "act",
    "article", "clause", "provision", "rule", "regulation", "order", "decree", "stay", "injunction", "bail", "anticipatory",
    "criminal", "civil", "jurisdiction", "territorial", "cause", "action", "limitation", "period", "date", "hearing", "party",
    "parties", "witness", "evidence", "proof", "record", "document", "affidavit", "verification", "attestation", "notary",
    "advocate", "counsel", "lawyer", "attorney", "solicitor", "client", "fee", "cost", "damage", "compensation", "relief", "prayer",
    "interim", "final", "ex-parte", "adjournment", "dismissal", "allowed", "pending", "status", "report", "police", "fir", "complaint",
    "investigation", "charge", "sheet", "trial", "cross-examination", "arguments", "submission", "written", "statement", "reply",
    "rejoinder", "application", "memo", "vakalatnama", "power", "attorney", "will", "probate", "succession", "certificate", "deed",
    "sale", "lease", "rent", "mortgage", "gift", "trust", "partnership", "company", "director", "shareholder", "meeting", "resolution",
    "board", "tax", "income", "gst", "revenue", "property", "land", "building", "apartment", "possession", "title", "ownership",
    "transfer", "registration", "stamp", "duty", "value", "market", "guideline", "family", "divorce", "marriage", "custody",
    "maintenance", "alimony", "guardianship", "adoption", "minor", "child", "husband", "wife", "spouse", "parent", "father",
    "mother", "son", "daughter", "brother", "sister", "relative", "dispute", "conflict", "issue", "problem", "question", "answer",
    "query", "information", "detail", "fact", "circumstance", "event", "happening", "incident", "accident", "injury", "loss",
    "harm", "wrong", "right", "duty", "obligation", "liability", "responsibility", "breach", "violation", "infringement", "torts",
    "negligence", "defamation", "libel", "slander", "fraud", "cheating", "forgery", "theft", "robbery", "dacoity", "murder",
    "homicide", "assault", "battery", "kidnapping", "abduction", "rape", "sexual", "harassment", "dowry", "cruelty", "domestic",
    "violence", "offence", "crime", "punishment", "penalty", "fine", "imprisonment", "custody", "remand", "bail", "bond", "surety",
    "guarantee", "warrant", "summons", "notice", "service", "process", "execution", "attachment", "auction", "sale", "decree-holder",
    "judgment-debtor", "compromise", "settlement", "mediation", "conciliation", "arbitration", "award", "contract", "agreement",
    "offer", "acceptance", "consideration", "performance", "please", "help", "need", "create", "make", "write", "generate", "about",
    "rental", "rent", "tenent", "tenant", "landlord", "deposit", "lakh", "million", "thousand", "rupees", "rs", "inr", "between", "bwtween", // common typo
    "support", "relevent", "relevant", "refer", "reference", "cite", "citations", "more", "then", "than", "taken", "took", "take"
]);

export default commonWords;
