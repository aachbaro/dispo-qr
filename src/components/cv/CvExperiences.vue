<template>
  <section>
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Expériences</h3>
      <button
        v-if="isOwner"
        class="px-3 py-1 text-sm bg-black text-white rounded"
        @click="openCreate"
      >
        Ajouter
      </button>
    </div>

    <div v-if="sortedExperiences.length" class="mt-4 space-y-4">
      <article
        v-for="experience in sortedExperiences"
        :key="experience.id"
        class="border border-gray-200 rounded-lg p-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h4 class="text-base font-semibold text-gray-900">
              {{ experience.title }}
            </h4>
            <p v-if="experience.company" class="text-sm text-gray-500">
              {{ experience.company }}
            </p>
            <p class="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {{ formatPeriod(experience.start_date, experience.end_date) }}
            </p>
          </div>

          <div v-if="isOwner" class="flex items-center gap-2">
            <button
              class="text-sm text-gray-500 hover:text-black"
              @click="openEdit(experience)"
            >
              Modifier
            </button>
            <button
              class="text-sm text-red-500 hover:text-red-700"
              :disabled="deletingId === experience.id"
              @click="removeExperience(experience.id)"
            >
              Supprimer
            </button>
          </div>
        </div>

        <p v-if="experience.description" class="text-sm text-gray-600 mt-3 whitespace-pre-line">
          {{ experience.description }}
        </p>
      </article>
    </div>
    <p v-else class="text-sm text-gray-500 mt-3">
      Aucune expérience renseignée.
    </p>

    <CvEditDialog
      v-if="isOwner"
      v-model="dialogVisible"
      type="experience"
      :value="editingExperience"
      :pending="pending"
      @save="handleSave"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  createExperience,
  deleteExperience,
  updateExperience,
} from "@/services/cv";
import type { CvExperience } from "@/services/cv";
import CvEditDialog from "./CvEditDialog.vue";

const props = defineProps<{
  experiences: CvExperience[];
  isOwner: boolean;
  entrepriseSlug?: string | null;
}>();

const emit = defineEmits<["updated"]>();

const dialogVisible = ref(false);
const pending = ref(false);
const deletingId = ref<number | null>(null);
const editingExperience = ref<CvExperience | null>(null);

const sortedExperiences = computed(() => {
  return [...(props.experiences ?? [])].sort((a, b) => {
    const aDate = a.start_date || "";
    const bDate = b.start_date || "";
    return bDate.localeCompare(aDate);
  });
});

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "short" });
}

function formatPeriod(start: string | null, end: string | null) {
  const startLabel = formatDate(start);
  const endLabel = end ? formatDate(end) : "Aujourd'hui";
  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`;
  }
  return startLabel || endLabel || "Période non renseignée";
}

function openCreate() {
  editingExperience.value = null;
  dialogVisible.value = true;
}

function openEdit(experience: CvExperience) {
  editingExperience.value = experience;
  dialogVisible.value = true;
}

async function handleSave(payload: {
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}) {
  if (!props.entrepriseSlug) {
    console.warn("Slug entreprise manquant pour enregistrer l'expérience");
    return;
  }

  pending.value = true;
  try {
    if (editingExperience.value) {
      await updateExperience(props.entrepriseSlug, editingExperience.value.id, payload);
    } else {
      await createExperience(props.entrepriseSlug, payload);
    }
    dialogVisible.value = false;
    editingExperience.value = null;
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'expérience", error);
  } finally {
    pending.value = false;
  }
}

async function removeExperience(id: number) {
  if (!props.entrepriseSlug) {
    return;
  }

  deletingId.value = id;
  try {
    await deleteExperience(props.entrepriseSlug, id);
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de la suppression de l'expérience", error);
  } finally {
    deletingId.value = null;
  }
}
</script>
