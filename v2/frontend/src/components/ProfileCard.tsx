/**
 * src/components/ProfileCard.tsx
 * Layer  : Frontend — composants
 * Role   : Carte de profil d'un freelance avec édition inline.
 *          Gère aussi l'upload d'avatar, son recadrage circulaire et
 *          la compression avant envoi au backend.
 * Used by: FreelancerProfilePage
 */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { addSkill, deleteSkill, updateProfile } from "../api";
import { useUserContext } from "../context/UserContext";
import {
  getAvatarRenderMetrics,
  loadAvatarFile,
  renderAvatarUploadData,
  type LoadedAvatarImage,
} from "../lib/avatarImage";
import type { FreelancerProfile, Skill } from "../types";

interface Props {
  profile: FreelancerProfile;
  isOwner: boolean;
  onProfileUpdated: (updated: FreelancerProfile) => void;
}

interface ProfileFormState {
  display_name: string;
  job_title: string;
  location: string;
  bio: string;
  avatar_url: string;
}

const AVATAR_PREVIEW_SIZE = 112;

function buildInitialForm(profile: FreelancerProfile): ProfileFormState {
  return {
    display_name: profile.display_name,
    job_title: profile.job_title,
    location: profile.location,
    bio: profile.bio,
    avatar_url: profile.avatar_url ?? "",
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ProfileCard({ profile, isOwner, onProfileUpdated }: Props) {
  const { user, setUser } = useUserContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(buildInitialForm(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<Skill[]>(profile.skills);
  const [newSkill, setNewSkill] = useState("");

  const [avatarDraft, setAvatarDraft] = useState<LoadedAvatarImage | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);

  useEffect(() => {
    setSkills(profile.skills);
  }, [profile.skills]);

  function resetAvatarEditor() {
    setAvatarDraft(null);
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEditing() {
    setError(null);
    setForm(buildInitialForm(profile));
    resetAvatarEditor();
    setEditing(true);
  }

  function stopEditing() {
    setError(null);
    setEditing(false);
    setForm(buildInitialForm(profile));
    resetAvatarEditor();
  }

  async function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const loaded = await loadAvatarFile(file);
      setAvatarDraft(loaded);
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      setForm((current) => ({ ...current, avatar_url: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de préparer cette image.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSave() {
    if (!user?.token) return;

    setSaving(true);
    setError(null);

    try {
      const payload: Parameters<typeof updateProfile>[1] = {
        display_name: form.display_name.trim(),
        job_title: form.job_title.trim(),
        location: form.location.trim(),
        bio: form.bio,
      };

      if (avatarDraft) {
        payload.avatar_upload_data = await renderAvatarUploadData(avatarDraft, {
          zoom: avatarZoom,
          offsetX: avatarOffsetX,
          offsetY: avatarOffsetY,
        });
      } else if (!form.avatar_url.trim() && profile.avatar_url) {
        payload.avatar_remove = true;
      } else if (form.avatar_url.trim() !== (profile.avatar_url ?? "").trim()) {
        payload.avatar_url = form.avatar_url.trim();
      }

      const updated = await updateProfile(profile.slug, payload, user.token);
      onProfileUpdated({ ...profile, ...updated, skills });
      setUser({
        ...user,
        display_name: updated.display_name,
        avatar_url: updated.avatar_url,
      });
      setEditing(false);
      resetAvatarEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill(event: FormEvent) {
    event.preventDefault();
    const name = newSkill.trim();
    if (!name || !user?.token) return;
    try {
      const skill = await addSkill(profile.slug, name, user.token);
      setSkills((prev) => [...prev, skill]);
      setNewSkill("");
    } catch (err) {
      console.error("Erreur ajout compétence :", err);
    }
  }

  async function handleDeleteSkill(id: number) {
    if (!user?.token) return;
    try {
      await deleteSkill(profile.slug, id, user.token);
      setSkills((prev) => prev.filter((skill) => skill.id !== id));
    } catch (err) {
      console.error("Erreur suppression compétence :", err);
    }
  }

  const initial = (editing ? form.display_name : profile.display_name)?.[0]?.toUpperCase() ?? "?";
  const displayAvatarUrl = editing ? form.avatar_url.trim() || null : profile.avatar_url;
  const avatarPreviewMetrics = avatarDraft
    ? getAvatarRenderMetrics(avatarDraft, AVATAR_PREVIEW_SIZE, {
        zoom: avatarZoom,
        offsetX: avatarOffsetX,
        offsetY: avatarOffsetY,
      })
    : null;

  return (
    <div className="rounded-eb-card border border-eb-layout bg-white p-6">
      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-eb-primary/10">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <span className="text-[28px] font-medium text-eb-primary">{initial}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[150px,1fr]">
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-3 rounded-eb-card border border-eb-layout bg-[#F8FAFF] p-4">
                    <div className="relative h-28 w-28 overflow-hidden rounded-full bg-eb-primary/10">
                      {avatarDraft && avatarPreviewMetrics ? (
                        <img
                          src={avatarDraft.dataUrl}
                          alt="Aperçu avatar"
                          className="absolute left-1/2 top-1/2 max-w-none"
                          style={{
                            width: `${avatarPreviewMetrics.renderedWidth}px`,
                            height: `${avatarPreviewMetrics.renderedHeight}px`,
                            transform: `translate(-50%, -50%) translate(${avatarPreviewMetrics.translateX}px, ${avatarPreviewMetrics.translateY}px)`,
                          }}
                        />
                      ) : displayAvatarUrl ? (
                        <img
                          src={displayAvatarUrl}
                          alt={form.display_name || profile.display_name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[34px] font-medium text-eb-primary">
                          {initial}
                        </div>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarSelection}
                      />
                      <button
                        type="button"
                        className="eb-btn-primary w-full justify-center"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {avatarDraft || displayAvatarUrl ? "Remplacer l'image" : "Choisir une image"}
                      </button>
                      {(avatarDraft || displayAvatarUrl) && (
                        <button
                          type="button"
                          className="eb-btn-ghost w-full justify-center"
                          onClick={() => {
                            resetAvatarEditor();
                            setForm((current) => ({ ...current, avatar_url: "" }));
                          }}
                        >
                          Retirer l'avatar
                        </button>
                      )}
                    </div>

                    <p className="text-center text-[12px] leading-5 text-eb-secondary">
                      JPG, PNG ou WebP. L'image sera recadrée en carré puis compressée automatiquement.
                    </p>

                    {avatarDraft && (
                      <p className="text-center text-[12px] leading-5 text-eb-muted">
                        {avatarDraft.fileName} · {formatFileSize(avatarDraft.fileSize)}
                      </p>
                    )}
                  </div>

                  {avatarDraft && (
                    <div className="space-y-3 rounded-eb-card border border-eb-layout bg-white p-4">
                      <label className="block space-y-2 text-[13px] text-eb-secondary">
                        <span className="font-medium text-eb-text">Zoom</span>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.01"
                          value={avatarZoom}
                          onChange={(event) => setAvatarZoom(Number(event.target.value))}
                          className="w-full"
                        />
                      </label>

                      <label className="block space-y-2 text-[13px] text-eb-secondary">
                        <span className="font-medium text-eb-text">Placement horizontal</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={avatarOffsetX}
                          onChange={(event) => setAvatarOffsetX(Number(event.target.value))}
                          className="w-full"
                        />
                      </label>

                      <label className="block space-y-2 text-[13px] text-eb-secondary">
                        <span className="font-medium text-eb-text">Placement vertical</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={avatarOffsetY}
                          onChange={(event) => setAvatarOffsetY(Number(event.target.value))}
                          className="w-full"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <input
                    className="eb-input w-full"
                    value={form.display_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, display_name: event.target.value }))
                    }
                    placeholder="Nom affiché"
                  />
                  <input
                    className="eb-input w-full"
                    value={form.job_title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, job_title: event.target.value }))
                    }
                    placeholder="Titre (ex : Développeur freelance)"
                  />
                  <input
                    className="eb-input w-full"
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder="Localisation"
                  />
                  <input
                    className="eb-input w-full"
                    value={form.avatar_url}
                    onChange={(event) => {
                      resetAvatarEditor();
                      setForm((current) => ({ ...current, avatar_url: event.target.value }));
                    }}
                    placeholder="URL externe de l'avatar (optionnel)"
                  />
                  <textarea
                    className="eb-input w-full resize-none"
                    rows={4}
                    value={form.bio}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, bio: event.target.value }))
                    }
                    placeholder="Bio…"
                  />
                </div>
              </div>

              {error && <p className="text-[13px] leading-5 text-eb-google">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" className="eb-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button type="button" className="eb-btn-ghost" onClick={stopEditing} disabled={saving}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <h1 className="truncate text-[22px] font-semibold leading-tight text-eb-text">
                  {profile.display_name || "—"}
                </h1>
                {isOwner && (
                  <button type="button" className="eb-btn-ghost shrink-0" onClick={startEditing}>
                    Modifier
                  </button>
                )}
              </div>
              {profile.job_title && (
                <p className="mt-0.5 text-[14px] text-eb-secondary">{profile.job_title}</p>
              )}
              {profile.location && <p className="text-[13px] text-eb-muted">{profile.location}</p>}
              {profile.bio && (
                <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-eb-text">
                  {profile.bio}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(skills.length > 0 || isOwner) && (
        <div className="mt-5 space-y-3">
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill.id} className="eb-chip">
                  {skill.name}
                  {isOwner && (
                    <button
                      type="button"
                      className="ml-1.5 opacity-50 transition-opacity hover:text-eb-google hover:opacity-100"
                      onClick={() => handleDeleteSkill(skill.id)}
                      aria-label={`Supprimer ${skill.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {isOwner && (
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                className="eb-input flex-1"
                value={newSkill}
                onChange={(event) => setNewSkill(event.target.value)}
                placeholder="Ajouter une compétence…"
              />
              <button
                type="submit"
                className="eb-btn-primary px-3"
                disabled={!newSkill.trim()}
              >
                +
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
