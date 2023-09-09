<template>
  <div class="container">
    <div v-if="loading" id="overlay">
      <div id="overlay-content">
        <div class="spinner-border" role="status"><span class="sr-only"></span></div>
        <div>Loading...</div>
      </div>
    </div>
    <div id="alerts" class="fixed-top">
      <div v-if="negativeAlert" id="negative-alert-popup" class="alert alert-danger" role="alert">{{ alertText }}</div>
      <div v-if="positiveAlert" id="positive-alert-popup" class="alert alert-success" role="alert">{{ alertText }}</div>
    </div>
    <Modal :showModal="showModal" :loading="loading" :hideFooter="editingPlant" @closeModal="handleCloseModal">
      <template #title>{{modalTitle}}</template>
      <EditPlant v-if="editingPlant" @updatePlant="updatePlant" @showSuccess="showSuccess" @showError="showError" :plant="plant"></EditPlant>
      <p v-else>{{ deleteMessage }}</p>
    </Modal>
    <!-- Display plant details -->
    <div class="title-div">
      <h1 class="card-title">{{ plant.name }}</h1>
      <div class="mt-2 mb-3 btn-group" role="group">
        <button @click="editPlant" class="btn btn-secondary">Edit</button>
        <button @click="deletePlant" class="btn btn-danger" id="delete-button">
          Delete
        </button>
      </div>
    </div>

    <!-- Display past actions with fixed scrolling -->
    <h5 class="card-title">Past Actions</h5>
    <div class="card" id="past-actions">
      <div class="card-body past-actions-scrollable">
        <div class="list-group" v-if="plant.actions?.length">
          <a
            v-for="action in actions"
            :key="action.id"
            href="#"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <!-- Icon based on action type -->
            <img
              v-if="action.type === 'Watered'"
              src="@/assets/icons/water.png"
              alt="Water"
              class="action-icon"
            />
            <img
              v-else-if="action.type === 'Fertilized'"
              src="@/assets/icons/fertilize.png"
              alt="Fertilize"
              class="action-icon"
            />
            <img
              v-else-if="action.type === 'Repotted'"
              src="@/assets/icons/repot.png"
              alt="Repot"
              class="action-icon"
            />

            <!-- Action details -->
            <div class="action-details">
              <span class="action-type">{{ action.type }}</span>
            </div>
            <span class="action-date">{{
              new Date(action.time).toLocaleDateString()
            }}</span>
          </a>
        </div>
        <div v-else>None yet</div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Modal from "./Modal.vue";
import EditPlant from "./EditPlant.vue";

export default {
  components: {
    Modal,
    EditPlant,
  },
  props: {
    id: String, // Prop for the plant ID
  },
  setup(props) {
    const router = useRouter();
    const plant = ref({actions: []});
    const showModal = ref(false);
    const modalTitle = ref("");
    const deleteMessage = ref("");
    const loading = ref(false);
    const editingPlant = ref(false);
    const negativeAlert = ref(false);
    const positiveAlert = ref(false);
    const alertText = ref("");

    const fetchPlantDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.id}`
        );
        if (response.status === 200) {
          plant.value = response.data;
        }
      } catch (error) {
        router.push("/"); // Redirect to home page if plant not found
        console.error("Error fetching plant details:", error);
        // Handle error (e.g., show an error message)
      }
    };

    const editPlant = () => {
      // Handle editing the plant (e.g., navigate to edit page)
      modalTitle.value = "Edit Plant";
      editingPlant.value = true;
      showModal.value = true;
    };

    const deletePlant = () => {
      // Handle deleting the plant (e.g., show confirmation modal)
      editingPlant.value = false;
      modalTitle.value = "Delete Plant";
      deleteMessage.value = `Are you sure you want to delete ${plant.value.name}?`;
      showModal.value = true;
    };

    const updatePlant = (updatedPlant) => {
      showModal.value = false;
      plant.value = updatedPlant;
      editingPlant.value = false;
    };

    const handleCloseModal = async (val) => {
      // Handle closing the modal (e.g., hide modal)
      showModal.value = false;
      if (val) {
        try {
          loading.value = true;
          const response = await axios.delete(
            `${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.id}`
          );
          loading.value = false;
          if (response.status === 200) {
            router.push("/");
          }
        } catch (error) {
          loading.value = false;
          console.error("Error deleting plant:", error);
          showError(error);
        }
      }
    };

    const showSuccess = () => {
      showModal.value = false;
      positiveAlert.value = true;
      alertText.value = `Plant updated successfully.`;

      setTimeout(() => {
        alertText.value = "";
        positiveAlert.value = false;
      }, 3000);
    };

    const showError = (error, editing=false) => {
      showModal.value = false;
      negativeAlert.value = true;

      if (error.response?.data?.message) {
        alertText.value = "Error: " + error.response.data.message;
      } else {
        alertText.value = `There was an error ${editing ? 'updating' : 'deleting'} the plant.`;
      }

      setTimeout(() => {
        alertText.value = "";
        negativeAlert.value = false;
      }, 10000);
    };

    // Fetch plant details when the component is mounted
    onMounted(() => {
      fetchPlantDetails();
    });

    return {
      plant,
      editPlant,
      deletePlant,
      updatePlant,
      showModal,
      modalTitle,
      deleteMessage,
      handleCloseModal,
      loading,
      editingPlant,
      showSuccess,
      showError,
      negativeAlert,
      positiveAlert,
      alertText,
    };
  },
  computed: {
    actions: function () {
      return this.plant.actions.sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
      });
    },
  },
};
</script>
<style scoped>
/* Add your custom styles here if needed */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Ensure full viewport height */
  overflow: hidden; /* Hide any overflowing content */
}

.card {
  margin-bottom: 10px;
  margin: 10px;
}

.action-icon {
  width: 24px; /* Adjust the size as needed */
  height: 24px; /* Adjust the size as needed */
  margin-right: 12px; /* Add spacing between icon and details */
}

.action-details {
  display: flex;
  flex-direction: column;
}

.action-type {
  font-weight: bold;
}

.action-date {
  color: #777;
}

/* Style the scrollbar (optional) */
.past-actions-scrollable::-webkit-scrollbar {
  width: 8px; /* Adjust the scrollbar width as needed */
}

.past-actions-scrollable::-webkit-scrollbar-thumb {
  background-color: #888; /* Customize the scrollbar thumb color */
  border-radius: 4px; /* Customize the scrollbar thumb border radius */
}

/* Ensure past-actions card scrolls with fixed height */
#past-actions {
  flex: 1; /* Grow and fill remaining vertical space */
  overflow-y: auto; /* Enable vertical scrolling when content overflows */
  position: sticky;
  top: 0;
  height: calc(100vh - 300px); /* Adjust the fixed height as needed */
}

.title-div {
  margin: 10px;
}

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
</style>
