<template>
  <section
    v-if="isOwner || sortedEducation.length"
    class="border-t border-gray-100 pt-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Formations</h3>

      <button
        v-if="isOwner"
        class="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900 transition-colors"
        @click="openCreate"
      >
        Ajouter
      </button>
    </div>

    <div v-if="sortedEducation.length" class="space-y-4">
      <article
        v-for="entry in sortedEducation"
        :key="entry.id"
        class="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h4 class="text-base font-semibold text-gray-900 leading-tight">
              {{ entry.title }}
            </h4>
            <p v-if="entry.school" class="text-sm text-gray-600">
              {{ entry.school }}
            </p>
            <p
              v-if="entry.year"
              class="text-xs text-gray-400 uppercase tracking-wide mt-1"
            >
              {{ entry.year }}
            </p>
          </div>

          <div v-if="isOwner" class="flex items-center gap-2">
            <button
              class="text-sm text-gray-500 hover:text-black"
              @click="openEdit(entry)"
            >
              Modifier
            </button>
            <button
              class="text-sm text-red-500 hover:text-red-700"
              :disabled="deletingId === entry.id"
              @click="removeEducation(entry.id)"
            >
              Supprimer
            </button>
          </div>
        </div>
      </article>
    </div>

    <CvEditDialog
      v-if="isOwner"
      v-model="dialogVisible"
      type="education"
      :value="editingEducation"
      :pending="pending"
      @save="handleSave"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from "@/services/cv";
import type { CvEducation } from "@/services/cv";
import CvEditDialog from "./CvEditDialog.vue";

const props = defineProps<{
  education: CvEducation[];
  isOwner: boolean;
  entrepriseSlug?: string | null;
}>();

const emit = defineEmits<{ (e: "updated"): void }>();

const dialogVisible = ref(false);
const pending = ref(false);
const deletingId = ref<number | null>(null);
const editingEducation = ref<CvEducation | null>(null);

const sortedEducation = computed(() => {
  return [...(props.education ?? [])].sort((a, b) => {
    const aYear = a.year || "";
    const bYear = b.year || "";
    return bYear.localeCompare(aYear);
  });
});

function openCreate() {
  editingEducation.value = null;
  dialogVisible.value = true;
}

function openEdit(entry: CvEducation) {
  editingEducation.value = entry;
  dialogVisible.value = true;
}

async function handleSave(payload: {
  title: string;
  school: string | null;
  year: string | null;
}) {
  if (!props.entrepriseSlug) {
    console.warn("Slug entreprise manquant pour enregistrer la formation");
    return;
  }

  pending.value = true;
  try {
    if (editingEducation.value) {
      await updateEducation(
        props.entrepriseSlug,
        editingEducation.value.id,
        payload
      );
    } else {
      await createEducation(props.entrepriseSlug, payload);
    }
    dialogVisible.value = false;
    editingEducation.value = null;
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la formation", error);
  } finally {
    pending.value = false;
  }
}

async function removeEducation(id: number) {
  if (!props.entrepriseSlug) return;

  deletingId.value = id;
  try {
    await deleteEducation(props.entrepriseSlug, id);
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de la suppression de la formation", error);
  } finally {
    deletingId.value = null;
  }
}
</script>
