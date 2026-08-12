
import json
from pathlib import Path

# Get the absolute path to the project root
project_root = Path(__file__).parent.parent.parent.parent

# Load Indian Evidence Act from the src/data/bareacts directory
indian_evidence_act_path = project_root / "src" / "data" / "bareacts" / "IndianEvidenceAct.json"

with open(indian_evidence_act_path, "r", encoding="utf-8") as f:
    INDIAN_EVIDENCE_ACT = json.load(f)

# Add mockBareActs data
MOCK_BARE_ACTS = [
    {
        "id": "indian-penal-code",
        "name": "The Indian Penal Code, 1860",
        "shortName": "IPC",
        "keywords": ["criminal", "crime", "punishment", "murder", "theft", "cheating", "420", "section 420"],
        "category": "Criminal Law",
        "totalSections": 511,
        "lastUpdated": "2020-03-13",
        "description": "The Indian Penal Code (IPC) is the official criminal code of India.",
        "chapters": []
    },
    {
        "id": "code-of-criminal-procedure",
        "name": "Code of Criminal Procedure, 1973",
        "shortName": "CrPC",
        "keywords": ["criminal", "procedure", "arrest", "bail", "trial"],
        "category": "Criminal Law",
        "totalSections": 484,
        "lastUpdated": "2020-03-13",
        "description": "The Code of Criminal Procedure (CrPC) is the main legislation on procedure for administration of criminal law in India.",
        "chapters": []
    },
    {
        "id": "civil-procedure-code",
        "name": "Code of Civil Procedure, 1908",
        "shortName": "CPC",
        "keywords": ["civil", "procedure", "suit", "plaint", "decree"],
        "category": "Civil Law",
        "totalSections": 158,
        "lastUpdated": "2020-03-13",
        "description": "The Code of Civil Procedure (CPC) is a procedural law related to the administration of civil proceedings in India.",
        "chapters": []
    },
    {
        "id": "indian-contract-act",
        "name": "The Indian Contract Act, 1872",
        "shortName": "Contract Act",
        "keywords": ["contract", "agreement", "offer", "acceptance", "breach", "promise"],
        "category": "Commercial Law",
        "totalSections": 266,
        "lastUpdated": "2020-03-13",
        "description": "The Indian Contract Act, 1872 prescribes the law relating to contracts in India.",
        "chapters": []
    },
    {
        "id": "hindu-marriage-act",
        "name": "The Hindu Marriage Act, 1955",
        "shortName": "HMA",
        "keywords": ["marriage", "family", "divorce", "maintenance", "hindu"],
        "category": "Family Law",
        "totalSections": 30,
        "lastUpdated": "2020-03-13",
        "description": "An Act to amend and codify the law relating to marriage among Hindus.",
        "chapters": []
    },
    {
        "id": "special-marriage-act",
        "name": "The Special Marriage Act, 1954",
        "shortName": "SMA",
        "keywords": ["marriage", "family", "inter-caste", "inter-religion", "civil"],
        "category": "Family Law",
        "totalSections": 52,
        "lastUpdated": "2020-03-13",
        "description": "An Act to provide a special form of marriage in certain cases.",
        "chapters": []
    },
    {
        "id": "guardian-and-wards-act",
        "name": "The Guardian and Wards Act, 1890",
        "shortName": "Guardian Act",
        "keywords": ["guardian", "ward", "minor", "custody", "family"],
        "category": "Family Law",
        "totalSections": 51,
        "lastUpdated": "2020-03-13",
        "description": "An Act to consolidate and amend the law relating to guardians and wards.",
        "chapters": []
    },
    {
        "id": "dowry-prohibition-act",
        "name": "The Dowry Prohibition Act, 1961",
        "shortName": "Dowry Act",
        "keywords": ["dowry", "prohibition", "marriage", "bride", "groom"],
        "category": "Criminal Law",
        "totalSections": 10,
        "lastUpdated": "2020-03-13",
        "description": "An Act to prohibit the giving or taking of dowry.",
        "chapters": []
    },
    {
        "id": "juvenile-justice-act",
        "name": "The Juvenile Justice (Care and Protection of Children) Act, 2015",
        "shortName": "Juvenile Justice Act",
        "keywords": ["juvenile", "child", "family", "protection", "care"],
        "category": "Family Law",
        "totalSections": 112,
        "lastUpdated": "2020-03-13",
        "description": "An Act to consolidate and amend the law relating to children alleged and found to be in conflict with law.",
        "chapters": []
    },
    {
        "id": "domestic-violence-act",
        "name": "The Protection of Women from Domestic Violence Act, 2005",
        "shortName": "DV Act",
        "keywords": ["domestic", "violence", "women", "protection", "family"],
        "category": "Family Law",
        "totalSections": 37,
        "lastUpdated": "2020-03-13",
        "description": "An Act to provide for more effective protection of the rights of women guaranteed under the Constitution.",
        "chapters": []
    },
    {
        "id": "cgst-act",
        "name": "The Central Goods and Services Tax Act, 2017",
        "shortName": "CGST",
        "keywords": ["gst", "tax", "goods", "services", "central"],
        "category": "Commercial Law",
        "totalSections": 174,
        "lastUpdated": "2020-03-13",
        "description": "An Act to make a provision for levy and collection of tax on intra-State supply of goods or services or both.",
        "chapters": []
    },
    {
        "id": "igst-act",
        "name": "The Integrated Goods and Services Tax Act, 2017",
        "shortName": "IGST",
        "keywords": ["gst", "tax", "goods", "services", "integrated", "inter-state"],
        "category": "Commercial Law",
        "totalSections": 26,
        "lastUpdated": "2020-03-13",
        "description": "An Act to make a provision for levy and collection of tax on inter-State supply of goods or services or both.",
        "chapters": []
    },
    {
        "id": "negotiable-instruments-act",
        "name": "The Negotiable Instruments Act, 1881",
        "shortName": "NI Act",
        "keywords": ["negotiable", "instrument", "cheque", "bounce", "cheque bounce", "promissory", "bill"],
        "category": "Commercial Law",
        "totalSections": 142,
        "lastUpdated": "2020-03-13",
        "description": "An Act to define and amend the law relating to Promissory Notes, Bills of Exchange and Cheques.",
        "chapters": []
    },
    {
        "id": "constitution-of-india",
        "name": "The Constitution of India",
        "shortName": "Constitution",
        "keywords": ["constitution", "article", "21", "article 21", "fundamental", "rights", "justice", "liberty"],
        "category": "Constitutional Law",
        "totalSections": 395,
        "lastUpdated": "2020-03-13",
        "description": "The Constitution of India is the supreme law of India.",
        "chapters": []
    },
    {
        "id": "right-to-information-act",
        "name": "The Right to Information Act, 2005",
        "shortName": "RTI Act",
        "keywords": ["rti", "right to information", "information", "transparency"],
        "category": "Public Law",
        "totalSections": 31,
        "lastUpdated": "2020-03-13",
        "description": "The Right to Information Act provides for setting out the practical regime of right to information for citizens.",
        "chapters": []
    }
]

