<template>
  <div class="register-container">
    <h2>Register</h2>
    <form @submit.prevent="register" class="register-form">
      <div class="form-group">
        <label for="username">Username:</label>
        <input
          v-model="username"
          id="username"
          name="username"
          type="text"
          class="form-control"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          v-model="password"
          id="password"
          name="password"
          type="password"
          class="form-control"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Confirm Password:</label>
        <input
          v-model="confirmPassword"
          id="confim-password"
          name="confirm-password"
          type="password"
          class="form-control"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary">Register</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
    };
  },
  methods: {
    async register() {
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      const response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/auth/register`, {
        username: this.username,
        password: this.password,
      });
      console.log(response);
      if (response.status === 201) {
        localStorage.setItem("username", response.data.username);
        sessionStorage.setItem("token", response.data.token);
        this.$router.push({ name: "home" });
      } else {
        alert("Registration failed, please try again");
      }
    },
  },
};
</script>

<style scoped>
/* Add or modify styles as needed */
</style>
