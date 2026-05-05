from django.contrib import admin

from .models import AccountProfile


@admin.register(AccountProfile)
class AccountProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "display_name", "role", "auth_provider", "google_sub", "oidc_sub", "created_at")
    search_fields = ("user__email", "display_name", "google_sub", "oidc_sub")
    list_filter = ("role", "auth_provider", "created_at")