ALL_ACTS = [INDIAN_EVIDENCE_ACT] + MOCK_BARE_ACTS


class BareActsService:
    def __init__(self):
        # Print loaded acts at initialization
        print(f"Loaded {len(ALL_ACTS)} acts")
        for act in ALL_ACTS:
            print(f"  - {act['name']}")

    def get_acts(self):
        return ALL_ACTS

    def search_acts(self, query):
        lower_query = query.lower().strip()
        print(f"\nSearching: {query}")
        scored_acts = []

        for act in ALL_ACTS:
            score = 0
            matched_field = ""

            # 1. Exact match on shortName (highest priority)
            if act.get("shortName", "").lower() == lower_query:
                score += 100
                matched_field = "Short Name"

            # 2. Exact match on name
            if act.get("name", "").lower() == lower_query:
                score += 90
                matched_field = "Act Name"

            # 3. Starts with shortName
            if act.get("shortName", "").lower().startswith(lower_query):
                score += 70
                if not matched_field:
                    matched_field = "Short Name"

            # 4. Starts with name
            if act.get("name", "").lower().startswith(lower_query):
                score += 60
                if not matched_field:
                    matched_field = "Act Name"

            # 5. Contains shortName
            if lower_query in act.get("shortName", "").lower():
                score += 50
                if not matched_field:
                    matched_field = "Short Name"

            # 6. Contains name
            if lower_query in act.get("name", "").lower():
                score += 40
                if not matched_field:
                    matched_field = "Act Name"

            # 7. Keywords match
            keywords = act.get("keywords", [])
            for keyword in keywords:
                if lower_query in keyword.lower():
                    score += 30
                    if not matched_field:
                        matched_field = "Keyword"

            # 8. Category match
            if lower_query in act.get("category", "").lower():
                score += 20
                if not matched_field:
                    matched_field = "Category"

            # 9. Description match
            if lower_query in act.get("description", "").lower():
                score += 10
                if not matched_field:
                    matched_field = "Description"

            # 10. Chapter titles match
            for chapter in act.get("chapters", []):
                if lower_query in chapter.get("title", "").lower():
                    score += 15
                    if not matched_field:
                        matched_field = "Chapter Title"
                if lower_query in chapter.get("subtitle", "").lower():
                    score += 12
                    if not matched_field:
                        matched_field = "Chapter Title"

            # 11. Section matches (title or content)
            for chapter in act.get("chapters", []):
                for section in chapter.get("sections", []):
                    if lower_query in section.get("number", "").lower():
                        score += 25
                        if not matched_field:
                            matched_field = "Section Number"
                    if lower_query in section.get("title", "").lower():
                        score += 20
                        if not matched_field:
                            matched_field = "Section Title"
                    if lower_query in section.get("content", "").lower():
                        score += 5
                        if not matched_field:
                            matched_field = "Section Content"

            if score > 0:
                scored_acts.append({
                    **act,
                    "score": score,
                    "matchedField": matched_field or "Relevant Content"
                })

        # Sort by score descending
        scored_acts.sort(key=lambda x: -x["score"])

        print(f"Matched {len(scored_acts)} acts")
        for act in scored_acts:
            print(f"  - {act['name']} (score: {act['score']})")
        final_result = [act for act in scored_acts]
        print(f"Returning {len(final_result)} acts")

        # Return acts without score and matchedField for UI compatibility
        return final_result

    def get_act(self, act_id):
        for act in ALL_ACTS:
            if act["id"] == act_id:
                return act
        return None

    def get_sections(self, act_id, chapter_id=None):
        act = self.get_act(act_id)
        if not act:
            return []
        if chapter_id:
            chapter = next((ch for ch in act["chapters"] if ch["id"] == chapter_id), None)
            return chapter["sections"] if chapter else []
        # Return all sections from all chapters
        return [
            section
            for chapter in act["chapters"]
            for section in chapter["sections"]
        ]

    def get_section(self, act_id, section_id):
        sections = self.get_sections(act_id)
        for section in sections:
            # In mock data, sections have 'number', let's use that as 'id'
            if section.get("id") == section_id or section.get("number") == section_id:
                return section
        return None

    def search_sections(self, query):
        lower_query = query.lower()
        results = []
        for act in ALL_ACTS:
            for chapter in act.get("chapters", []):
                for section in chapter.get("sections", []):
                    if (
                        lower_query in section.get("number", "").lower()
                        or lower_query in section.get("title", "").lower()
                        or lower_query in section.get("content", "").lower()
                        or lower_query in chapter.get("title", "").lower()
                        or lower_query in chapter.get("subtitle", "").lower()
                        or lower_query in act.get("name", "").lower()
                    ):
                        results.append({
                            **section,
                            "actId": act["id"],
                            "actName": act["name"],
                            "chapterId": chapter["id"],
                            "chapterTitle": chapter["title"],
                            "chapterSubtitle": chapter.get("subtitle", ""),
                        })
        return results

    def get_categories(self):
        categories = set()
        for act in ALL_ACTS:
            categories.add(act.get("category", "Uncategorized"))
        return ["All"] + sorted(list(categories))


bare_acts_service = BareActsService()
