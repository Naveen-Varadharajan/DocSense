from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Processing")
    pages = Column(Integer, default=0)
    chunks = Column(Integer, default=0)
    file_size_mb = Column(Float, default=0.0)
