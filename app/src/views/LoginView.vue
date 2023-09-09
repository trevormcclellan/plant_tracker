<template>
  <div class="container">
    <h1 class="mt-3">Login Page</h1>
    <div class="row">
        <LoginForm />
    </div>
  </div>
</template>
  
  <script>
import LoginForm from "../components/Login.vue"; // make sure the path is correct

export default {
  name: "LoginView",
  components: {
    LoginForm,
  },
};
</script>
  