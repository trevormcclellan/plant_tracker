<template>
  <div class="container">
    <Navbar class="mb-3">
      <router-link class="btn btn-outline-success back-to-plants d-inline-flex align-items-center gap-2" to="/">
        <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
        <span>Back to plants</span>
      </router-link>
    </Navbar>
    <p v-if="loading" role="status">Loading plant…</p>
    <div v-if="error" class="alert alert-danger" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-outline-danger" :disabled="loading" @click="fetchPlantDetails()">Retry loading plant</button>
    </div>
    <div v-if="success" class="alert alert-success" role="status">{{ success }}</div>
    <Modal :showModal="showModal" :loading="saving" :hideFooter="editingPlant" @closeModal="handleCloseModal">
      <template #title>{{ editingPlant ? 'Edit Plant' : 'Delete Plant' }}</template>
      <EditPlant v-if="showModal && editingPlant && plant" :plant="plant" @updatePlant="updatePlant" @pending="saving = $event" />
      <template v-else>
        <p>Are you sure you want to delete {{ plant?.name }}?</p>
        <div v-if="deleteError" class="alert alert-danger" role="alert">{{ deleteError }}</div>
      </template>
    </Modal>
    <template v-if="plant">
      <div class="title-div">
        <h1 class="card-title">{{ plant.name }}</h1>
        <div class="mt-2 mb-3 btn-group" role="group" aria-label="Manage plant">
          <button type="button" @click="openModal(true)" :disabled="saving || loading" class="btn btn-secondary">Edit</button>
          <button type="button" @click="openModal(false)" :disabled="saving || loading" class="btn btn-danger">Delete</button>
        </div>
      </div>
      <h2 class="h5 card-title">Past Actions</h2>
      <div class="card" id="past-actions" tabindex="0" role="region" aria-label="Past actions">
        <div class="card-body past-actions-scrollable">
          <ul class="list-group" v-if="actions.length">
            <li v-for="(action, index) in actions" :key="action._id || action.id || `${action.time}-${index}`"
              class="list-group-item d-flex justify-content-between align-items-center">
              <img v-if="action.type === 'Watered'" src="@/assets/icons/water.png" alt="" class="action-icon" />
              <img v-else-if="action.type === 'Fertilized'" src="@/assets/icons/fertilize.png" alt="" class="action-icon" />
              <img v-else-if="action.type === 'Repotted'" src="@/assets/icons/repot.png" alt="" class="action-icon" />
              <div class="action-details"><span class="action-type">{{ action.type }}</span></div>
              <span class="action-date">{{ new Date(action.time).toLocaleDateString() }}</span>
            </li>
          </ul>
          <p v-else>No care recorded yet. Use the care buttons on your plants list to add an action.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from "axios";
import Modal from "./Modal.vue";
import Navbar from "./Navbar.vue";
import EditPlant from "./EditPlant.vue";
import { apiError } from "../api";

export default {
  components: { Modal, EditPlant, Navbar },
  props: { id: String },
  data() {
    return {
      plant: null, loading: false, saving: false, showModal: false, editingPlant: false,
      error: "", deleteError: "", success: "", requestVersion: 0,
    };
  },
  watch: {
    id: {
      immediate: true,
      handler() {
        this.plant = null;
        this.showModal = false;
        this.success = "";
        this.fetchPlantDetails(true);
      },
    },
  },
  beforeUnmount() { this.requestVersion++; },
  computed: {
    actions() { return [...(this.plant?.actions || [])].sort((a, b) => Date.parse(b.time) - Date.parse(a.time)); },
  },
  methods: {
    async fetchPlantDetails(force = false) {
      if (this.loading && !force) return;
      const version = ++this.requestVersion;
      this.loading = true;
      this.error = "";
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${this.id}`);
        if (version === this.requestVersion) this.plant = response.data;
      } catch (error) {
        if (version === this.requestVersion) this.error = apiError(error, "Could not load this plant.");
      } finally {
        if (version === this.requestVersion) this.loading = false;
      }
    },
    openModal(editing) {
      if (this.loading || this.saving || !this.plant) return;
      this.editingPlant = editing;
      this.deleteError = "";
      this.success = "";
      this.showModal = true;
    },
    updatePlant(plant) {
      this.plant = plant;
      this.showModal = false;
      this.success = "Plant updated successfully.";
    },
    async handleCloseModal(confirm) {
      if (this.saving) return;
      if (!confirm || this.editingPlant) {
        this.showModal = false;
        return;
      }
      this.saving = true;
      this.deleteError = "";
      try {
        await axios.delete(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${this.id}`);
        this.showModal = false;
        await this.$router.push({ name: "home" });
      } catch (error) {
        this.deleteError = apiError(error, "Could not delete the plant.", { mutation: true });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
<style scoped>
.back-to-plants {
  color: #198754;
}

.back-to-plants:hover,
.back-to-plants:focus-visible {
  color: white;
}

/* Add your custom styles here if needed */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

}

.card {
  margin-bottom: 10px;
  margin: 10px;
}

.action-icon {
  width: 24px; /* Adjust the size as needed */
  height: 24px; /* Adjust the size as needed */
  margin-right: 12px; /* Add spacing between icon and details */
}

.action-details {
  display: flex;
  flex-direction: column;
}

.action-type {
  font-weight: bold;
}

.action-date {
  color: #777;
}

/* Style the scrollbar (optional) */
.past-actions-scrollable::-webkit-scrollbar {
  width: 8px; /* Adjust the scrollbar width as needed */
}

.past-actions-scrollable::-webkit-scrollbar-thumb {
  background-color: #888; /* Customize the scrollbar thumb color */
  border-radius: 4px; /* Customize the scrollbar thumb border radius */
}

/* Ensure past-actions card scrolls with fixed height */
#past-actions {
  flex: 1; /* Grow and fill remaining vertical space */
  overflow-y: auto; /* Enable vertical scrolling when content overflows */
  position: sticky;
  top: 0;
  height: calc(100vh - 300px); /* Adjust the fixed height as needed */
}

.title-div {
  margin: 10px;
}

#overlay {
  position: fixed; /* Sit on top of the page content */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
}

#overlay-content {
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}
</style>
