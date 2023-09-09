<template>
  <div>
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
import { ref, watchEffect } from "vue";

export default {
  props: {
    plant: {},
  },
  emits: ["updatePlant", "showSuccess", "showError"],
  setup(props, { emit }) {
    const name = ref("");
    const loading = ref(false);

    if (props.plant) {
      name.value = props.plant.name;
    }

    watchEffect(() => {
      if (props.plant) {
        name.value = props.plant.name;
      }
    });

    const resetForm = () => {
      name.value = "";
    };

    const submitForm = async () => {
      try {
        let response;
        loading.value = true;
        response = await axios.put(
          `${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.plant._id}`,
          { "name": name.value },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        loading.value = false;
        resetForm();
        if (response.status === 200) {
          emit("updatePlant", response.data);
          emit("showSuccess", true);
        }
      } catch (error) {
        loading.value = false;
        emit("showError", error, true);
      }
    };

    return {
      name,
      loading,
      resetForm,
      submitForm,
    };
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
