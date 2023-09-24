<template>
  <div>
    <div v-if="plantsLoading" id="overlay">
      <div id="overlay-content">
        <div class="spinner-border" role="status"><span class="sr-only"></span></div>
        <div>Loading...</div>
      </div>
    </div>
    <div id="alerts" class="fixed-top">
      <div v-if="negativeAlert" id="negative-alert-popup" class="alert alert-danger" role="alert">{{ alertText }}</div>
      <div v-if="positiveAlert" id="positive-alert-popup" class="alert alert-success" role="alert">{{ alertText }}</div>
    </div>

    <Modal :showModal="showModal" :loading="loading" :hideFooter="true" @closeModal="handleCloseModal">
      <template #title>{{modalTitle}}</template>
      <Action v-if="addingPlant" @getPlants="getPlants" @showSuccess="showSuccess" @showError="showError"></Action>
    </Modal>

    <h1 class="mt-5">Plants</h1>
    <div class="container">
      <button class="btn btn-success mb-3" @click="addPlant">Add Plant</button>
      <div class="input-group mb-3">
        <input type="text" v-model="searchInput" class="form-control" placeholder="Search" aria-label="Search">
      </div>
      <div class="input-group mb-3">
        <label class="input-group-text" for="sort-select">Sort By</label>
        <select v-model="sortBy" id="sort-select" class="form-select" aria-label="Default select example">
          <option value="default">Default</option>
          <option value="lastActionAsc">Last Action (ascending)</option>
          <option value="lastActionDesc">Last Action (descending)</option>
          <option value="nameAsc">Name (ascending)</option>
          <option value="nameDesc">Name (descending)</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
      <draggable v-bind="dragOptions" :force-fallback="true" :force-autoscroll-fallback="true" :scroll-speed="500" :scroll-sensitivity="10" v-model="sortedPlants" item-key="_id">
        <template #item="{ element }">
          <PlantCard :plant="element" :key="element._id" />
        </template>
      </draggable>
      <!-- <PlantCard v-for="plant in sortedPlants" :plant="plant" :key="plant._id" /> -->
    </div>

  </div>
</template>

<script>
import { ref, defineComponent, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Modal from "./Modal.vue";
import Action from "./Action.vue";
import PlantCard from "./PlantCard.vue";
import axios from "axios";
import draggable from "vuedraggable";

export default defineComponent({
  components: {
    Modal,
    Action,
    PlantCard,
    draggable
  },
  name: "Plants",
  setup() {
    const router = useRouter();
    const showModal = ref(false);
    const loading = ref(false);
    const plantsLoading = ref(false);
    const negativeAlert = ref(false);
    const positiveAlert = ref(false);
    const alertText = ref("");
    const modalTitle = ref("");
    const addingPlant = ref(false);
    const plants = ref([]);
    const searchInput = ref("");
    const sortBy = ref(localStorage.getItem("sortBy") || "default");

    watch(sortBy, (newVal) => {
      localStorage.setItem("sortBy", newVal);
    });

    const getPlants = async () => {
      plantsLoading.value = true;

      try {
        const apiUrl = `${process.env.VUE_APP_API_ORIGIN}/api/plants`;
        const headers = {
          "Content-Type": "application/json",
        };

        const response = await axios.get(apiUrl, { headers });

        if (response.status === 200) {
          plants.value = response.data;
        }
      } catch (error) {
        showError("fetch", error);
        console.error("Error fetching data:", error);
      }
      plantsLoading.value = false;
    };

    const handleCloseModal = async (value) => {
      loading.value = false;
      showModal.value = false;
    };

    const showSuccess = () => {
      showModal.value = false;
      positiveAlert.value = true;
      alertText.value = "Plant added successfully."

      setTimeout(() => {
        alertText.value = "";
        positiveAlert.value = false;
      }, 3000);
    };

    const showError = (error) => {
      showModal.value = false;
      negativeAlert.value = true;

      if (error.response?.data?.message) {
        alertText.value = "Error: " + error.response.data.message;
      } else {
        alertText.value = `There was an error adding the plant.`;
      }

      setTimeout(() => {
        alertText.value = "";
        negativeAlert.value = false;
      }, 10000);
    };

    const addPlant = () => {
      modalTitle.value = "Add Plant";
      showModal.value = true;
      addingPlant.value = true;
    };

    const checkAuth = async () => {
      const username = localStorage.getItem("username");
      if (username) {
        let currUser = await axios.get(`${process.env.VUE_APP_API_ORIGIN}/api/user/${username}`);
        if (currUser.data && currUser.data.authenticated) {
          await getPlants();
        } else {
          router.push({ name: "login" });
        }
      }
      else {
        router.push({ name: "login" });
      }
    };

    const getLastAction = (plant) => {
      let actions = plant.actions;
      if (actions) {
        actions.sort((a, b) => {
          return new Date(a.time) - new Date(b.time);
        });
        if (actions && actions.length > 0) {
          const lastAction = actions[actions.length - 1];
          return lastAction;
        }
      }
      return { action: null, time: null };
    };

    onMounted(checkAuth);

    return {
      showModal,
      loading,
      plantsLoading,
      negativeAlert,
      positiveAlert,
      alertText,
      modalTitle,
      addingPlant,
      handleCloseModal,
      showSuccess,
      showError,
      getPlants,
      addPlant,
      plants,
      checkAuth,
      getLastAction,
      searchInput,
      sortBy,
    };
  },
  computed: {
    filteredPlants() {
      if (!this.searchInput) {
        return this.plants;
      }
      if (!this.plants) {
        return [];
      }
      return this.plants.filter((plant) => {
        return plant.name.toLowerCase().includes(this.searchInput.toLowerCase());
      });
    },
    sortedPlants() {
      let plantsToSort = JSON.parse(JSON.stringify(this.filteredPlants));
      if (this.sortBy === "default") {
        return plantsToSort;
      }
      else if (this.sortBy === "lastActionAsc") {
        return plantsToSort.sort((a, b) => {
          let aLastAction = this.getLastAction(a);
          let bLastAction = this.getLastAction(b);
          return new Date(bLastAction.time) - new Date(aLastAction.time);
        });
      }
      else if (this.sortBy === "lastActionDesc") {
        return plantsToSort.sort((a, b) => {
          let aLastAction = this.getLastAction(a);
          let bLastAction = this.getLastAction(b);
          return new Date(aLastAction.time) - new Date(bLastAction.time);
        });
      }
      else if (this.sortBy === "nameAsc") {
        return plantsToSort.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
      }
      else if (this.sortBy === "nameDesc") {
        return plantsToSort.sort((a, b) => {
          return b.name.localeCompare(a.name);
        });
      }
      else if (this.sortBy === "flagged") {
        return plantsToSort.sort((a, b) => {
          if (a.flagged && !b.flagged) {
            return -1;
          }
          else if (!a.flagged && b.flagged) {
            return 1;
          }
          else {
            return 0;
          }
        });
      }
    },
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
});
</script>
<style scoped>
#overlay {
  position: fixed; /* Sit on top of the page content */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
}

#overlay-content {
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
