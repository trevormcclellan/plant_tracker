<template>
  <nav class="navbar bg-light px-3 py-2" aria-label="Plant navigation">
    <slot />
    <LogoutButton class="ms-auto" />
  </nav>
</template>

<script>
import LogoutButton from "./LogoutButton.vue";

export default {
  components: { LogoutButton },
};
</script>

<style scoped>
.navbar {
  isolation: isolate;
}

.navbar::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* Extend only the background, preserving content alignment and page width. */
  box-shadow: 0 0 0 100vmax rgb(var(--bs-light-rgb));
  clip-path: inset(0 -100vmax);
}
</style>
