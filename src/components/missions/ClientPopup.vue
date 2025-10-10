<!-- src/components/ClientPopup.vue -->
<!-- -------------------------------------------------------------
 Popup client → création d’une mission avec plusieurs créneaux
--------------------------------------------------------------- -->

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc.prevent="onCancel"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="onCancel" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-lg ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b">
          <h2 class="text-lg font-semibold">Demander une mission</h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- Sélecteur de modèle -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Utiliser un modèle</label>
            <select
              v-model="selectedTemplateId"
              @change="applyTemplate"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">-- Aucun --</option>
              <option v-for="t in templates" :key="t.id" :value="t.id">
                {{ t.nom }}
              </option>
            </select>
          </div>

          <!-- Établissement -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Établissement</label>
            <input
              v-model="etablissement"
              type="text"
              required
              placeholder="Nom du restaurant"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Adresse -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Adresse</label>
            <input
              v-model="adresseLigne1"
              type="text"
              required
              placeholder="Adresse (ligne 1)"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              v-model="adresseLigne2"
              type="text"
              placeholder="Complément d’adresse (ligne 2)"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <!-- CP / Ville -->
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="codePostal"
              type="text"
              required
              placeholder="Code postal"
              class="w-full rounded-lg border px-3 py-2"
            />
            <input
              v-model="ville"
              type="text"
              required
              placeholder="Ville"
              class="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <!-- Pays -->
          <div>
            <input
              v-model="pays"
              type="text"
              required
              placeholder="Pays"
              class="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="contactPhone"
              type="tel"
              required
              placeholder="+33 6 12 34 56 78"
              class="w-full rounded-lg border px-3 py-2"
            />
            <input
              v-model="contactEmail"
              type="email"
              required
              placeholder="contact@restaurant.com"
              class="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <input
            v-model="contactName"
            type="text"
            placeholder="Nom du contact (ex: Responsable salle)"
            class="w-full rounded-lg border px-3 py-2"
          />

          <!-- Instructions -->
          <textarea
            v-model="instructions"
            rows="3"
            placeholder="Précisions sur la mission..."
            class="w-full rounded-lg border px-3 py-2"
          ></textarea>

          <!-- Mode -->
          <select v-model="mode" class="w-full rounded-lg border px-3 py-2">
            <option value="freelance">Freelance (auto-entrepreneur)</option>
            <option value="salarié">Salarié (contrat d'extra)</option>
          </select>

          <!-- Créneaux -->
          <div class="space-y-3">
            <div
              v-for="(slot, index) in slots"
              :key="index"
              class="border rounded-md p-3 space-y-2"
            >
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-semibold">Créneau {{ index + 1 }}</h3>
                <button
                  v-if="slots.length > 1"
                  type="button"
                  class="text-red-600 text-sm"
                  @click="removeSlot(index)"
                >
                  Supprimer
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  v-model="slot.startDate"
                  :min="minDate"
                  class="w-full rounded-lg border px-3 py-2"
                />
                <input
                  type="date"
                  v-model="slot.endDate"
                  :min="minDate"
                  class="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  v-model="slot.startTime"
                  step="900"
                  class="w-full rounded-lg border px-3 py-2"
                />
                <input
                  type="time"
                  v-model="slot.endTime"
                  step="900"
                  class="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <p v-if="isSlotInvalid(slot)" class="text-sm text-red-600">
                L'heure de début doit être antérieure à l'heure de fin.
              </p>
            </div>

            <button
              type="button"
              class="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              @click="addSlot"
            >
              ➕ Ajouter un créneau
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            @click="onCancel"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="isInvalid"
            @click="onConfirm"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { createMission } from "../../services/missions";
import { listTemplates, type MissionTemplate } from "../../services/templates";

// ✅ déclarer props correctement
const props = defineProps<{
  open: boolean;
  slug?: string;
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
}>();
const emit = defineEmits(["close", "created"]);

// Templates
const templates = ref<MissionTemplate[]>([]);
const selectedTemplateId = ref<number | "">("");

// Charger les templates
onMounted(async () => {
  try {
    const { templates: data } = await listTemplates();
    templates.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement templates:", err);
  }
});

// Appliquer un modèle
function applyTemplate() {
  const t = templates.value.find((x) => x.id === selectedTemplateId.value);
  if (!t) return;
  etablissement.value = t.etablissement;
  adresseLigne1.value = t.etablissement_adresse_ligne1 || "";
  adresseLigne2.value = t.etablissement_adresse_ligne2 || "";
  codePostal.value = t.etablissement_code_postal || "";
  ville.value = t.etablissement_ville || "";
  pays.value = t.etablissement_pays || "";
  contactName.value = t.contact_name || "";
  contactEmail.value = t.contact_email || "";
  contactPhone.value = t.contact_phone || "";
  instructions.value = t.instructions || "";
  mode.value = t.mode || "freelance";
}

// Champs mission
const etablissement = ref("");
const adresseLigne1 = ref("");
const adresseLigne2 = ref("");
const codePostal = ref("");
const ville = ref("");
const pays = ref("");
const contactName = ref("");
const contactEmail = ref("");
const contactPhone = ref("");
const instructions = ref("");
const mode = ref<"freelance" | "salarié">("freelance");

// Slots dynamiques
const slots = ref([
  {
    startDate: props.initialDate || "",
    endDate: props.initialDate || "",
    startTime: props.initialStart || "12:00",
    endTime: props.initialEnd || "14:00",
  },
]);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      slots.value = [
        {
          startDate: props.initialDate || "",
          endDate: props.initialDate || "",
          startTime: props.initialStart || "12:00",
          endTime: props.initialEnd || "14:00",
        },
      ];
    }
  }
);

function addSlot() {
  slots.value.push({
    startDate: "",
    endDate: "",
    startTime: "12:00",
    endTime: "14:00",
  });
}
function removeSlot(index: number) {
  slots.value.splice(index, 1);
}

// Date utils
function toYMD(dt: Date) {
  return dt.toISOString().slice(0, 10);
}
function parseYMD(s: string) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const minDate = toYMD(new Date());

// Validation
function isSlotInvalid(slot: any) {
  if (!slot.startDate || !slot.endDate || !slot.startTime || !slot.endTime)
    return true;
  const s = new Date(`${slot.startDate}T${slot.startTime}`);
  const e = new Date(`${slot.endDate}T${slot.endTime}`);
  return s >= e;
}
const isInvalid = computed(() => slots.value.some(isSlotInvalid));

// Actions
function onCancel() {
  emit("close");
}
async function onConfirm() {
  if (isInvalid.value) return;

  const slotsPayload = slots.value.map((s) => ({
    start: new Date(`${s.startDate}T${s.startTime}`).toISOString(),
    end: new Date(`${s.endDate}T${s.endTime}`).toISOString(),
    title: null,
  }));

  try {
    const { mission } = await createMission({
      etablissement: etablissement.value,
      etablissement_adresse_ligne1: adresseLigne1.value,
      etablissement_adresse_ligne2: adresseLigne2.value || null,
      etablissement_code_postal: codePostal.value,
      etablissement_ville: ville.value,
      etablissement_pays: pays.value,
      contact_name: contactName.value,
      contact_email: contactEmail.value,
      contact_phone: contactPhone.value,
      instructions: instructions.value,
      mode: mode.value,
      slots: slotsPayload,
      entreprise_ref: props.slug, // ⚡ slug passé ici
    } as any); // 👈 cast en any pour pas casser TS

    emit("created", mission);
    emit("close");
  } catch (err) {
    console.error("❌ Erreur lors de la création de mission:", err);
    alert("Erreur lors de l'envoi");
  }
}
</script>
