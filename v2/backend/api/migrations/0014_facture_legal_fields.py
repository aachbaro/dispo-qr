from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0013_accountprofile_subscription_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="facture",
            name="client_siren",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="facture",
            name="client_siret",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="facture",
            name="client_vat_number",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="facture",
            name="date_echeance",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="facture",
            name="escompte",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="facture",
            name="indemnite_recouvrement",
            field=models.TextField(blank=True),
        ),
    ]
