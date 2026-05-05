"""
api/serializers.py
Layer  : Backend — sérialisation
Role   : Sérialise/désérialise les données pour les endpoints profil, slots, indispos,
         missions et factures.
Depends: api.models (AccountProfile, Skill, Slot, Unavailability, Mission, Facture)
"""

import re
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from rest_framework import serializers

from .avatar_storage import (
    build_profile_avatar_url,
    delete_profile_avatar_file,
    parse_avatar_upload_data,
    save_profile_avatar,
)
from .models import AccountProfile, Facture, Mission, Skill, Slot, Unavailability


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class SlotSerializer(serializers.ModelSerializer):
    """Slot avec référence optionnelle à sa mission."""
    start = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S")
    end = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S")
    mission_id    = serializers.PrimaryKeyRelatedField(
        source="mission",
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    mission_title = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = ["id", "title", "start", "end", "mission_id", "mission_title"]

    def get_mission_title(self, obj: Slot) -> str | None:
        return obj.mission.title if obj.mission_id else None


class UnavailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Unavailability
        fields = [
            "id",
            "recurrence_type",
            "weekday",
            "start_date",
            "start_time",
            "end_time",
            "recurrence_end",
            "exceptions",
        ]


class ProfilePublicSerializer(serializers.ModelSerializer):
    """Sérialise un profil public (lecture seule, inclut skills)."""

    email = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = AccountProfile
        fields = [
            "id",
            "slug",
            "display_name",
            "avatar_url",
            "role",
            "job_title",
            "location",
            "bio",
            "phone",
            "email",
            "skills",
        ]

    def get_email(self, obj: AccountProfile) -> str:
        return obj.user.email or ""

    def get_avatar_url(self, obj: AccountProfile) -> str | None:
        return build_profile_avatar_url(obj, self.context.get("request"))


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Désérialise une mise à jour partielle du profil (owner uniquement)."""

    avatar_url = serializers.CharField(required=False, allow_blank=True)
    avatar_upload_data = serializers.CharField(
        required=False, allow_blank=False, write_only=True
    )
    avatar_remove = serializers.BooleanField(required=False, default=False, write_only=True)

    def validate_role(self, value: str) -> str:
        if value == AccountProfile.ROLE_ADMIN and (not self.instance or self.instance.role != AccountProfile.ROLE_ADMIN):
            raise serializers.ValidationError("Le role admin ne peut pas etre attribue depuis l'application.")
        return value

    def validate_avatar_url(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            return ""

        validator = URLValidator(schemes=["http", "https"])
        try:
            validator(normalized)
        except DjangoValidationError as exc:
            raise serializers.ValidationError("URL d'avatar invalide.") from exc
        return normalized

    def validate_avatar_upload_data(self, value: str) -> str:
        try:
            parse_avatar_upload_data(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return value

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        if attrs.get("avatar_upload_data") and attrs.get("avatar_url"):
            raise serializers.ValidationError(
                {"avatar_upload_data": "Choisir soit un fichier, soit une URL externe."}
            )
        return attrs

    def update(self, instance: AccountProfile, validated_data: dict) -> AccountProfile:
        avatar_upload_data = validated_data.pop("avatar_upload_data", None)
        avatar_remove = validated_data.pop("avatar_remove", False)
        avatar_url_provided = "avatar_url" in validated_data
        avatar_url = validated_data.pop("avatar_url", None) if avatar_url_provided else None
        current_local_avatar_url = build_profile_avatar_url(
            instance, self.context.get("request")
        )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if avatar_remove:
            delete_profile_avatar_file(instance)
            instance.avatar_storage_key = ""
            instance.avatar_url = ""
        elif avatar_upload_data:
            instance.avatar_storage_key = save_profile_avatar(instance, avatar_upload_data)
            instance.avatar_url = ""
        elif avatar_url_provided:
            normalized_avatar_url = avatar_url or ""
            if (
                instance.avatar_storage_key
                and normalized_avatar_url
                and normalized_avatar_url == current_local_avatar_url
            ):
                pass
            else:
                delete_profile_avatar_file(instance)
                instance.avatar_storage_key = ""
                instance.avatar_url = normalized_avatar_url

        instance.save()
        return instance

    class Meta:
        model = AccountProfile
        fields = [
            "display_name",
            "avatar_url",
            "avatar_upload_data",
            "avatar_remove",
            "role",
            "job_title",
            "location",
            "bio",
            "phone",
        ]


class MissionSerializer(serializers.ModelSerializer):
    """Sérialise une mission complète (lecture + écriture pour l'owner)."""
    slot_count = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = [
            "id",
            "title",
            "description",
            "status",
            "notes",
            "client_name",
            "client_email",
            "client_phone",
            "client_company",
            "daily_rate",
            "total_amount",
            "start_date",
            "end_date",
            "slot_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slot_count", "created_at", "updated_at"]

    def get_slot_count(self, obj: Mission) -> int:
        return obj.slots.count()


class FactureSerializer(serializers.ModelSerializer):
    """Sérialise une facture owner-only avec mission liée optionnelle."""

    date_emission = serializers.DateField(format="%Y-%m-%d", required=False)
    mission_id = serializers.PrimaryKeyRelatedField(
        source="mission",
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    mission_title = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            "id",
            "mission_id",
            "mission_title",
            "numero",
            "date_emission",
            "status",
            "client_name",
            "client_address_ligne1",
            "client_address_ligne2",
            "client_code_postal",
            "client_ville",
            "client_pays",
            "contact_name",
            "contact_phone",
            "contact_email",
            "description",
            "hours",
            "rate",
            "montant_ht",
            "tva",
            "montant_ttc",
            "mention_tva",
            "conditions_paiement",
            "penalites_retard",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "mission_title", "created_at", "updated_at"]

    def get_mission_title(self, obj: Facture) -> str | None:
        return obj.mission.title if obj.mission_id else None

    def validate_numero(self, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\d{4}-\d{1,}", normalized):
            raise serializers.ValidationError(
                "Format invalide. Utiliser AAAA-NNNN (ex: 2026-0001)."
            )
        return normalized

    def validate(self, attrs: dict) -> dict:
        profile = self.context.get("profile") or getattr(self.instance, "profile", None)
        mission = attrs.get("mission", getattr(self.instance, "mission", None))
        numero = attrs.get("numero", getattr(self.instance, "numero", ""))

        if profile and mission and mission.profile_id != profile.id:
            raise serializers.ValidationError(
                {"mission_id": "La mission choisie n'appartient pas à ce profil."}
            )

        if profile and numero:
            existing = Facture.objects.filter(profile=profile, numero=numero)
            if self.instance is not None:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {"numero": "Ce numéro de facture existe déjà pour ce profil."}
                )

        hours = attrs.get("hours", getattr(self.instance, "hours", None))
        rate = attrs.get("rate", getattr(self.instance, "rate", None))
        montant_ht = attrs.get("montant_ht", getattr(self.instance, "montant_ht", None))
        tva = attrs.get("tva", getattr(self.instance, "tva", Decimal("0")))
        montant_ttc = attrs.get("montant_ttc", getattr(self.instance, "montant_ttc", None))

        if montant_ht is None:
            if hours is not None and rate is not None:
                montant_ht = Decimal(hours) * Decimal(rate)
                attrs["montant_ht"] = montant_ht
            else:
                raise serializers.ValidationError(
                    {"montant_ht": "Le montant HT est requis."}
                )

        if montant_ttc is None:
            attrs["montant_ttc"] = montant_ht * (
                Decimal("1") + (Decimal(tva or 0) / Decimal("100"))
            )

        return attrs


class AdminAccountSummarySerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    skill_count = serializers.IntegerField(read_only=True)
    slot_count = serializers.IntegerField(read_only=True)
    mission_count = serializers.IntegerField(read_only=True)
    unavailability_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AccountProfile
        fields = [
            "id",
            "slug",
            "display_name",
            "avatar_url",
            "role",
            "auth_provider",
            "job_title",
            "location",
            "email",
            "skill_count",
            "slot_count",
            "mission_count",
            "unavailability_count",
            "created_at",
            "updated_at",
        ]

    def get_email(self, obj: AccountProfile) -> str:
        return obj.user.email or ""

    def get_avatar_url(self, obj: AccountProfile) -> str | None:
        return build_profile_avatar_url(obj, self.context.get("request"))


class AdminAccountDetailSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = AccountProfile
        fields = [
            "id",
            "slug",
            "display_name",
            "avatar_url",
            "role",
            "auth_provider",
            "google_sub",
            "oidc_sub",
            "job_title",
            "location",
            "bio",
            "phone",
            "email",
            "created_at",
            "updated_at",
        ]

    def get_email(self, obj: AccountProfile) -> str:
        return obj.user.email or ""

    def get_avatar_url(self, obj: AccountProfile) -> str | None:
        return build_profile_avatar_url(obj, self.context.get("request"))
