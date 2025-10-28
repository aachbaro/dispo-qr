// src/services/cv.ts
// -------------------------------------------------------------
// Services CV (profile, skills, experiences, education)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Abstrait les endpoints /api/entreprises/[ref]/cv/*
//   - Fournit des méthodes typées pour la page CV
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/cv
//   - GET  /api/entreprises/[ref]/cv/profile
//   - PUT  /api/entreprises/[ref]/cv/profile
//   - GET  /api/entreprises/[ref]/cv/skills
//   - POST /api/entreprises/[ref]/cv/skills
//   - DELETE /api/entreprises/[ref]/cv/skills/[id]
//   - GET  /api/entreprises/[ref]/cv/experiences
//   - POST /api/entreprises/[ref]/cv/experiences
//   - PUT  /api/entreprises/[ref]/cv/experiences/[id]
//   - DELETE /api/entreprises/[ref]/cv/experiences/[id]
//   - GET  /api/entreprises/[ref]/cv/education
//   - POST /api/entreprises/[ref]/cv/education
//   - PUT  /api/entreprises/[ref]/cv/education/[id]
//   - DELETE /api/entreprises/[ref]/cv/education/[id]
//
// 🔒 Règles d’accès :
//   - Lecture publique (skipAuth)
//   - Écriture : token requis (Authorization Bearer)
// -------------------------------------------------------------

import { request } from "./api";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../../types/database";

export type CvProfile = Tables<"cv_profiles"> | null;
export type CvSkill = Tables<"cv_skills">;
export type CvExperience = Tables<"cv_experiences"> & {
  is_current?: boolean | null;
};
export type CvEducation = Tables<"cv_education">;
export type CvEntreprise = Tables<"entreprise">;

type CvProfilePayload = Pick<
  TablesInsert<"cv_profiles">,
  "job_title" | "location" | "bio" | "photo_url"
>;

export type CvExperienceInsert = Omit<
  TablesInsert<"cv_experiences">,
  "entreprise_id"
>;
export type CvExperienceUpdate = Omit<
  TablesUpdate<"cv_experiences">,
  "entreprise_id"
>;
export type CvEducationInsert = Omit<
  TablesInsert<"cv_education">,
  "entreprise_id"
>;
export type CvEducationUpdate = Omit<
  TablesUpdate<"cv_education">,
  "entreprise_id"
>;

export async function getCv(ref: string): Promise<{
  entreprise: CvEntreprise;
  profile: CvProfile;
  skills: CvSkill[];
  experiences: CvExperience[];
  education: CvEducation[];
}> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv`, {
    skipAuth: true,
  });
}

export async function getProfile(ref: string): Promise<{ profile: CvProfile }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/profile`, {
    skipAuth: true,
  });
}

export async function updateProfile(
  ref: string,
  payload: Partial<CvProfilePayload>
): Promise<{ profile: Tables<"cv_profiles"> }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getSkills(
  ref: string
): Promise<{ skills: CvSkill[] }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/skills`, {
    skipAuth: true,
  });
}

export async function addSkills(
  ref: string,
  names: string[] | string
): Promise<{ skills: CvSkill[] }> {
  const body = Array.isArray(names) ? { names } : { name: names };
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/skills`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteSkill(
  ref: string,
  id: number
): Promise<{ message: string }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/skills/${id}`, {
    method: "DELETE",
  });
}

export async function getExperiences(
  ref: string
): Promise<{ experiences: CvExperience[] }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/experiences`, {
    skipAuth: true,
  });
}

export async function createExperience(
  ref: string,
  payload: Partial<CvExperience>
): Promise<{ experiences: CvExperience[] }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/experiences`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExperience(
  ref: string,
  id: number,
  updates: Partial<CvExperience>
): Promise<{ message: string }> {
  return request(
    `/api/entreprises/${encodeURIComponent(ref)}/cv/experiences/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

export async function deleteExperience(
  ref: string,
  id: number
): Promise<{ message: string }> {
  return request(
    `/api/entreprises/${encodeURIComponent(ref)}/cv/experiences/${id}`,
    {
      method: "DELETE",
    }
  );
}

export async function getEducation(
  ref: string
): Promise<{ education: CvEducation[] }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/education`, {
    skipAuth: true,
  });
}

export async function createEducation(
  ref: string,
  payload: CvEducationInsert
): Promise<{ education: CvEducation[] }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/education`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEducation(
  ref: string,
  id: number,
  updates: CvEducationUpdate
): Promise<{ message: string }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteEducation(
  ref: string,
  id: number
): Promise<{ message: string }> {
  return request(`/api/entreprises/${encodeURIComponent(ref)}/cv/education/${id}`, {
    method: "DELETE",
  });
}
