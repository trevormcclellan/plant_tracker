<template>
  <div class="container">
    <h1 class="mt-3">Register Page</h1>
    <div class="row">
        <RegisterForm />
    </div>
  </div>
</template>
  
  <script>
import RegisterForm from "../components/Register.vue"; // make sure the path is correct

export default {
  name: "RegisterView",
  components: {
    RegisterForm,
  },
};
</script>
  