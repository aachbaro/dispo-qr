import secrets
from pathlib import Path
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crée un accès développeur distinct des comptes du restaurant."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Révoque la clé précédente.")

    def handle(self, *args, **options):
        path = Path(getattr(settings, "LULU_ADMIN_KEY_FILE", settings.BASE_DIR / ".lulu-admin-key"))
        if path.exists() and not options["reset"]:
            self.stdout.write("Accès déjà initialisé. Utiliser --reset pour renouveler la clé.")
            return
        key = secrets.token_urlsafe(32)
        path.write_text(make_password(key), encoding="utf-8")
        self.stdout.write("Accès développeur Lulu : /lulu/admin\nClé privée : " + key)
