import secrets
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from lulu.models import Board, Employee


class Command(BaseCommand):
    help = "Initialise Lulu une seule fois ; affiche les PIN aléatoires à transmettre individuellement."

    @transaction.atomic
    def handle(self, *args, **options):
        if Employee.objects.exists():
            self.stdout.write("Lulu existe déjà. Aucun compte ni PIN modifié.")
            return
        names = ["Jean-Sébastien", "Éloïse", "Camille", "Émile", "Adam", "Nils", "Anna", "Hugo", "Pierrot", "Théodore", "Fousseinou", "Idrissa", "Oumarou", "Karan", "Waran", "Arule"]
        self.stdout.write("Lulu la Nantaise — accès initiaux privés\nContrats et compétences à vérifier dans Équipe.\n")
        for index, name in enumerate(names):
            pin = f"{secrets.randbelow(1000000):06d}"
            role = "salle" if index < 10 else "plonge" if index < 13 else "cuisine"
            Employee.objects.create(name=name, pin_hash=make_password(pin), manager=index == 0,
                                    weekly_hours=35, skills=[role, "cles", "ouverture", "fermeture"] if index == 0 else [role])
            self.stdout.write(f"{name} : {pin}")
        Board.objects.get_or_create(pk=1)
        self.stdout.write("\nLes horaires fixes des cuisiniers doivent être renseignés par Jean-Sébastien ; la photo représente une semaine, pas une récurrence confirmée.")
