<template>
  <div class="container">
    <form @submit.prevent="submitForm" :aria-busy="loading">
      <div v-if="error" id="add-plant-error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div class="mb-3">
        <label for="add-plant-name">Name:</label>
        <input class="form-control" type="text" id="add-plant-name" v-model="name" required maxlength="200"
          :disabled="loading" :aria-invalid="!!error" :aria-describedby="error ? 'add-plant-error' : undefined" />
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
  emits: ["getPlants", "showSuccess", "pending"],
  data() {
    return { name: "", loading: false, error: "" };
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
        const response = await axios.post(
          `${process.env.VUE_APP_API_ORIGIN}/api/plant`,
          { name, owner: localStorage.getItem("username") }
        );
        this.$emit("getPlants", response.data);
        this.$emit("showSuccess");
        this.name = "";
      } catch (error) {
        this.error = apiError(error, "Could not add the plant.", { mutation: true });
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
