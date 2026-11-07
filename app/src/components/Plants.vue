<template>
  <div class="container">
    <Navbar />
    <div v-if="plantsLoading" id="overlay" role="status" aria-label="Loading plants">
      <div id="overlay-content">
        <div class="spinner-border" aria-hidden="true"></div>
        <div>Loading...</div>
      </div>
    </div>
    <div v-if="success" class="alert alert-success mt-3" role="status">{{ success }}</div>
    <Modal :showModal="showModal" :loading="saving" :hideFooter="true" @closeModal="closeModal">
      <template #title>Add Plant</template>
      <Action v-if="showModal" @getPlants="plantAdded" @pending="saving = $event" />
    </Modal>

    <h1 class="mt-5">Plants</h1>
    <div class="container">
      <button type="button" class="btn btn-success mb-3" @click="showModal = true" :disabled="saving">Add Plant</button>
      <div class="input-group mb-3">
        <input type="search" v-model="searchInput" class="form-control" placeholder="Search" aria-label="Search plants">
      </div>
      <div class="input-group mb-3">
        <label class="input-group-text" for="sort-select">Sort By</label>
        <select v-model="sortBy" id="sort-select" class="form-select">
          <option value="default">Default</option>
          <option value="lastActionAsc">Last Action (oldest first)</option>
          <option value="lastActionDesc">Last Action (newest first)</option>
          <option value="nameAsc">Name (ascending)</option>
          <option value="nameDesc">Name (descending)</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
      <div v-if="error" class="alert alert-danger" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-outline-danger" :disabled="plantsLoading" @click="getPlants">Retry loading plants</button>
      </div>
      <div :aria-busy="plantsLoading">
        <p v-if="!plantsLoading && !error && !plants.length" role="status">No plants yet. Add your first plant to start tracking its care.</p>
        <div v-else-if="!plantsLoading && plants.length && !sortedPlants.length" role="status">
          <p>No plants match your search.</p>
          <button type="button" class="btn btn-outline-secondary" @click="searchInput = ''">Clear search</button>
        </div>
        <PlantCard v-for="plant in sortedPlants" :plant="plant" :key="plant._id" @updatePlant="updatePlant" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Modal from "./Modal.vue";
import Action from "./Action.vue";
import PlantCard from "./PlantCard.vue";
import Navbar from "./Navbar.vue";
import { apiError, lastAction } from "../api";

export default {
  name: "Plants",
  components: { Modal, Action, PlantCard, Navbar },
  data() {
    let sortBy = "default";
    try { sortBy = localStorage.getItem("sortBy") || "default"; } catch { /* Sorting still works without storage. */ }
    return {
      showModal: false, saving: false, plantsLoading: false, error: "", success: "",
      plants: [], searchInput: "", sortBy, revision: 0, successTimer: null,
    };
  },
  watch: {
    sortBy(value) {
      try { localStorage.setItem("sortBy", value); } catch { /* Keep the current selection in memory. */ }
    },
  },
  mounted() { this.getPlants(); },
  beforeUnmount() { clearTimeout(this.successTimer); },
  computed: {
    sortedPlants() {
      const query = this.searchInput.trim().toLowerCase();
      const plants = this.plants.filter(plant => plant.name.toLowerCase().includes(query));
      const lastTime = plant => Date.parse(lastAction(plant)?.time) || 0;
      switch (this.sortBy) {
        case "lastActionAsc": return plants.sort((a, b) => lastTime(a) - lastTime(b));
        case "lastActionDesc": return plants.sort((a, b) => lastTime(b) - lastTime(a));
        case "nameAsc": return plants.sort((a, b) => a.name.localeCompare(b.name));
        case "nameDesc": return plants.sort((a, b) => b.name.localeCompare(a.name));
        case "flagged": return plants.sort((a, b) => Number(!!b.flagged) - Number(!!a.flagged));
        default: return plants;
      }
    },
  },
  methods: {
    async getPlants() {
      if (this.plantsLoading) return;
      this.plantsLoading = true;
      this.error = "";
      const revision = this.revision;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_ORIGIN}/api/plants`);
        // A refresh that started before a successful action must not undo it.
        if (revision === this.revision) this.plants = response.data;
      } catch (error) {
        this.error = apiError(error, "Could not load your plants.");
      } finally {
        this.plantsLoading = false;
      }
    },
    closeModal() { if (!this.saving) this.showModal = false; },
    plantAdded(plants) {
      this.revision++;
      this.showModal = false;
      this.success = "Plant added successfully.";
      clearTimeout(this.successTimer);
      this.successTimer = setTimeout(() => { this.success = ""; }, 3000);
      if (Array.isArray(plants)) {
        this.plants = plants;
        this.error = "";
      } else {
        this.getPlants();
      }
    },
    updatePlant(plant) {
      this.revision++;
      this.plants = this.plants.map(item => item._id === plant._id ? plant : item);
    },
  },
};
</script>

<style scoped>
#overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

#overlay-content {
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
