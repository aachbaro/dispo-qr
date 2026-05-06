from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_accountprofile_business_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="MissionTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("establishment", models.CharField(max_length=160)),
                ("contact_name", models.CharField(blank=True, max_length=160)),
                ("contact_email", models.EmailField(blank=True, max_length=254)),
                ("contact_phone", models.CharField(blank=True, max_length=30)),
                ("instructions", models.TextField(blank=True)),
                ("establishment_address_line1", models.CharField(blank=True, max_length=255)),
                ("establishment_address_line2", models.CharField(blank=True, max_length=255)),
                ("establishment_postal_code", models.CharField(blank=True, max_length=20)),
                ("establishment_city", models.CharField(blank=True, max_length=120)),
                ("establishment_country", models.CharField(blank=True, max_length=120)),
                ("mode", models.CharField(choices=[("freelance", "Freelance"), ("salarie", "Salarie")], default="freelance", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mission_templates", to="api.accountprofile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ClientContact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("client_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="client_contacts", to="api.accountprofile")),
                ("contact_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_by_clients", to="api.accountprofile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="clientcontact",
            constraint=models.UniqueConstraint(fields=("client_profile", "contact_profile"), name="unique_contact_per_client_profile"),
        ),
    ]
