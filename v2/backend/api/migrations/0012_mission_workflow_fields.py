from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_client_workspace"),
    ]

    operations = [
        migrations.AddField(
            model_name="mission",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="client_missions",
                to="api.accountprofile",
            ),
        ),
        migrations.AddField(
            model_name="mission",
            name="contact_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="mission",
            name="contact_name",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="mission",
            name="contact_phone",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment_address_line1",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment_address_line2",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment_city",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment_country",
            field=models.CharField(blank=True, default="France", max_length=120),
        ),
        migrations.AddField(
            model_name="mission",
            name="establishment_postal_code",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="mission",
            name="instructions",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="mission",
            name="mode",
            field=models.CharField(
                choices=[("freelance", "Freelance"), ("salarie", "Salarie")],
                default="freelance",
                max_length=20,
            ),
        ),
    ]
