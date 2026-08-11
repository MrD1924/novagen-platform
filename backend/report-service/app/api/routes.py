import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import presigned_url, upload_bytes
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.generators import build_excel_report, build_pdf_report

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


@router.post("/generate", response_model=ReportResponse, status_code=201)
async def generate_report(payload: ReportGenerateRequest, db: AsyncSession = Depends(get_db), user: TokenPayload = Depends(get_current_user)):
    report_id = uuid.uuid4()

    if payload.format == "pdf":
        content = build_pdf_report(payload.title, payload.sections)
        content_type = "application/pdf"
        ext = "pdf"
    elif payload.format == "excel":
        sheets = {s.get("heading", "Sheet"): s.get("rows", []) for s in payload.sections} or {"Sheet1": []}
        content = build_excel_report(payload.title, sheets)
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    else:
        raise HTTPException(400, "format must be 'pdf' or 'excel'")

    object_key = f"reports/{report_id}.{ext}"
    upload_bytes(object_key, content, content_type)

    report = Report(
        id=report_id, project_id=payload.project_id, title=payload.title,
        format=payload.format, file_key=object_key, generated_by=user.sub,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ReportResponse(
        id=report.id, title=report.title, format=report.format,
        file_key=report.file_key, download_url=presigned_url(object_key), created_at=report.created_at,
    )
