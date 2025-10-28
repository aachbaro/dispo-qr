<template>
  <Modal v-model="visible" :title="dialogTitle">
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-gray-700">Titre</label>
        <input
          v-model="form.title"
          type="text"
          required
          class="mt-1 w-full border rounded px-3 py-2"
        />
      </div>

      <div v-if="type === 'experience'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Entreprise</label>
          <input
            v-model="form.company"
            type="text"
            class="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Date de début</label>
          <input
            v-model="form.start_date"
            type="month"
            class="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Date de fin</label>
          <input
            v-model="form.end_date"
            type="month"
            class="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div v-if="type === 'experience'">
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          v-model="form.description"
          rows="4"
          class="mt-1 w-full border rounded px-3 py-2"
        ></textarea>
      </div>

      <div v-if="type === 'education'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Établissement</label>
          <input
            v-model="form.school"
            type="text"
            class="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Année</label>
          <input
            v-model="form.year"
            type="text"
            class="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          type="button"
          class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          @click="close"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm bg-black text-white rounded disabled:opacity-60"
          :disabled="pending"
        >
          {{ pending ? "Enregistrement..." : "Enregistrer" }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, toRef, toRefs, watch } from "vue";
import Modal from "@/components/ui/Modal.vue";
import type { CvEducation, CvExperience } from "@/services/cv";

const props = defineProps<{
  modelValue: boolean;
  type: "experience" | "education";
  value?: Partial<CvExperience | CvEducation> | null;
  pending?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (
    event: "save",
    payload:
      | {
          title: string;
          company: string | null;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
        }
      | {
          title: string;
          school: string | null;
          year: string | null;
        }
  ): void;
}>();

const { modelValue, pending, type } = toRefs(props);
const valueRef = toRef(props, "value");
const visible = computed({
  get: () => modelValue.value,
  set: (value: boolean) => emit("update:modelValue", value),
});

const form = reactive({
  title: "",
  company: "",
  start_date: "",
  end_date: "",
  description: "",
  school: "",
  year: "",
});

const dialogTitle = computed(() => {
  const base = type.value === "experience" ? "expérience" : "formation";
  return props.value?.id ? `Modifier une ${base}` : `Ajouter une ${base}`;
});

watch(
  modelValue,
  (isVisible) => {
    if (isVisible) {
      hydrateForm();
    }
  },
  { immediate: true }
);

watch(valueRef, () => {
  if (modelValue.value) {
    hydrateForm();
  }
});

function hydrateForm() {
  const data = props.value ?? {};
  form.title = data.title ?? "";
  form.company = data.company ?? "";
  form.start_date = data.start_date ?? "";
  form.end_date = data.end_date ?? "";
  form.description = data.description ?? "";
  form.school = data.school ?? "";
  form.year = data.year ?? "";
}

function close() {
  emit("update:modelValue", false);
}

function submit() {
  if (pending.value) {
    return;
  }

  if (!form.title.trim()) {
    return;
  }

  if (type.value === "experience") {
    emit("save", {
      title: form.title,
      company: form.company || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description || null,
    });
  } else {
    emit("save", {
      title: form.title,
      school: form.school || null,
      year: form.year || null,
    });
  }
}
</script>
