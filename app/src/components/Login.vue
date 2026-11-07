<template>
  <div class="login-container">
    <h2>Login</h2>
    <p v-if="$route.query.expired" class="alert alert-info" role="status">Your session is no longer valid. Please log in again.</p>
    <form @submit.prevent="login" class="login-form" :aria-busy="loading">
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
          autocomplete="current-password" required :disabled="loading"
          :aria-invalid="!!error" :aria-describedby="error ? 'auth-error' : undefined" />

      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Please wait…' : 'Login' }}</button>
    </form>
    <p>New here? <router-link to="/register">Register</router-link></p>
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
    async login() {
      if (this.loading) return;
      this.error = "";
      if (!this.username.trim() || this.username.length > 100 || !this.password) {
        this.error = "Enter a username of 1–100 characters and your password.";
        return;
      }
      this.loading = true;
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/auth/login`, {
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
        this.error = apiError(error, "Could not log in.", { auth: true });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
}

.login-form {
  width: 300px;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}
</style>

