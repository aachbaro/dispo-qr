import { ref } from "vue";
import type {
  CvEntreprise,
  CvProfile,
  CvSkill,
  CvExperience,
  CvEducation,
} from "@/services/cv";
import { getCv } from "@/services/cv";

export function useCv() {
  const entreprise = ref<CvEntreprise | null>(null);
  const profile = ref<CvProfile>(null);
  const skills = ref<CvSkill[]>([]);
  const experiences = ref<CvExperience[]>([]);
  const education = ref<CvEducation[]>([]);

  async function fetchCv(refSlug: string) {
    if (!refSlug) {
      return;
    }

    const data = await getCv(refSlug);
    entreprise.value = data.entreprise ?? null;
    profile.value = data.profile ?? null;
    skills.value = data.skills ?? [];
    experiences.value = data.experiences ?? [];
    education.value = data.education ?? [];
  }

  return {
    entreprise,
    profile,
    skills,
    experiences,
    education,
    fetchCv,
  };
}
