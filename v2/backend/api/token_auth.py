"""
api/token_auth.py
Layer  : Backend — authentification
Role   : Backend DRF custom qui lit "Authorization: Token <valeur>" et résout
         le User Django correspondant via UserApiToken.
         Utilisé en DEFAULT_AUTHENTICATION_CLASSES dans settings.py.
Depends: api.models.UserApiToken
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import UserApiToken


class ProfileTokenAuthentication(BaseAuthentication):
    """Authentification par token opaque lié à un AccountProfile."""

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Token "):
            return None

        token_value = header[6:].strip()
        if not token_value:
            return None

        try:
            api_token = UserApiToken.objects.select_related(
                "profile__user"
            ).get(token=token_value)
        except UserApiToken.DoesNotExist:
            raise AuthenticationFailed("Token invalide ou expiré.")

        return (api_token.profile.user, api_token)

    def authenticate_header(self, request):
        return "Token"
