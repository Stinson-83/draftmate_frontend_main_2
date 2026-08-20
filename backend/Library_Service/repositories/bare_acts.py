from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from models import BareAct

class BareActRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 20, search: str = None, category: str = None, state: str = None):
        query = db.query(BareAct)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    BareAct.title.ilike(search_filter),
                    BareAct.act_number.ilike(search_filter),
                    BareAct.description.ilike(search_filter)
                )
            )
            
        if category:
            query = query.filter(BareAct.category == category)
            
        if state:
            query = query.filter(BareAct.state == state)
            
        total = query.count()
        items = query.order_by(desc(BareAct.created_at)).offset(skip).limit(limit).all()
        return items, total

    def get_by_id(self, db: Session, act_id: str):
        return db.query(BareAct).filter(BareAct.id == act_id).first()

bare_act_repository = BareActRepository()
