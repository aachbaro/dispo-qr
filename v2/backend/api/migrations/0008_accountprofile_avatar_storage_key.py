# Generated manually for avatar file storage support.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0007_facture"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountprofile",
            name="avatar_storage_key",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
