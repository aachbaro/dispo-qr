<template>
  <section
    class="border border-black rounded-xl bg-white mt-6 p-6 shadow-sm transition-all duration-300"
  >
    <div v-if="loading" class="text-sm text-gray-500 animate-pulse">
      Chargement du CV...
    </div>

    <div v-else>
      <CvProfile
        :profile="profile"
        :entreprise="entreprise"
        :is-owner="isOwner"
        @updated="refresh"
      />

      <Transition name="fade">
        <button
          v-if="!expanded && hasDetails"
          @click="expanded = true"
          class="mt-4 text-sm text-gray-600 hover:text-black underline transition-colors"
        >
          Voir plus sur {{ entreprise?.prenom || "ce profil" }}
        </button>
      </Transition>

      <ExpandableSection :visible="expanded && hasDetails">
        <div class="space-y-8 mt-6">
          <TransitionGroup name="stagger" tag="div" class="space-y-8">
            <div
              v-if="showSkills"
              key="skills"
              class="opacity-0 animate-fadeIn delay-100"
            >
              <CvSkills
                :skills="skills"
                :entreprise-slug="entrepriseSlug"
                :is-owner="isOwner"
                @updated="refresh"
              />
            </div>

            <div
              v-if="showExperiences"
              key="experiences"
              class="opacity-0 animate-fadeIn delay-300"
            >
              <CvExperiences
                :experiences="experiences"
                :entreprise-slug="entrepriseSlug"
                :is-owner="isOwner"
                @updated="refresh"
              />
            </div>

            <div
              v-if="showEducation"
              key="education"
              class="opacity-0 animate-fadeIn delay-500"
            >
              <CvEducation
                :education="education"
                :entreprise-slug="entrepriseSlug"
                :is-owner="isOwner"
                @updated="refresh"
              />
            </div>
          </TransitionGroup>

          <button
            v-if="expanded"
            @click="expanded = false"
            class="mt-4 text-sm text-gray-500 hover:text-black underline transition-colors"
          >
            Réduire
          </button>
        </div>
      </ExpandableSection>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from "vue";
import ExpandableSection from "@/components/ui/ExpandableSection.vue";
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
    skills.value.length > 0 ||
    experiences.value.length > 0 ||
    education.value.length > 0 ||
    props.isOwner
);
const showSkills = computed(() => skills.value.length > 0 || props.isOwner);
const showExperiences = computed(() => experiences.value.length > 0 || props.isOwner);
const showEducation = computed(() => education.value.length > 0 || props.isOwner);

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.stagger-enter-active {
  transition: all 0.6s ease;
}

.stagger-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.7s ease forwards;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-300 {
  animation-delay: 0.3s;
}

.delay-500 {
  animation-delay: 0.5s;
}
</style>
