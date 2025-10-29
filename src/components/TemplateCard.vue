<!-- src/components/TemplateCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’un modèle de mission (TemplateCard)
---------------------------------------------------------------
📌 Description :
 - Affiche les détails d’un modèle de mission (mission_template)
 - Extensible : vue compacte / détaillée
 - Actions disponibles : modifier, supprimer

🔒 Règles d’accès :
 - Accessible uniquement au client propriétaire (via RLS Supabase)

⚠️ Remarques :
 - Peut être intégré dans TemplateList.vue ou ClientPage.vue
--------------------------------------------------------------- -->

<template>
  <ExpandableCard v-model:expanded="expanded" class="p-4 hover:shadow-md">
    <template #header="{ expanded: isExpanded, toggle }">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <h3 class="font-bold text-lg text-gray-900">{{ template.nom }}</h3>
          <p class="text-sm text-gray-600">{{ template.etablissement }}</p>
        </div>

        <button
          class="text-sm text-gray-600 hover:text-black underline transition-colors"
          @click.stop="toggle()"
          :aria-expanded="isExpanded"
        >
          {{ isExpanded ? "Réduire" : "Voir plus" }}
        </button>
      </div>
    </template>
    <template #indicator></template>

    <div class="mt-3 space-y-2 text-sm text-gray-700">
      <!-- Adresse -->
      <div
        v-if="template.etablissement_adresse_ligne1 || template.etablissement_ville"
      >
        📍 {{ template.etablissement_adresse_ligne1 }}
        <span v-if="template.etablissement_adresse_ligne2">
          , {{ template.etablissement_adresse_ligne2 }}
        </span>
        , {{ template.etablissement_code_postal || "" }}
        {{ template.etablissement_ville || "" }}
        <span v-if="template.etablissement_pays">
          ({{ template.etablissement_pays }})
        </span>
      </div>

      <!-- Contact -->
      <div v-if="template.contact_name">👤 {{ template.contact_name }}</div>
      <div v-if="template.contact_phone">📞 {{ template.contact_phone }}</div>
      <div v-if="template.contact_email">✉️ {{ template.contact_email }}</div>

      <!-- Instructions -->
      <p v-if="template.instructions" class="italic">
        {{ template.instructions }}
      </p>

      <!-- Mode -->
      <p>
        Mode : <b>{{ template.mode }}</b>
      </p>

      <!-- Actions -->
      <div class="flex gap-2 mt-3 justify-center">
        <button
          class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          @click.stop="startEdit"
        >
          ✏️ Modifier
        </button>
        <button
          class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          @click.stop="deleteThis"
        >
          ❌ Supprimer
        </button>
      </div>

      <!-- Edition inline -->
      <div v-if="editing" class="mt-4 border-t pt-3 space-y-2">
        <input
          v-model="editForm.nom"
          class="w-full border rounded px-2 py-1"
          placeholder="Nom du modèle"
        />
        <input
          v-model="editForm.etablissement"
          class="w-full border rounded px-2 py-1"
          placeholder="Établissement"
        />
        <textarea
          v-model="editForm.instructions"
          rows="2"
          class="w-full border rounded px-2 py-1"
          placeholder="Instructions"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            @click="cancelEdit"
          >
            Annuler
          </button>
          <button
            class="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            @click="saveEdit"
            :disabled="loading"
          >
            {{ loading ? "Enregistrement..." : "Enregistrer" }}
          </button>
        </div>
      </div>
    </div>
  </ExpandableCard>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ExpandableCard from "@/components/ui/ExpandableCard.vue";
import { useExpandableCard } from "@/composables/ui/useExpandableCard";
import {
  updateTemplate,
  deleteTemplate,
  type MissionTemplate,
} from "../services/templates";

const props = defineProps<{ template: MissionTemplate }>();
const emit = defineEmits<{
  (e: "updated", template: MissionTemplate): void;
  (e: "deleted", id: number): void;
}>();

const { expanded } = useExpandableCard();
const editing = ref(false);
const loading = ref(false);

const editForm = ref({
  nom: props.template.nom,
  etablissement: props.template.etablissement,
  instructions: props.template.instructions || "",
});

// ----------------------
// Actions
// ----------------------
function startEdit() {
  editing.value = true;
}
function cancelEdit() {
  editing.value = false;
  // reset form
  editForm.value = {
    nom: props.template.nom,
    etablissement: props.template.etablissement,
    instructions: props.template.instructions || "",
  };
}

async function saveEdit() {
  loading.value = true;
  try {
    const { template } = await updateTemplate(props.template.id, {
      nom: editForm.value.nom,
      etablissement: editForm.value.etablissement,
      instructions: editForm.value.instructions,
    });
    emit("updated", template);
    editing.value = false;
  } catch (err) {
    console.error("❌ Erreur mise à jour template :", err);
    alert("Erreur lors de la mise à jour");
  } finally {
    loading.value = false;
  }
}

async function deleteThis() {
  if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;
  try {
    await deleteTemplate(props.template.id);
    emit("deleted", props.template.id);
  } catch (err) {
    console.error("❌ Erreur suppression template :", err);
    alert("Erreur lors de la suppression");
  }
}
</script>
