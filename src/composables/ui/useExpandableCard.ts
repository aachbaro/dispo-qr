import { ref } from "vue";

export function useExpandableCard(initial = false) {
  const expanded = ref(initial);

  function toggle() {
    expanded.value = !expanded.value;
  }

  function open() {
    expanded.value = true;
  }

  function close() {
    expanded.value = false;
  }

  return { expanded, toggle, open, close };
}
