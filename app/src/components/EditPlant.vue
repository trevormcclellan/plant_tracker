<template>
  <div>
    <form @submit.prevent="submitForm" :aria-busy="loading">
      <div v-if="error" id="edit-plant-error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div class="mb-3">
        <label for="edit-plant-name">Name:</label>
        <input class="form-control" type="text" id="edit-plant-name" v-model="name" required maxlength="200"
          :disabled="loading" :aria-invalid="!!error" :aria-describedby="error ? 'edit-plant-error' : undefined" />
      </div>
      <button :disabled="loading" class="form-control btn btn-success" type="submit">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ loading ? 'Saving…' : 'Submit' }}
      </button>
    </form>
  </div>
</template>

<script>
import axios from "axios";
import { apiError } from "../api";

export default {
  props: { plant: { type: Object, required: true } },
  emits: ["updatePlant", "showSuccess", "pending"],
  data() {
    return { name: this.plant.name, loading: false, error: "" };
  },
  watch: {
    "plant._id"() { this.name = this.plant.name; this.error = ""; },
  },
  methods: {
    async submitForm() {
      if (this.loading) return;
      this.error = "";
      const name = this.name.trim();
      if (!name || name.length > 200) {
        this.error = "Enter a plant name of 1–200 characters.";
        return;
      }
      this.loading = true;
      this.$emit("pending", true);
      try {
        const response = await axios.put(
          `${process.env.VUE_APP_API_ORIGIN}/api/plant/${this.plant._id}`,
          { name }
        );
        this.$emit("updatePlant", response.data);
        this.$emit("showSuccess");
      } catch (error) {
        this.error = apiError(error, "Could not update the plant.", { mutation: true });
      } finally {
        this.loading = false;
        this.$emit("pending", false);
      }
    },
  },
};
</script>

<style scoped>
form {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
}

form button {
  margin-top: 10px;
  width: 100%;
}

textarea {
  height: 150px;
}
</style>
