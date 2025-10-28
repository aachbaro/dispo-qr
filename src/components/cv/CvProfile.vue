<template>
  <div>
    <header class="flex flex-col md:flex-row items-center gap-4 border-b pb-4">
      <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
        <img
          v-if="photoPreview"
          :src="photoPreview"
          alt="Portrait de l'entreprise"
          class="w-full h-full object-cover"
        />
        <div v-else class="flex items-center justify-center text-gray-400 h-full">
          Aucun portrait
        </div>
      </div>

      <div class="flex-1 space-y-1 text-center md:text-left">
        <h2 class="text-xl font-semibold">
          {{ entreprise?.prenom }} {{ entreprise?.nom }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ profile?.job_title || "Intitulé non renseigné" }}
        </p>
        <p class="text-sm text-gray-400">
          {{ profile?.location || "Localisation non renseignée" }}
        </p>
      </div>

      <button
        v-if="isOwner"
        class="px-3 py-1 border rounded text-sm"
        @click="toggleEdit"
      >
        {{ editMode ? "Annuler" : "Modifier" }}
      </button>
    </header>

    <div v-if="editMode" class="mt-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          v-model="form.job_title"
          type="text"
          placeholder="Intitulé de poste"
          class="border rounded w-full px-3 py-2"
        />
        <input
          v-model="form.location"
          type="text"
          placeholder="Localisation"
          class="border rounded w-full px-3 py-2"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Photo (URL ou fichier)
        </label>
        <input
          v-model="form.photo_url"
          type="url"
          placeholder="https://..."
          class="border rounded w-full px-3 py-2"
        />
        <input type="file" accept="image/*" @change="onFileChange" class="text-sm" />
      </div>

      <textarea
        v-model="form.bio"
        placeholder="Biographie"
        rows="4"
        class="border rounded w-full px-3 py-2"
      ></textarea>

      <div class="flex items-center gap-2">
        <button
          :disabled="pending"
          @click="save"
          class="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-60"
        >
          {{ pending ? "Enregistrement..." : "Enregistrer" }}
        </button>
        <button
          type="button"
          class="text-sm text-gray-500 underline"
          @click="resetForm"
        >
          Réinitialiser
        </button>
      </div>
    </div>

    <p v-else class="mt-3 text-gray-600 whitespace-pre-line">
      {{ profile?.bio || "Aucune biographie renseignée pour le moment." }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { updateProfile } from "@/services/cv";
import type { CvEntreprise, CvProfile } from "@/services/cv";

const props = defineProps<{
  entreprise: CvEntreprise | null;
  profile: CvProfile;
  isOwner: boolean;
}>();

const emit = defineEmits<["updated"]>();

const editMode = ref(false);
const pending = ref(false);
const form = reactive({
  job_title: "",
  location: "",
  bio: "",
  photo_url: "",
});
const photoPreview = ref<string | null>(null);

watch(
  () => props.profile,
  (profile) => {
    form.job_title = profile?.job_title ?? "";
    form.location = profile?.location ?? "";
    form.bio = profile?.bio ?? "";
    form.photo_url = profile?.photo_url ?? "";
    photoPreview.value = profile?.photo_url ?? null;
  },
  { immediate: true }
);

watch(
  () => form.photo_url,
  (value) => {
    photoPreview.value = value ? value : null;
  }
);

function toggleEdit() {
  editMode.value = !editMode.value;
  if (!editMode.value) {
    resetForm();
  }
}

function resetForm() {
  form.job_title = props.profile?.job_title ?? "";
  form.location = props.profile?.location ?? "";
  form.bio = props.profile?.bio ?? "";
  form.photo_url = props.profile?.photo_url ?? "";
  photoPreview.value = props.profile?.photo_url ?? null;
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    form.photo_url = result;
    photoPreview.value = result;
  };
  reader.readAsDataURL(file);
}

async function save() {
  if (!props.entreprise?.slug) {
    console.warn("Impossible de mettre à jour le profil : slug manquant");
    return;
  }

  pending.value = true;
  try {
    await updateProfile(props.entreprise.slug, {
      job_title: form.job_title || null,
      location: form.location || null,
      bio: form.bio || null,
      photo_url: form.photo_url || null,
    });
    editMode.value = false;
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil", error);
  } finally {
    pending.value = false;
  }
}
</script>
