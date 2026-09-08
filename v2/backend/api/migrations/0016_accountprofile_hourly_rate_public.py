from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_accountprofile_late_penalties_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountprofile",
            name="hourly_rate_public",
            field=models.BooleanField(default=False),
        ),
    ]
