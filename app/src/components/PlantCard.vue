<template>
  <div class="card" @click="goToPlantDetail">
    <div class="card-body">
      <h5 class="card-title">{{ plant.name }}</h5>
      <div class="btn-group" role="group" @click.stop="">
        <button @click="waterPlant" class="btn btn-info">Water</button>
        <button @click="fertilizePlant" class="btn btn-warning">
          Fertilize
        </button>
        <button @click="repotPlant" class="btn btn-success">Repot</button>
      </div>
      <p class="mt-3" v-if="thisPlant?.actions?.length">
        Last Action: {{ formattedLastAction }} <br>
        ({{ daysSinceLastAction }})
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from 'axios';

export default {
  props: {
    plant: Object,
  },
  setup(props) {
    const router = useRouter();
    const thisPlant = ref(props.plant);

    const waterPlant = async () => {
      let response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.plant._id}/water`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        thisPlant.value = response.data;
      }
    };

    const fertilizePlant = async () => {
      let response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.plant._id}/fertilize`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        thisPlant.value = response.data;
      }
    };

    const repotPlant = async () => {
      let response = await axios.post(`${process.env.VUE_APP_API_ORIGIN}/api/plant/${props.plant._id}/repot`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        thisPlant.value = response.data;
      }
    };

    const daysSinceDate = (date) => {
      const oneDay = 24 * 60 * 60 * 1000;
      const today = new Date();
      return Math.round(Math.abs((date - today) / oneDay));
    };

    const getLastAction = () => {
      let actions = thisPlant.value.actions;
      actions.sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
      });
      if (actions && actions.length > 0) {
        const lastAction = actions[actions.length - 1];
        return lastAction;
      }
      return null;
    };

    const goToPlantDetail = () => {
      router.push({ name: "plant-detail", params: { id: thisPlant.value._id } });
    };

    return {
      waterPlant,
      fertilizePlant,
      repotPlant,
      daysSinceDate,
      thisPlant,
      getLastAction,
      goToPlantDetail,
    };
  },
  computed: {
    formattedLastAction() {
      const lastAction = this.getLastAction();
      if (!lastAction) return "";
      let date = new Date(lastAction.time);
      return `${lastAction.type} on ${date.toLocaleDateString()}`;
    },
    daysSinceLastAction() {
      const lastAction = this.getLastAction();
      if (!lastAction) return "";
      let date = new Date(lastAction.time);
      const elapsedTime = this.daysSinceDate(date);
      if (elapsedTime === 0) return "Today";
      return `${elapsedTime} day${elapsedTime == 1 ? '' : 's'} ago`;
    }
  },
};
</script>

<style scoped>
/* Add your custom styles here if needed */
.card {
  margin-bottom: 10px;
}
</style>
