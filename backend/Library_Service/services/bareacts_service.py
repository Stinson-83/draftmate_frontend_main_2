from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from database import SessionLocal
from models import LegalAct, LegalSection

class BareActsService:
    def __init__(self):
        pass

    def get_acts(self, page: int = 1, page_size: int = 20, state: str = None, category: str = None, jurisdiction: str = None, status: str = None):
        db: Session = SessionLocal()
        try:
            query = db.query(LegalAct)
            if state:
                query = query.filter(LegalAct.state.ilike(state))
            if category:
                query = query.filter(LegalAct.category.ilike(category))
            if jurisdiction:
                query = query.filter(LegalAct.jurisdiction.ilike(jurisdiction))
            if status:
                query = query.filter(LegalAct.status.ilike(status))

            total = query.count()
            acts = query.order_by(desc(LegalAct.year)).offset((page - 1) * page_size).limit(page_size).all()

            return {
                "items": self._format_acts(db, acts),
                "total": total,
                "page": page,
                "pageSize": page_size,
                "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 0
            }
        finally:
            db.close()

    def search_acts(self, query_str: str, page: int = 1, page_size: int = 20):
        db: Session = SessionLocal()
        try:
            search_query = f"%{query_str}%"
            query = db.query(LegalAct).filter(
                or_(
                    LegalAct.title.ilike(search_query),
                    LegalAct.short_title.ilike(search_query),
                    LegalAct.act_number.ilike(search_query)
                )
            )
            total = query.count()
            acts = query.order_by(desc(LegalAct.year)).offset((page - 1) * page_size).limit(page_size).all()

            return {
                "items": self._format_acts(db, acts),
                "total": total,
                "page": page,
                "pageSize": page_size,
                "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 0
            }
        finally:
            db.close()

    def get_act(self, act_id):
        db: Session = SessionLocal()
        try:
            act = db.query(LegalAct).filter(LegalAct.id == act_id).first()
            if act:
                act_dict = self._format_act(db, act)
                # Fetch distinct chapters
                sections = db.query(LegalSection).filter(LegalSection.act_id == act_id).all()

                import re
                def natural_sort_key(sec):
                    s = sec.section_number
                    if not s: return []
                    return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', str(s))]

                sections.sort(key=natural_sort_key)

                # Group by chapter
                chapters_dict = {}

                # Add an "All Sections" pseudo-chapter first
                chapters_dict["all_sections"] = {
                    "id": "all_sections",
                    "title": "All Sections",
                    "subtitle": "View all sections sequentially",
                    "sections": [self._format_section(sec) for sec in sections]
                }

                for sec in sections:
                    ch_title = sec.chapter or "Sections"
                    if ch_title not in chapters_dict:
                        chapters_dict[ch_title] = {
                            "id": ch_title,
                            "title": ch_title,
                            "subtitle": sec.chapter_title or "",
                            "sections": []
                        }

                    chapters_dict[ch_title]["sections"].append(self._format_section(sec))

                act_dict["chapters"] = list(chapters_dict.values())

                # Sort chapters sequentially by roman/arabic numeral, keeping All Sections first
                def chapter_sort_key(ch):
                    title = ch.get("title", "").strip()
                    if title == "All Sections":
                        return (0, 0, 0, title)

                    num_val = 99999
                    m_ar = re.search(r'\b(\d+)\b', title)
                    if m_ar:
                        num_val = int(m_ar.group(1))
                    else:
                        m_rom = re.search(r'\b([IVXLCDM]+)\b', title, flags=re.IGNORECASE)
                        if m_rom:
                            word = m_rom.group(1).upper()
                            if word not in ['MIX', 'MID', 'DIM', 'CIVIC', 'MILD', 'MILL', 'DID']:
                                roman_map = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
                                val = 0
                                try:
                                    for i in range(len(word)):
                                        if i > 0 and roman_map[word[i]] > roman_map[word[i-1]]:
                                            val += roman_map[word[i]] - 2 * roman_map[word[i-1]]
                                        else:
                                            val += roman_map[word[i]]
                                    num_val = val
                                except:
                                    pass

                    min_sec = 99999
                    if ch.get("sections"):
                        s_num = ch["sections"][0].get("number")
                        if s_num:
                            m = re.search(r'\d+', str(s_num))
                            if m:
                                min_sec = int(m.group())

                    return (1, num_val, min_sec, title)

                act_dict["chapters"].sort(key=chapter_sort_key)

                return act_dict
            return None
        finally:
            db.close()

    def get_sections(self, act_id, chapter_id=None):
        db: Session = SessionLocal()
        try:
            query = db.query(LegalSection).filter(LegalSection.act_id == act_id)
            if chapter_id:
                query = query.filter(LegalSection.chapter == chapter_id)
            sections = query.all()

            import re
            def natural_sort_key(sec):
                s = sec.section_number
                if not s: return []
                return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', str(s))]

            sections.sort(key=natural_sort_key)
            return [self._format_section(sec) for sec in sections]
        finally:
            db.close()

    def get_section(self, act_id, section_id):
        db: Session = SessionLocal()
        try:
            sec = db.query(LegalSection).filter(
                LegalSection.act_id == act_id,
                LegalSection.id == section_id
            ).first()
            if sec:
                return self._format_section(sec)
            return None
        finally:
            db.close()

    def search_sections(self, query):
        db: Session = SessionLocal()
        try:
            search_query = f"%{query}%"
            sections = db.query(LegalSection).join(LegalAct).filter(
                or_(
                    LegalSection.section_number.ilike(search_query),
                    LegalSection.section_title.ilike(search_query),
                    LegalSection.text.ilike(search_query)
                )
            ).limit(50).all()

            results = []
            for sec in sections:
                sec_dict = self._format_section(sec)
                # We need to load act for actName
                act = db.query(LegalAct).filter(LegalAct.id == sec.act_id).first()
                if act:
                    sec_dict["actName"] = act.title
                    sec_dict["actId"] = act.id
                results.append(sec_dict)

            return results
        finally:
            db.close()

    def get_categories(self):
        db: Session = SessionLocal()
        try:
            categories = db.query(LegalAct.category).distinct().all()
            cat_list = [c[0] for c in categories if c[0]]
            return ["All"] + sorted(cat_list)
        finally:
            db.close()

    def _format_acts(self, db, acts):
        return [self._format_act(db, act) for act in acts]

    def _format_act(self, db, act: LegalAct):
        total_sections = db.query(LegalSection).filter(LegalSection.act_id == act.id).count()
        doc_type = (act.document_type or act.category or "ACT").upper()
        if doc_type == "LEGISLATION":
            doc_type = "ACT"

        # Clean date
        enactment_date = act.enactment_date
        if enactment_date and str(enactment_date).lower() in ["nan", "null", "undefined", "invalid date", "none"]:
            enactment_date = ""

        return {
            "id": act.id,
            "name": act.title,
            "shortName": act.short_title or "",
            "keywords": [],
            "category": doc_type,
            "documentType": doc_type,
            "year": act.year,
            "totalSections": total_sections,
            "lastUpdated": enactment_date or "",
            "description": f"Jurisdiction: {act.jurisdiction}",
            "chapters": [],
            "source_url": act.source_url,
            "publisher": act.publisher,
            "status": act.status,
            "jurisdiction": act.jurisdiction,
            "state": act.state or act.jurisdiction or "Central",
            "act_number": act.act_number or ""
        }

    def _format_section(self, sec: LegalSection):
        import re
        title = sec.section_title
        content = sec.text or ""

        # Try to extract actual title from content
        # Format usually has "| Section XX: Actual Title**" or similar
        match = re.search(r'\|\s*Section\s+[^:]+:\s*(.*?)(?:\*\*|\.\*\*|—|$)', content, re.IGNORECASE)
        if match:
            extracted = match.group(1).strip()
            if extracted and len(extracted) < 200:
                title = extracted

        # Clean up the content by removing the huge header
        # The header looks like: "Act: The ... \n Chapter ... | Section ..."
        content_cleaned = re.sub(r'^Act:.*?(?=\n|$)\n*', '', content, flags=re.IGNORECASE)
        content_cleaned = re.sub(r'^(?:Chapter.*?\|)?\s*Section.*?(?:\*\*|\.\*\*|—)\s*', '', content_cleaned, flags=re.IGNORECASE)

        if not content_cleaned.strip():
            content_cleaned = content

        return {
            "id": sec.id,
            "number": sec.section_number,
            "title": title,
            "content": content_cleaned,
            "chapterId": sec.chapter,
            "chapterTitle": sec.chapter,
            "chapterSubtitle": sec.chapter_title
        }


bare_acts_service = BareActsService()
