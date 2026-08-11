import io

from minio import Minio

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

settings = get_settings()

_client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_root_user,
    secret_key=settings.minio_root_password,
    secure=False,
)


def ensure_bucket() -> None:
    if not _client.bucket_exists(settings.minio_bucket):
        _client.make_bucket(settings.minio_bucket)


def upload_bytes(object_key: str, data: bytes, content_type: str) -> str:
    ensure_bucket()
    _client.put_object(settings.minio_bucket, object_key, io.BytesIO(data), length=len(data), content_type=content_type)
    return object_key


def presigned_url(object_key: str) -> str:
    return _client.presigned_get_object(settings.minio_bucket, object_key)
