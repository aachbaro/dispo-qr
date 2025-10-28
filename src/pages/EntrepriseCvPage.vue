<!-- src/pages/EntrepriseCvPage.vue -->
<!-- -------------------------------------------------------------
 Page CV Entreprise (public + édition propriétaire)
---------------------------------------------------------------
Affiche :
- CV public (profile + skills + expériences + formations)
- Bouton « Modifier » si owner/admin (édition inline simple)

Rappels :
- Données chargées via GET /api/entreprises/[ref]/cv
- Lecture publique, édition réservée owner/admin
--------------------------------------------------------------- -->

<template>
  <div class="max-w-4xl mx-auto p-6 space-y-8">
    <div v-if="loading" class="text-gray-500">Chargement du CV...</div>
    <div v-else-if="errorMessage" class="text-red-600">{{ errorMessage }}</div>
    <div v-else-if="!entreprise" class="text-gray-500">
      CV introuvable pour cette entreprise.
    </div>
    <template v-else>
      <!-- Header CV -->
      <header class="flex flex-col gap-4 md:flex-row md:items-center">
        <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          <img
            v-if="profile?.photo_url"
            :src="profile.photo_url"
            alt="Photo de profil"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-semibold">
            {{ entreprise?.prenom }} {{ entreprise?.nom }}
          </h1>
          <p class="text-sm text-gray-500">
            {{ entreprise?.ville }}<span v-if="entreprise?.pays"> • {{ entreprise?.pays }}</span>
          </p>
        </div>
        <button
          v-if="isOwner"
          type="button"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          @click="toggleEdit"
        >
          {{ editMode ? "Annuler" : "Modifier" }}
        </button>
      </header>

      <!-- Profil -->
      <section class="space-y-3">
        <div v-if="!editMode">
          <h2 class="text-xl font-medium">{{ profile?.job_title || "Intitulé de poste" }}</h2>
          <p class="text-sm text-gray-500">{{ profile?.location }}</p>
          <p class="mt-3 whitespace-pre-line">{{ profile?.bio }}</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            v-model="form.job_title"
            type="text"
            class="border rounded px-3 py-2"
            placeholder="Intitulé de poste"
          />
          <input
            v-model="form.location"
            type="text"
            class="border rounded px-3 py-2"
            placeholder="Localisation"
          />
          <input
            v-model="form.photo_url"
            type="text"
            class="border rounded px-3 py-2 md:col-span-2"
            placeholder="URL de la photo"
          />
          <textarea
            v-model="form.bio"
            rows="4"
            class="border rounded px-3 py-2 md:col-span-2"
            placeholder="Bio"
          />
          <div class="md:col-span-2 flex gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              :disabled="saving"
              @click="saveProfile"
            >
              {{ saving ? "Enregistrement..." : "Enregistrer" }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded border"
              :disabled="saving"
              @click="toggleEdit"
            >
              Annuler
            </button>
          </div>
        </div>
      </section>

      <!-- Compétences -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Compétences</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="skill in skills"
            :key="skill.id"
            class="px-3 py-1 rounded-full text-xs bg-gray-100 border border-gray-200 flex items-center gap-2"
          >
            <span>{{ skill.name }}</span>
            <button
              v-if="isOwner"
              type="button"
              class="text-gray-500 hover:text-black"
              @click="removeSkill(skill.id)"
            >
              ×
            </button>
          </span>
          <span v-if="!skills.length" class="text-sm text-gray-500">Aucune compétence renseignée.</span>
        </div>
        <div v-if="isOwner" class="flex gap-2">
          <input
            v-model="newSkill"
            type="text"
            class="border rounded px-3 py-2"
            placeholder="Ajouter une compétence"
            @keyup.enter="addSkill"
          />
          <button type="button" class="px-3 py-2 border rounded" @click="addSkill">
            Ajouter
          </button>
        </div>
      </section>

      <!-- Expériences -->
      <section class="space-y-3">
        <h3 class="font-medium">Expériences</h3>
        <ul class="space-y-3">
          <li v-for="experience in experiences" :key="experience.id" class="border rounded-lg p-4">
            <div class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p class="font-medium">
                {{ experience.title }}
                <span v-if="experience.company" class="text-gray-500">• {{ experience.company }}</span>
              </p>
              <p class="text-sm text-gray-500">
                {{ experience.start_date || "" }}
                <span v-if="experience.end_date">→ {{ experience.end_date }}</span>
              </p>
            </div>
            <p class="text-sm text-gray-600 whitespace-pre-line mt-2">
              {{ experience.description }}
            </p>
          </li>
        </ul>
        <p v-if="!experiences.length" class="text-sm text-gray-500">Aucune expérience renseignée.</p>
      </section>

      <!-- Formations -->
      <section class="space-y-3">
        <h3 class="font-medium">Formations</h3>
        <ul class="space-y-3">
          <li v-for="educationItem in education" :key="educationItem.id" class="border rounded-lg p-4">
            <div class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p class="font-medium">
                {{ educationItem.title }}
                <span v-if="educationItem.school" class="text-gray-500">• {{ educationItem.school }}</span>
              </p>
              <p class="text-sm text-gray-500">{{ educationItem.year }}</p>
            </div>
          </li>
        </ul>
        <p v-if="!education.length" class="text-sm text-gray-500">Aucune formation renseignée.</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  addSkills,
  deleteSkill,
  getCv,
  updateProfile,
  type CvEducation,
  type CvEntreprise,
  type CvExperience,
  type CvProfile,
  type CvSkill,
} from "@/services/cv";
import { useAuth } from "@/composables/useAuth";

