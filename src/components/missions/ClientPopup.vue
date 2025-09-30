// src/components/ClientPopup.vue //
------------------------------------------------------------- // Popup client →
création d’une mission avec plusieurs créneaux //
------------------------------------------------------------- // // 📌
Description : // - Affiche un formulaire complet (établissement, contact,
instructions…) // - Ajout dynamique de plusieurs créneaux (date/heure début et
fin) // - Garde le comportement scroll (heures par 15 min, dates par
jour/sem/mois) // // 🔒 Règles d’accès : // - Public côté client (demande de
mission) // - Validation finale côté backend // // ⚠️ Remarques : // - Le
payload envoie maintenant un tableau `slots: [{ start, end }]` // - Le calcul
des heures se fera côté backend/facture // //
-------------------------------------------------------------

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
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model="adresseLigne2"
              type="text"
              placeholder="Complément d’adresse (ligne 2)"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- CP / Ville -->
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="codePostal"
              type="text"
              required
              placeholder="Code postal"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model="ville"
              type="text"
              required
              placeholder="Ville"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Pays -->
          <div class="space-y-1">
            <input
              v-model="pays"
              type="text"
              required
              placeholder="Pays"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Téléphone</label>
              <input
                v-model="contactPhone"
                type="tel"
                required
                placeholder="+33 6 12 34 56 78"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Email</label>
              <input
                v-model="contactEmail"
                type="email"
                required
                placeholder="contact@restaurant.com"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Nom du contact -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Nom du contact</label>
            <input
              v-model="contactName"
              type="text"
              placeholder="ex: Responsable salle"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Instructions -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Instructions</label>
            <textarea
              v-model="instructions"
              rows="3"
              placeholder="Précisions sur la mission..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Mode -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Mode</label>
            <select
              v-model="mode"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="freelance">Freelance (auto-entrepreneur)</option>
              <option value="salarié">Salarié (contrat d'extra)</option>
            </select>
          </div>

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
                <div>
                  <label class="text-sm font-medium">Date début</label>
                  <input
                    type="date"
                    v-model="slot.startDate"
                    :min="minDate"
                    @wheel.prevent="onScrollDate($event, slot, 'startDate')"
                    class="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Date fin</label>
                  <input
                    type="date"
                    v-model="slot.endDate"
                    :min="minDate"
                    @wheel.prevent="onScrollDate($event, slot, 'endDate')"
                    class="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium">Heure début</label>
                  <input
                    type="time"
                    v-model="slot.startTime"
                    step="900"
                    @wheel.prevent="onScrollTime($event, slot, 'startTime')"
                    class="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Heure fin</label>
                  <input
                    type="time"
                    v-model="slot.endTime"
                    step="900"
                    @wheel.prevent="onScrollTime($event, slot, 'endTime')"
                    class="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p v-if="isSlotInvalid(slot)" class="text-sm text-red-600">
                L'heure de début doit être antérieure à l'heure de fin.
              </p>
            </div>

            <!-- Bouton ajout -->
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

<script setup>
import { ref, computed } from "vue";
import { createEntrepriseMission } from "../../services/missions";

const props = defineProps({
  open: Boolean,
  slug: String,
  required: true,
});
const emit = defineEmits(["close", "created"]);

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
const mode = ref("freelance");

// Slots dynamiques
const slots = ref([
  { startDate: "", endDate: "", startTime: "12:00", endTime: "14:00" },
]);

function addSlot() {
  slots.value.push({
    startDate: "",
    endDate: "",
    startTime: "12:00",
    endTime: "14:00",
  });
}
function removeSlot(index) {
  slots.value.splice(index, 1);
}

// Date utils
function getWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - (day === 0 ? 6 : day - 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toYMD(dt) {
  return dt.toISOString().slice(0, 10);
}
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const minDate = toYMD(getWeekStart());

// Validation
function isSlotInvalid(slot) {
  if (!slot.startDate || !slot.endDate || !slot.startTime || !slot.endTime)
    return true;
  const s = new Date(`${slot.startDate}T${slot.startTime}`);
  const e = new Date(`${slot.endDate}T${slot.endTime}`);
  return s >= e;
}
const isInvalid = computed(() => slots.value.some(isSlotInvalid));

// Scroll time/date
function onScrollTime(event, slot, field) {
  const val = slot[field];
  const [h, m] = val.split(":").map(Number);
  let minutes = h * 60 + m;
  minutes += event.deltaY < 0 ? 15 : -15;
  if (minutes < 0) minutes = 0;
  if (minutes >= 24 * 60) minutes = 24 * 60 - 15;
  const newH = String(Math.floor(minutes / 60)).padStart(2, "0");
  const newM = String(minutes % 60).padStart(2, "0");
  slot[field] = `${newH}:${newM}`;
}
function onScrollDate(event, slot, field) {
  let step = 1;
  if (event.shiftKey) step = 7;
  if (event.altKey) step = 30;
  const dir = event.deltaY < 0 ? +1 : -1;
  let base = parseYMD(slot[field]) || new Date();
  base.setDate(base.getDate() + dir * step);
  const minDt = parseYMD(minDate);
  if (base < minDt) base = minDt;
  slot[field] = toYMD(base);
  if (slot.endDate < slot.startDate) slot.endDate = slot.startDate;
}

// Actions
function onCancel() {
  emit("close");
}
async function onConfirm() {
  if (isInvalid.value) return;
  const slotsPayload = slots.value.map((s) => ({
    start: new Date(`${s.startDate}T${s.startTime}`).toISOString(),
    end: new Date(`${s.endDate}T${s.endTime}`).toISOString(),
  }));
  try {
    const { mission } = await createEntrepriseMission(props.slug, {
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
    });
    emit("created", mission);
    emit("close");
  } catch (err) {
    console.error("❌ Erreur lors de la création de mission:", err);
    alert("Erreur lors de l'envoi");
  }
}
</script>
