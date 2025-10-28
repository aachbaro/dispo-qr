<template>
  <section>
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Compétences</h3>
      <div v-if="isOwner" class="flex items-center gap-2">
        <input
          v-model="newSkill"
          type="text"
          placeholder="Ajouter une compétence"
          class="border rounded px-3 py-1 text-sm"
          @keyup.enter="addSkill"
        />
        <button
          class="px-3 py-1 text-sm bg-black text-white rounded disabled:opacity-60"
          :disabled="!canSubmit"
          @click="addSkill"
        >
          {{ pending ? "Ajout..." : "Ajouter" }}
        </button>
      </div>
    </div>

    <div v-if="skills?.length" class="flex flex-wrap gap-2 mt-4">
      <span
        v-for="skill in skills"
        :key="skill.id"
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm"
      >
        {{ skill.name }}
        <button
          v-if="isOwner"
          class="text-xs text-red-500 hover:text-red-700"
          :disabled="removingId === skill.id"
          @click="removeSkill(skill.id)"
        >
          &times;
        </button>
      </span>
    </div>
    <p v-else class="text-sm text-gray-500 mt-3">
      Aucune compétence renseignée.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { addSkills, deleteSkill } from "@/services/cv";
import type { CvSkill } from "@/services/cv";

const props = defineProps<{
  skills: CvSkill[];
  isOwner: boolean;
  entrepriseSlug?: string | null;
}>();

const emit = defineEmits<["updated"]>();

const newSkill = ref("");
const pending = ref(false);
const removingId = ref<number | null>(null);

const canSubmit = computed(() => {
  return (
    props.isOwner &&
    !!props.entrepriseSlug &&
    newSkill.value.trim().length > 0 &&
    !pending.value
  );
});

async function addSkill() {
  if (!canSubmit.value || !props.entrepriseSlug) {
    return;
  }

  const value = newSkill.value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (!value.length) {
    return;
  }

  pending.value = true;
  try {
    await addSkills(props.entrepriseSlug, value.length > 1 ? value : value[0]);
    newSkill.value = "";
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de l'ajout de compétence", error);
  } finally {
    pending.value = false;
  }
}

async function removeSkill(id: number) {
  if (!props.isOwner || !props.entrepriseSlug) {
    return;
  }

  removingId.value = id;
  try {
    await deleteSkill(props.entrepriseSlug, id);
    emit("updated");
  } catch (error) {
    console.error("Erreur lors de la suppression de la compétence", error);
  } finally {
    removingId.value = null;
  }
}
</script>
