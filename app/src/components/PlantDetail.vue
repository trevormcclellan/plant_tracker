<template>
  <div class="container">
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
        <div class="list-group">
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
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
  props: {
    id: String, // Prop for the plant ID
  },
  setup(props) {
    const router = useRouter();
    const plant = ref({actions: []});

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
    };

    const deletePlant = () => {
      // Handle deleting the plant (e.g., show confirmation modal)
    };

    // Fetch plant details when the component is mounted
    onMounted(() => {
      fetchPlantDetails();
    });

    return {
      plant,
      editPlant,
      deletePlant,
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
</style>
