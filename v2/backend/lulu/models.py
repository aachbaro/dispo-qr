from django.db import models


class Employee(models.Model):
    name = models.CharField(max_length=80)
    pin_hash = models.CharField(max_length=128)
    manager = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    weekly_hours = models.FloatField(default=35)
    skills = models.JSONField(default=list)
    defaults = models.JSONField(default=dict)
    fixed_shifts = models.JSONField(default=list)
    failed_attempts = models.PositiveIntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)


class Session(models.Model):
    digest = models.CharField(max_length=64, unique=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()


class Board(models.Model):
    # One restaurant for this prototype. Revision protects concurrent edits.
    revision = models.PositiveIntegerField(default=0)
    data = models.JSONField(default=dict)
