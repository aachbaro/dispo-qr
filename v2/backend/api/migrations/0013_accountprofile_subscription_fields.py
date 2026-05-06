from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_mission_workflow_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountprofile",
            name="subscription_cancel_at_period_end",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="accountprofile",
            name="subscription_period_end",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accountprofile",
            name="subscription_plan",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="accountprofile",
            name="subscription_status",
            field=models.CharField(blank=True, default="", max_length=24),
        ),
    ]
