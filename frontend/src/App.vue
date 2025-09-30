<template>
  <v-app>
    <AppNavbar/>

    <v-main class="main-content">
      <transition name="page-transition" mode="out-in">
        <RouterView :key="$route.fullPath"/>
      </transition>
    </v-main>

  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router';

</script>

<style>
html, body {
    overflow-y: auto;
    scrollbar-width: thin;
}

body::-webkit-scrollbar {
    width: 0;
}

/* Main content styling */
.main-content {
  background: var(--warm-bg);
  min-height: calc(100vh - 64px);
  position: relative;
  
  /* Subtle pattern overlay */
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(245, 158, 11, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(212, 115, 10, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
}

/* Page transitions */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.02);
}

.page-transition-enter-to,
.page-transition-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
