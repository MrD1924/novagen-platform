from celery import Celery

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

settings = get_settings()

celery_app = Celery(
    "novagen_automation",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.worker"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "nightly-model-retrain-check": {
            "task": "app.worker.check_retrain_triggers",
            "schedule": 3600.0 * 24,  # once a day
        },
    },
)


def _create_notification(user_id: str, title: str, body: str) -> bool:
    """Real, visible output: creates an actual row in notification-service's
    database, which the frontend already reads on the Notifications page and
    the dashboard activity widget. This is what makes SNS Workbench's
    response show up anywhere at all - earlier versions computed this text
    and then discarded it."""
    import httpx

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{settings.internal_notification_service_url}/notifications",
            json={"user_id": user_id, "title": title, "body": body},
        )
    return resp.status_code == 201


@celery_app.task(name="app.worker.run_sns_job")
def run_sns_job(pipeline_run_id: str, stage: str, user_id: str | None = None) -> dict:
    """Fired on every pipeline stage advance. Creates a real notification for
    the researcher who owns the run, using SNS Workbench's generated status
    text when available."""
    from app.services.sns_client import dispatch_stage_job

    sns_result = dispatch_stage_job(pipeline_run_id, stage)
    text = sns_result.get("text") or f"Pipeline run {pipeline_run_id} advanced to stage: {stage}."

    notified = False
    if user_id:
        notified = _create_notification(user_id, f"Pipeline stage: {stage.replace('_', ' ').title()}", text)

    return {**sns_result, "notification_created": notified}


@celery_app.task(name="app.worker.check_retrain_triggers")
def check_retrain_triggers() -> dict:
    """Daily beat task. No single user owns this system-wide check, so unlike
    the other tasks it doesn't create a per-user notification - it still
    genuinely calls SNS Workbench and captures whatever text comes back for
    visibility in Celery's own task result/logs."""
    from app.services.sns_client import check_and_queue_retraining

    return check_and_queue_retraining()


@celery_app.task(name="app.worker.generate_scheduled_report")
def generate_scheduled_report(project_id: str, report_format: str = "pdf", user_id: str | None = None) -> dict:
    """Generates a report via report-service, tells SNS Workbench about it,
    and - if a user_id is available - creates a real notification with SNS's
    generated summary so the report's completion is actually visible
    somewhere, not just computed and dropped."""
    import httpx
    from app.services.sns_client import notify_report_generated

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{settings.internal_report_service_url}/generate",
            json={"project_id": project_id, "title": "Scheduled Report", "format": report_format, "sections": []},
        )
    result = {"status_code": resp.status_code}

    if resp.status_code == 201:
        report = resp.json()
        sns_result = notify_report_generated(
            report_id=report["id"],
            title=report["title"],
            report_format=report["format"],
            download_url=report["download_url"],
        )
        result["sns_notified"] = sns_result.get("dispatched", False)

        if user_id:
            text = sns_result.get("text") or f"Your report '{report['title']}' is ready to download."
            result["notification_created"] = _create_notification(user_id, "Report ready", text)

    return result


@celery_app.task(name="app.worker.dispatch_notification")
def dispatch_notification(user_id: str, title: str, body: str | None = None) -> dict:
    """Asks SNS Workbench to rewrite/enrich the notification, then creates the
    real notification using SNS's output when it produced usable text -
    falling back to the original body otherwise, so this never silently
    fails to notify the user just because SNS returned nothing."""
    from app.services.sns_client import notify_dispatch

    sns_result = notify_dispatch(user_id, title, body)
    final_body = sns_result.get("text") or body or ""

    notified = _create_notification(user_id, title, final_body)
    return {**sns_result, "notification_created": notified}
