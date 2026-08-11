import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

import sys
sys.path.append("/app")
from shared.database import Base  # noqa: E402


class ClinicalTrial(Base):
    __tablename__ = "clinical_trials"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    compound_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("compounds.id"), nullable=False)
    disease_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("diseases.id"), nullable=True)
    phase: Mapped[str] = mapped_column(
        Enum("preclinical", "phase_1", "phase_2", "phase_3", "phase_4", name="trial_phase", create_type=False),
        default="preclinical",
    )
    patient_cohort: Mapped[dict] = mapped_column(JSONB, default=dict)
    success_prediction: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    risk_analysis: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
