<template>
  <div class="register-container">
    <h2>Register</h2>
    <form @submit.prevent="register" class="register-form" :aria-busy="loading">
      <div v-if="error" id="auth-error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div class="form-group">
        <label for="username">Username:</label>
        <input v-model="username" id="username" name="username" type="text" class="form-control"
          autocomplete="username" autocapitalize="none" :spellcheck="false" required maxlength="100"
          :disabled="loading" :aria-invalid="!!error" :aria-describedby="error ? 'auth-error' : undefined" />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input v-model="password" id="password" name="password" type="password" class="form-control"
          autocomplete="new-password" required :disabled="loading"
          :aria-invalid="!!error" :aria-describedby="error ? 'auth-error password-help' : 'password-help'" />
        <p id="password-help" class="form-text">Use at least 8 characters and no more than 72 UTF-8 bytes (some characters use multiple bytes).</p>
      </div>
      <div class="form-group">
        <label for="confirm-password">Confirm Password:</label>
        <input v-model="confirmPassword" id="confirm-password" name="confirm-password" type="password"
          class="form-control" autocomplete="new-password" required :disabled="loading"
          :aria-invalid="!!error" :aria-describedby="error ? 'auth-error' : undefined" />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Please wait…' : 'Register' }}</button>
    </form>
    <p>Already registered? <router-link to="/login">Log in</router-link></p>
  </div>
</template>

<script>
import axios from "axios";
import { apiError } from "../api";

export default {
  data() {
    return { username: "", password: "", confirmPassword: "", loading: false, error: "" };
  },
  methods: {
    async register() {
      if (this.loading) return;
      this.error = "";
      if (!this.username.trim() || this.username.length > 100 || !this.password) {
        this.error = "Enter a username of 1–100 characters and your password.";
        return;
      }
      if (Array.from(this.password).length < 8 || new TextEncoder().encode(this.password).length > 72) {
        this.error = "Use a password with at least 8 characters and no more than 72 UTF-8 bytes.";
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.error = "Passwords do not match. Enter the same password in both fields.";
        return;
      }
      this.loading = true;
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/auth/register`, {
          username: this.username,
          password: this.password,
        });
        if (typeof response.data?.token !== "string" || !response.data.token) {
          this.error = "The server did not return a login session. Please log in again.";
          return;
        }
        localStorage.setItem("username", response.data.username || this.username);
        localStorage.setItem("token", response.data.token);
        await this.$router.push({ name: "home" });
      } catch (error) {
        this.error = apiError(error, "Could not register.", { auth: true });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Add or modify styles as needed */
</style>