const { user, ready } = useAuth();
const route = useRoute();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const entreprise = ref<CvEntreprise | null>(null);
const profile = ref<CvProfile>(null);
const skills = ref<CvSkill[]>([]);
const experiences = ref<CvExperience[]>([]);
const education = ref<CvEducation[]>([]);

const editMode = ref(false);
const form = ref({
  job_title: "",
  location: "",
  bio: "",
  photo_url: "",
});
const newSkill = ref("");

const refParam = computed(() => {
  const value = route.params.ref;
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
});

const isOwner = computed(() => {
  if (!user.value || !entreprise.value) return false;
  return user.value.role === "admin" || user.value.id === entreprise.value.user_id;
});

function resetForm() {
  form.value.job_title = profile.value?.job_title ?? "";
  form.value.location = profile.value?.location ?? "";
  form.value.bio = profile.value?.bio ?? "";
  form.value.photo_url = profile.value?.photo_url ?? "";
}

async function loadCv() {
  if (!refParam.value) {
    errorMessage.value = "Référence entreprise manquante.";
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    const data = await getCv(refParam.value);
    entreprise.value = data.entreprise;
    profile.value = data.profile;
    skills.value = data.skills;
    experiences.value = data.experiences;
    education.value = data.education;
    resetForm();
  } catch (error: any) {
    console.error("❌ Erreur chargement CV:", error);
    errorMessage.value = error?.message || "Impossible de charger le CV.";
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  if (!isOwner.value || !refParam.value) return;

  saving.value = true;
  try {
    const { profile: updated } = await updateProfile(refParam.value, {
      job_title: form.value.job_title || null,
      location: form.value.location || null,
      bio: form.value.bio || null,
      photo_url: form.value.photo_url || null,
    });
    profile.value = updated;
    editMode.value = false;
  } catch (error) {
    console.error("❌ Erreur mise à jour profile:", error);
  } finally {
    saving.value = false;
  }
}

async function addSkill() {
  if (!isOwner.value || !refParam.value) return;
  const name = newSkill.value.trim();
  if (!name) return;

  try {
    const { skills: updated } = await addSkills(refParam.value, name);
    skills.value = updated;
    newSkill.value = "";
  } catch (error) {
    console.error("❌ Erreur ajout compétence:", error);
  }
}

async function removeSkill(id: number) {
  if (!isOwner.value || !refParam.value) return;

  try {
    await deleteSkill(refParam.value, id);
    skills.value = skills.value.filter((skill: CvSkill) => skill.id !== id);
  } catch (error) {
    console.error("❌ Erreur suppression compétence:", error);
  }
}

function toggleEdit() {
  if (!isOwner.value) return;
  editMode.value = !editMode.value;
  if (!editMode.value) {
    resetForm();
  }
}

onMounted(async () => {
  await ready();
  await loadCv();
});

watch(
  () => route.params.ref,
  async () => {
    await loadCv();
  }
);

watch(
  () => user.value,
  () => {
    // Mise à jour de l’état owner si l’utilisateur change (connexion/déconnexion)
    if (!editMode.value) {
      resetForm();
    }
  }
);
</script>
