from __future__ import annotations

import base64
import mimetypes
import re
import secrets
from pathlib import Path

from django.conf import settings
from django.urls import reverse

from .models import AccountProfile

AVATAR_UPLOAD_PATTERN = re.compile(
    r"^data:image/(?P<format>jpeg|jpg|png|webp);base64,(?P<data>[A-Za-z0-9+/=\s]+)$"
)
AVATAR_MAX_BYTES = 512 * 1024
AVATAR_EXTENSION_MAP = {
    "jpeg": "jpg",
    "jpg": "jpg",
    "png": "png",
    "webp": "webp",
}


def get_avatar_storage_root() -> Path:
    return Path(settings.BASE_DIR) / "data" / "avatars"


def get_avatar_file_path(storage_key: str) -> Path:
    return get_avatar_storage_root() / storage_key


def parse_avatar_upload_data(upload_data: str) -> tuple[str, bytes]:
    normalized = upload_data.strip()
    match = AVATAR_UPLOAD_PATTERN.fullmatch(normalized)
    if not match:
        raise ValueError("Format d'image invalide. Utiliser JPEG, PNG ou WebP.")

    image_format = AVATAR_EXTENSION_MAP[match.group("format").lower()]
    try:
        payload = base64.b64decode(match.group("data"), validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise ValueError("Image avatar corrompue ou illisible.") from exc

    if len(payload) == 0:
        raise ValueError("Image avatar vide.")

    if len(payload) > AVATAR_MAX_BYTES:
        raise ValueError("Image avatar trop lourde. Réduire la taille avant l'envoi.")

    return image_format, payload


def delete_avatar_file_by_key(storage_key: str | None) -> None:
    if not storage_key:
        return

    file_path = get_avatar_file_path(storage_key)
    try:
        file_path.unlink()
    except FileNotFoundError:
        return


def delete_profile_avatar_file(profile: AccountProfile) -> None:
    delete_avatar_file_by_key(profile.avatar_storage_key)


def save_profile_avatar(profile: AccountProfile, upload_data: str) -> str:
    image_format, payload = parse_avatar_upload_data(upload_data)
    storage_root = get_avatar_storage_root()
    storage_root.mkdir(parents=True, exist_ok=True)

    new_key = f"{profile.pk}-{secrets.token_hex(12)}.{image_format}"
    file_path = storage_root / new_key
    file_path.write_bytes(payload)

    if profile.avatar_storage_key and profile.avatar_storage_key != new_key:
        delete_avatar_file_by_key(profile.avatar_storage_key)

    return new_key


def build_profile_avatar_url(profile: AccountProfile, request=None) -> str | None:
    if profile.avatar_storage_key:
        path = reverse("avatar-file", args=[profile.avatar_storage_key])
        http_request = getattr(request, "_request", request)
        if http_request is not None and hasattr(http_request, "build_absolute_uri"):
            return http_request.build_absolute_uri(path)

        frontend_url = str(getattr(settings, "FRONTEND_URL", "")).rstrip("/")
        return f"{frontend_url}{path}" if frontend_url else path

    avatar_url = (profile.avatar_url or "").strip()
    return avatar_url or None


def guess_avatar_content_type(storage_key: str) -> str:
    content_type, _ = mimetypes.guess_type(storage_key)
    return content_type or "application/octet-stream"
