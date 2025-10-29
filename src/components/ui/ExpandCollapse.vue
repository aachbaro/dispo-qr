<template>
  <Transition
    name="expand"
    appear
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <div v-show="visible" class="overflow-hidden will-change-[height,opacity]">
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>();

function beforeEnter(el: Element) {
  const element = el as HTMLElement;
  element.style.height = "0";
  element.style.opacity = "0";
  element.style.transition = "";
}

function enter(el: Element) {
  const element = el as HTMLElement;
  const height = element.scrollHeight;
  element.style.transition =
    "height 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease";
  element.style.height = `${height}px`;
  element.style.opacity = "1";
}

function leave(el: Element) {
  const element = el as HTMLElement;
  element.style.transition = "height 0.4s ease 0.1s, opacity 0.3s ease";
  element.style.height = "0";
  element.style.opacity = "0";
}

function afterEnter(el: Element) {
  const element = el as HTMLElement;
  element.style.height = "auto";
  element.style.transition = "";
  element.style.opacity = "";
}

function afterLeave(el: Element) {
  const element = el as HTMLElement;
  element.style.transition = "";
  element.style.height = "";
  element.style.opacity = "";
}
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  overflow: hidden;
}
</style>
