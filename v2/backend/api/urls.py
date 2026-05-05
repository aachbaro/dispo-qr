"""
api/urls.py
Layer  : Backend — routage API
Role   : Déclare toutes les URLs de l'API ExtraBeam v2.
         Préfixe /api/ ajouté dans config/urls.py.
"""

from django.urls import path

from .views import (
    AdminAccountDetailView,
    AdminOverviewView,
    AvatarFileView,
    FactureDetailView,
    FacturesView,
    GoogleLoginView,
    HealthView,
    LoginView,
    MissionDetailView,
    MissionsView,
    ProfileOverviewView,
    RegisterView,
    SkillDetailView,
    SkillsView,
    SlotDetailView,
    SlotsView,
    UnavailabilitiesView,
    UnavailabilityDetailView,
)

urlpatterns = [
    # --- Santé ---
    path("health/", HealthView.as_view(), name="health"),

    # --- Avatars uploadés ---
    path("avatars/<str:avatar_id>/", AvatarFileView.as_view(), name="avatar-file"),

    # --- Auth locale / Google ---
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),

    # --- Admin ---
    path("admin/overview/", AdminOverviewView.as_view(), name="admin-overview"),
    path("admin/accounts/<int:account_id>/", AdminAccountDetailView.as_view(), name="admin-account-detail"),

    # --- Profil public ---
    path("profiles/<slug:slug>/", ProfileOverviewView.as_view(), name="profile-overview"),

    # --- Skills ---
    path("profiles/<slug:slug>/skills/", SkillsView.as_view(), name="skills"),
    path("profiles/<slug:slug>/skills/<int:skill_id>/", SkillDetailView.as_view(), name="skill-detail"),

    # --- Slots ---
    path("profiles/<slug:slug>/slots/", SlotsView.as_view(), name="slots"),
    path("profiles/<slug:slug>/slots/<int:slot_id>/", SlotDetailView.as_view(), name="slot-detail"),

    # --- Unavailabilities ---
    path("profiles/<slug:slug>/unavailabilities/", UnavailabilitiesView.as_view(), name="unavailabilities"),
    path("profiles/<slug:slug>/unavailabilities/<int:unavailability_id>/", UnavailabilityDetailView.as_view(), name="unavailability-detail"),

    # --- Missions ---
    path("profiles/<slug:slug>/missions/", MissionsView.as_view(), name="missions"),
    path("profiles/<slug:slug>/missions/<int:mission_id>/", MissionDetailView.as_view(), name="mission-detail"),

    # --- Factures ---
    path("profiles/<slug:slug>/factures/", FacturesView.as_view(), name="factures"),
    path("profiles/<slug:slug>/factures/<int:facture_id>/", FactureDetailView.as_view(), name="facture-detail"),
]
