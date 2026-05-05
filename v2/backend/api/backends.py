import os

from social_core.backends.open_id_connect import OpenIdConnectAuth


class PascuansOIDCBackend(OpenIdConnectAuth):
    name = "pascuans_oidc"
    OIDC_ENDPOINT = os.getenv("OIDC_ISSUER_URL", "https://auth.pascuans.dev").rstrip("/")
    DEFAULT_SCOPE = ["openid", "profile", "email"]
    PKCE_DEFAULT_CODE_CHALLENGE_METHOD = "S256"
    EXTRA_DATA = [
        ("id_token", "id_token"),
        ("access_token", "access_token"),
        ("refresh_token", "refresh_token"),
        ("expires_in", "expires"),
    ]
