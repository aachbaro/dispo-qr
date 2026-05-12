from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0014_facture_legal_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="accountprofile",
            name="late_penalties",
            field=models.TextField(blank=True, default="Taux BCE + 10 points"),
        ),
    ]
