from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def dashboard_summary(db: AsyncSession) -> dict:
    projects = (await db.execute(text("SELECT count(*) FROM projects"))).scalar_one()
    active_experiments = (
        await db.execute(text("SELECT count(*) FROM experiments WHERE status = 'in_progress'"))
    ).scalar_one()
    predictions_30d = (
        await db.execute(text("SELECT count(*) FROM predictions WHERE created_at > now() - interval '30 days'"))
    ).scalar_one()
    avg_confidence = (
        await db.execute(text("SELECT coalesce(avg(confidence_score), 0) FROM predictions"))
    ).scalar_one()
    compounds = (await db.execute(text("SELECT count(*) FROM compounds"))).scalar_one()

    return {
        "total_projects": projects,
        "active_experiments": active_experiments,
        "predictions_last_30d": predictions_30d,
        "average_prediction_confidence": round(float(avg_confidence), 4),
        "compounds_in_library": compounds,
    }


async def pipeline_progress(db: AsyncSession) -> list[dict]:
    """Counts experiments per NovaGen pipeline stage, mapped from experiment_status."""
    rows = (
        await db.execute(
            text(
                "SELECT status, count(*) FROM experiments GROUP BY status"
            )
        )
    ).all()
    counts = {status: count for status, count in rows}
    total = sum(counts.values()) or 1
    stage_map = {
        "planned": "Planning",
        "in_progress": "Laboratory Validation",
        "completed": "Completed",
        "failed": "Failed",
        "cancelled": "Cancelled",
    }
    return [
        {"stage": label, "completed": counts.get(key, 0), "total": total}
        for key, label in stage_map.items()
    ]


async def model_performance(db: AsyncSession) -> list[dict]:
    rows = (
        await db.execute(text("SELECT name, version, task, metrics FROM model_registry WHERE is_active = true"))
    ).all()
    return [{"model_name": r[0], "version": r[1], "task": r[2], "metrics": r[3]} for r in rows]
