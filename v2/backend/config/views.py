"""
config/views.py
Layer  : Backend — vues Django (hors DRF)
Role   : Bridge post-login OIDC et logout centralisé.
         social_frontend_bridge redirige vers le frontend avec les données
         utilisateur et le token API en query params.
Depends: api.accounts, api.models
"""

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

from api.accounts import get_display_name_for_email, get_or_create_profile_for_user
from api.avatar_storage import build_profile_avatar_url
from api.models import AccountProfile, UserApiToken


@login_required
def social_frontend_bridge(request):
    """
    Appelé par social-auth après un login OIDC réussi.
    Génère (ou récupère) le token API et redirige vers le frontend
    avec toutes les données utilisateur en query params.
    """
    user = request.user
    profile = get_or_create_profile_for_user(
        user,
        display_name=user.first_name or get_display_name_for_email(user.email or user.username),
        auth_provider=AccountProfile.AUTH_PROVIDER_PASCUANS,
    )

    # Garantie absolue : le slug doit exister avant de rediriger.
    # get_or_create_profile_for_user peut ne pas déclencher save() si aucun champ
    # n'a changé sur un profil existant. On force ici si nécessaire.
    if not profile.slug:
        profile.save()
        profile.refresh_from_db()

    api_token = UserApiToken.get_or_create_for_profile(profile)

    params = {
        "id": str(profile.pk),
        "slug": profile.slug or "",
        "email": user.email,
        "display_name": profile.display_name or user.first_name or get_display_name_for_email(user.email or user.username),
        "avatar_url": build_profile_avatar_url(profile, request) or "",
        "role": profile.role,
        "auth_provider": profile.auth_provider,
        "oidc_sub": profile.oidc_sub or "",
        "token": api_token.token,
    }

    return redirect(f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback?{urlencode(params)}")


def social_logout(request):
    next_url = request.GET.get("next") or f"{settings.FRONTEND_URL.rstrip('/')}/login"
    logout(request)
    logout_url = f"{settings.OIDC_ISSUER_URL}/logout/?{urlencode({'next': next_url})}"
    return redirect(logout_url)
