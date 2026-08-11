"""Seeds Postgres with a small dummy scientific dataset: diseases, compounds,
and an admin user. Run from backend/ with PYTHONPATH=. set, e.g.:
  cd backend && PYTHONPATH=. python ../database/seed/seed.py
(or the Windows/native equivalent - see RUNNING.md / deployment/native/README.md)

NOTE: each statement is executed separately. asyncpg (via SQLAlchemy's async
driver) prepares parameterized statements individually and does not support
multiple semicolon-separated commands in one prepared statement - unlike
psycopg2's simple query protocol. Splitting these out is required, not just
tidier.
"""
import asyncio
import os
import sys

sys.path.append("/app")  # present when run inside a Docker container; harmless no-op natively
from shared.database import AsyncSessionLocal  # noqa: E402
from shared.security import hash_password  # noqa: E402

STATEMENTS = [
    (
        """
        INSERT INTO users (email, full_name, hashed_password, role, organization)
        VALUES ('admin@novagen.ai', 'NovaGen Admin', :hashed_pw, 'admin', 'NovaGen AI')
        ON CONFLICT (email) DO NOTHING;
        """,
        True,  # needs the hashed_pw parameter
    ),
    (
        """
        INSERT INTO diseases (name, disease_ontology_id, description, biomarkers, associated_genes)
        VALUES
          ('Non-small cell lung cancer', 'DOID:3908', 'Most common form of lung cancer.', '["EGFR", "ALK"]', '["EGFR", "KRAS", "ALK"]'),
          ('Type 2 diabetes mellitus', 'DOID:9352', 'Chronic metabolic disorder.', '["HbA1c"]', '["TCF7L2", "PPARG"]')
        ON CONFLICT DO NOTHING;
        """,
        False,
    ),
    (
        """
        INSERT INTO compounds (name, smiles, molecular_weight, source)
        VALUES
          ('Aspirin', 'CC(=O)Oc1ccccc1C(=O)O', 180.16, 'database'),
          ('Caffeine', 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', 194.19, 'database'),
          ('Ibuprofen', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', 206.28, 'database')
        ON CONFLICT DO NOTHING;
        """,
        False,
    ),
]


async def seed() -> None:
    from sqlalchemy import text

    hashed_pw = hash_password(os.environ.get("SEED_ADMIN_PASSWORD", "ChangeMe123!"))

    async with AsyncSessionLocal() as session:
        for sql, needs_password in STATEMENTS:
            params = {"hashed_pw": hashed_pw} if needs_password else {}
            await session.execute(text(sql), params)
        await session.commit()

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
