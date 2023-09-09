<template>
  <div class="container">
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label for="domain">Name:</label>
        <input class="form-control" type="text" id="domain" v-model="name" required />
      </div>

      <button :disabled="loading" class="form-control btn btn-success" type="submit">
        <div v-if="loading">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span class="sr-only"> Loading...</span>
        </div>
        <span v-else>Submit</span>
      </button>
    </form>
  </div>
</template>
  
<script>
import axios from "axios";

export default {
  data() {
    return {
      name: "",
      loading: false,
    };
  },
  methods: {
    resetForm() {
      this.name = "";
    },
    async  submitForm() {
      try {
        // Process the form submission
        let response;
        this.loading = true;

        response = await axios.post(
              `${process.env.VUE_APP_API_ORIGIN}/api/plant`,
              { "name": this.name, "owner": localStorage.getItem("username") },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

        this.loading = false;
        this.resetForm();
        if (response.status === 201) {
          this.$emit("getPlants");
          // Make a success alert
          this.$emit("showSuccess", this.selectedAction)
        }
      } catch (error) {
        this.loading = false;
        // Make an error alert
        this.$emit("showError", this.selectedAction, error)
      }
    },
  },
};
</script>

<style>
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
