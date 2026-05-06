from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import BaseUserManager

from .accounts import get_display_name_for_email, get_or_create_profile_for_user
from .models import AccountProfile


def associate_by_email(backend, uid, user=None, *args, **kwargs):
    if user:
        return None

    details = kwargs.get("details", {})
    email = details.get("email")
    if not email:
        return None

    normalized_email = BaseUserManager.normalize_email(email)
    User = get_user_model()
    matches = list(User.objects.filter(email__iexact=normalized_email)[:2])
    if len(matches) == 1:
        return {"user": matches[0]}

    return None


def sync_pascuans_profile(backend, user=None, uid=None, response=None, details=None, *args, **kwargs):
    if not user:
        return None

    response = response or {}
    details = details or {}
    email = details.get("email") or user.email or user.username
    display_name = (
        response.get("name")
        or details.get("fullname")
        or details.get("username")
        or user.first_name
        or get_display_name_for_email(email)
    )
    avatar_url = response.get("picture") or ""
    oidc_sub = str(response.get("sub") or uid or "").strip() or None
    requested_role = backend.strategy.session_pop("role", None)
    if requested_role not in {
        AccountProfile.ROLE_FREELANCE,
        AccountProfile.ROLE_CLIENT,
    }:
        requested_role = None

    profile_defaults = {
        "display_name": display_name,
        "avatar_url": avatar_url,
        "auth_provider": AccountProfile.AUTH_PROVIDER_PASCUANS,
        "oidc_sub": oidc_sub,
    }
    if requested_role:
        profile_defaults["role"] = requested_role

    profile = get_or_create_profile_for_user(
        user,
        **profile_defaults,
    )

    dirty_fields: list[str] = []
    normalized_email = BaseUserManager.normalize_email(email)
    if normalized_email and user.email != normalized_email:
        user.email = normalized_email
        dirty_fields.append("email")
    if display_name and user.first_name != display_name:
        user.first_name = display_name
        dirty_fields.append("first_name")
    if dirty_fields:
        user.save(update_fields=dirty_fields)

    return {"profile": profile}
