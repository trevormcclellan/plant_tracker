<template>
  <div class="d-inline-block">
      <button type="button" class="btn btn-outline-secondary" :disabled="loading" @click="logout">
        {{ loading ? 'Logging out…' : 'Logout' }}
      </button>
    <div v-if="error" class="alert alert-danger mt-2" role="alert">{{ error }}</div>
  </div>
</template>

<script>
import axios from "axios";
import { apiError } from "../api";

export default {
  data() { return { loading: false, error: "" }; },
  methods: {
    async logout() {
      if (this.loading) return;
      this.loading = true;
      this.error = "";
      try {
        await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/auth/logout`);
      } catch (error) {
        if (error.response?.status !== 401) {
          this.error = apiError(error, "Could not log out. Use Logout to try again.");
          this.loading = false;
          return;
        }
      }
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        await this.$router.replace({ name: "login" });
      } catch {
        this.error = "Your session has ended. Open the login page to continue.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
