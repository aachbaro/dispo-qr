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
          :aria-expanded="expanded"
          class="mt-4 text-sm text-gray-600 hover:text-black underline transition-colors"
        >
          Voir plus sur {{ entreprise?.prenom || "ce profil" }}
        </button>
      </Transition>

      <ExpandCollapse :visible="expanded && hasDetails">
        <div class="space-y-8 mt-6">
          <TransitionGroup name="stagger" tag="div" class="space-y-8">
            <div
              v-for="(section, index) in visibleSections"
              :key="section.key"
              class="opacity-0 animate-fadeIn"
              :style="{ '--delay': `${index * delayStepInSeconds}s` }"
            >
              <component
                :is="section.component"
                v-bind="section.props"
                :entreprise-slug="entrepriseSlug"
                :is-owner="isOwner"
                @updated="refresh"
              />
            </div>
          </TransitionGroup>

          <button
            v-if="expanded"
            @click="expanded = false"
            aria-expanded="true"
            class="mt-4 text-sm text-gray-500 hover:text-black underline transition-colors"
          >
            Réduire
          </button>
        </div>
      </ExpandCollapse>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch, type Component } from "vue";
import ExpandCollapse from "@/components/ui/ExpandCollapse.vue";
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

type SectionKey = "skills" | "experiences" | "education";

interface SectionConfig {
  key: SectionKey;
  component: Component;
  props: Record<string, unknown>;
  visible: boolean;
}

const delayStepInSeconds = 0.2;

const sections = computed<SectionConfig[]>(() => [
  {
    key: "skills",
    component: CvSkills,
    props: { skills: skills.value },
    visible: (skills.value?.length ?? 0) > 0 || isOwner.value,
  },
  {
    key: "experiences",
    component: CvExperiences,
    props: { experiences: experiences.value },
    visible: (experiences.value?.length ?? 0) > 0 || isOwner.value,
  },
  {
    key: "education",
    component: CvEducation,
    props: { education: education.value },
    visible: (education.value?.length ?? 0) > 0 || isOwner.value,
  },
]);

const visibleSections = computed(() => sections.value.filter((section) => section.visible));
const hasDetails = computed(() => visibleSections.value.length > 0);

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
  animation-delay: var(--delay, 0s);
}
</style>
