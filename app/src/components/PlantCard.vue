<template>
  <div class="card" @click="goToPlantDetail">
    <div class="card-body">
      <h5 class="card-title">
        <router-link class="plant-name" :to="{ name: 'plant-detail', params: { id: plant._id } }" @click.stop>{{ plant.name }}</router-link>
        <button type="button" @click.stop="performAction('flag')" :disabled="!!pending"
          :aria-label="`${plant.flagged ? 'Unflag' : 'Flag'} ${plant.name}`" :aria-pressed="!!plant.flagged"
          :class="`btn btn-sm btn-outline-${plant.flagged ? 'danger' : 'secondary'}`">
          <font-awesome-icon :icon="`fa-${plant.flagged ? 'solid' : 'regular'} fa-flag`" aria-hidden="true" />
        </button>
      </h5>
      <div class="btn-group" role="group" :aria-label="`Care for ${plant.name}`" :aria-busy="!!pending" @click.stop>
        <button type="button" @click="performAction('water')" :disabled="!!pending" class="btn btn-info">Water</button>
        <button type="button" @click="performAction('fertilize')" :disabled="!!pending" class="btn btn-warning">Fertilize</button>
        <button type="button" @click="performAction('repot')" :disabled="!!pending" class="btn btn-success">Repot</button>
      </div>
      <p v-if="pending || success" class="mt-2" role="status">{{ pending ? 'Saving…' : success }}</p>
      <div v-if="error" class="alert alert-danger mt-2" role="alert" @click.stop>{{ error }}</div>
      <p class="mt-3" v-if="latestAction">
        Last Action: {{ latestAction.type }} on {{ new Date(latestAction.time).toLocaleDateString() }}<br>
        ({{ daysSinceLastAction }})
      </p>
      <p v-else class="mt-3">No care recorded yet.</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { apiError, lastAction } from "../api";

export default {
  props: { plant: { type: Object, required: true } },
  emits: ["updatePlant"],
  data() { return { pending: "", error: "", success: "", successTimer: null }; },
  beforeUnmount() { clearTimeout(this.successTimer); },
  computed: {
    latestAction() { return lastAction(this.plant); },
    daysSinceLastAction() {
      const days = Math.max(0, Math.floor((Date.now() - Date.parse(this.latestAction.time)) / 86400000));
      return days === 0 ? "Today" : `${days} day${days === 1 ? '' : 's'} ago`;
    },
  },
  methods: {
    async performAction(action) {
      if (this.pending) return;
      this.pending = action;
      this.error = "";
      this.success = "";
      clearTimeout(this.successTimer);
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${this.plant._id}/${action}`);
        this.$emit("updatePlant", response.data);
        this.success = action === "flag" ? "Flag updated." : "Care recorded.";
        this.successTimer = setTimeout(() => { this.success = ""; }, 3000);
      } catch (error) {
        const description = action === "flag" ? "update the flag" : `record ${action === "water" ? "watering" : action === "repot" ? "repotting" : "fertilizing"}`;
        this.error = apiError(error, `Could not ${description}.`, { mutation: true });
      } finally {
        this.pending = "";
      }
    },
    goToPlantDetail(event) {
      if (this.pending || event.target.closest("button, a")) return;
      this.$router.push({ name: "plant-detail", params: { id: this.plant._id } });
    },
  },
};
</script>

<style scoped>
/* Add your custom styles here if needed */
.card {
  margin-bottom: 10px;
}

.plant-name {
  margin-right: 5px;
  color: inherit;
  text-decoration: none;
}

.btn-outline-danger:hover {
  color: #dc3545 !important;
  background-color: #fff !important;
  border-color: #dc3545 !important;
}

.btn-outline-secondary:hover {
  color: #6c757d !important;
  background-color: #fff !important;
  border-color: #6c757d !important;
}
/* .card-body {
  display: flex;
  flex-direction: column;
}

.header-container {
  display: grid;
  grid-template-columns: 1fr auto; /* 1fr for plant name, auto for flag button */

/* .card-title {
  display: inline-block;
  margin-right: 10px;
} */

/* .flag-button {
  position: absolute;
  right: 10px;
  top: 30%;
} */
</style>
