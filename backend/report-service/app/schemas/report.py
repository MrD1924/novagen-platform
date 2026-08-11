from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    project_id: UUID | None = None
    title: str
    format: str = "pdf"  # 'pdf' | 'excel'
    sections: list[dict] = []  # PDF: [{"heading","rows"}]  Excel: reused as sheet defs


class ReportResponse(BaseModel):
    id: UUID
    title: str
    format: str
    file_key: str
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True
