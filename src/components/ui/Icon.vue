<script setup lang="ts">
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  PencilIcon,
  CreditCardIcon,
  TrashIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/solid";

const props = defineProps<{
  name:
    | "download"
    | "document"
    | "check"
    | "pencil"
    | "credit-card"
    | "trash"
    | "link"
    | "document-duplicate"
    | "ellipsis-vertical"
    | "arrow-path";
  class?: string;
}>();

const icons = {
  download: ArrowDownTrayIcon,
  document: DocumentIcon,
  check: CheckCircleIcon,
  pencil: PencilIcon,
  "credit-card": CreditCardIcon,
  trash: TrashIcon,
  link: LinkIcon,
  "document-duplicate": DocumentDuplicateIcon,
  "ellipsis-vertical": EllipsisVerticalIcon,
  "arrow-path": ArrowPathIcon,
};
</script>

<template>
  <component :is="icons[props.name]" :class="props.class" />
</template>
