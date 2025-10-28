<template>
  <section class="border border-black rounded-xl bg-white mt-6 p-6">
    <div v-if="loading" class="text-sm text-gray-500">
      Chargement du CV...
    </div>
    <div v-else>
      <CvProfile
        :profile="profile"
        :entreprise="entreprise"
        :is-owner="isOwner"
        @updated="refresh"
      />

      <button
        v-if="!expanded && hasDetails"
        @click="expanded = true"
        class="mt-4 text-sm text-gray-600 hover:text-black underline"
      >
        Voir plus sur {{ entreprise?.prenom || "ce profil" }}
      </button>

      <div v-if="expanded && hasDetails" class="space-y-8 mt-6">
        <CvSkills
          :skills="skills"
          :entreprise-slug="entrepriseSlug"
          :is-owner="isOwner"
          @updated="refresh"
        />

        <CvExperiences
          :experiences="experiences"
          :entreprise-slug="entrepriseSlug"
          :is-owner="isOwner"
          @updated="refresh"
        />

        <CvEducation
          :education="education"
          :entreprise-slug="entrepriseSlug"
          :is-owner="isOwner"
          @updated="refresh"
        />

        <button
          v-if="expanded"
          @click="expanded = false"
          class="mt-4 text-sm text-gray-500 hover:text-black underline"
        >
          Réduire
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from "vue";
import { useCv } from "./useCv";
import CvProfile from "./CvProfile.vue";
import CvSkills from "./CvSkills.vue";
import CvExperiences from "./CvExperiences.vue";
import CvEducation from "./CvEducation.vue";

const props = defineProps<{
  entrepriseRef: string;
  isOwner: boolean;
}>();

const { isOwner } = toRefs(props);

const expanded = ref(false);
const loading = ref(false);
const { entreprise, profile, skills, experiences, education, fetchCv } = useCv();

const entrepriseSlug = computed(() => entreprise.value?.slug ?? props.entrepriseRef);
const hasDetails = computed(
  () =>
    (skills.value?.length ?? 0) > 0 ||
    (experiences.value?.length ?? 0) > 0 ||
    (education.value?.length ?? 0) > 0 ||
    props.isOwner
);

async function refresh() {
  if (!props.entrepriseRef) {
    return;
  }

  try {
    loading.value = true;
    await fetchCv(props.entrepriseRef);
  } catch (error) {
    console.error("Erreur lors du chargement du CV", error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.entrepriseRef,
  (nextRef, prevRef) => {
    if (nextRef && nextRef !== prevRef) {
      expanded.value = false;
      refresh();
    }
  }
);

onMounted(refresh);
</script>
