import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

import sys
sys.path.append("/app")
from shared.database import Base  # noqa: E402


class Disease(Base):
    __tablename__ = "diseases"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    disease_ontology_id: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    biomarkers: Mapped[list] = mapped_column(JSONB, default=list)
    associated_genes: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Protein(Base):
    __tablename__ = "proteins"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    uniprot_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    sequence: Mapped[str | None] = mapped_column(String, nullable=True)
    structure_file_key: Mapped[str | None] = mapped_column(String, nullable=True)
    druggability_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    disease_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("diseases.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Compound(Base):
    __tablename__ = "compounds"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    smiles: Mapped[str] = mapped_column(String, nullable=False)
    inchi_key: Mapped[str | None] = mapped_column(String, nullable=True)
    molecular_weight: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
