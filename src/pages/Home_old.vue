<template>
  <div class="w-full flex flex-col items-center justify-center px-4 mx-4 pb-5 pr-10">
    <div class="h-[70vh] max-w-[1200px] w-full flex items-center">
        <AgendaShell />
    </div>
    <div class="max-w-[1200px] w-full mt-4 border border-black p-3 rounded-lg">
      <MissionList />
    </div>
  </div>
</template>

<script setup>
import AgendaShell from "../components/Agenda.vue";
import MissionList from "../components/MissionList.vue";
</script>
