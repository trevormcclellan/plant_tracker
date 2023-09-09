<template>
  <div class="container">
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label for="domain">Domain:</label>
        <input disabled class="form-control" type="text" id="domain" v-model="domain" required />
      </div>

      <div class="mb-3" v-if="type === 'domain'">
        <label for="context">Context:</label>
        <input class="form-control" placeholder="Context such as 2023 Fall" type="text" id="context" v-model="formInput" required/>
      </div>

      <div class="mb-3" v-if="type === 'A'">
        <label for="values">Enter one or more IPv4 Addresses (one per line):</label>
        <textarea id="values" class="form-control mb-3" :placeholder="'1.1.1.1\n2.2.2.2'" v-model="formInput" required></textarea>
        <label for="ttl">TTL (seconds):</label>
        <input class="form-control" placeholder="3600" type="number" v-model="ttl" required/>
      </div>

      <div class="mb-3" v-if="type === 'AAAA'">
        <label for="values">Enter one or more IPv6 Addresses (one per line):</label>
        <textarea id="values" class="form-control mb-3" :placeholder="'1111::1111\n2222::2222'" v-model="formInput" required></textarea>
        <label for="ttl">TTL (seconds):</label>
        <input class="form-control" placeholder="3600" type="number" v-model="ttl" required/>
      </div>

      <div class="mb-3" v-if="type === 'CNAME'">
        <label for="cname">Target:</label>
        <input class="form-control mb-3"  type="text" id="cname" placeholder="example.com" v-model="formInput" required/>
        <label for="ttl">TTL (seconds):</label>
        <input class="form-control" placeholder="3600" type="number" v-model="ttl" required/>
      </div>

      <div class="mb-3" v-if="type === 'MX'">
        <label for="values">Exchange server, preference (one per line):</label>
        <textarea id="values" class="form-control mb-3" :placeholder="'mailinator.com, 1\nmail.exchange.com, 3'" v-model="formInput" required></textarea>
        <label for="ttl">TTL (seconds):</label>
        <input class="form-control" placeholder="3600" type="number" v-model="ttl" required/>
      </div>

      <div class="mb-3" v-if="type === 'TXT'">
        <label for="values">Values (one per line):</label>
        <textarea id="values" class="form-control mb-3" :placeholder="'A TXT Record\nAnother value'" v-model="formInput" required></textarea>
        <label for="ttl">TTL (seconds):</label>
        <input class="form-control" placeholder="3600" type="number" v-model="ttl" required/>
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
    record: {},
    type: "",
  },
  emits: ["getZone", "showSuccess", "showError"],
  setup(props, { emit }) {
    const domain = ref("");
    const loading = ref(false);
    const formInput = ref("");
    const ttl = ref(3600);

    watchEffect(() => {
      if (props.type === "domain") {
        formInput.value = props.record.context;
      }
      else if (props.type === 'CNAME') {
        formInput.value = props.record.cname;
      }
      else if (props.type === 'MX') {
        formInput.value = props.record.values.map((value) => {
          return `${value.exchange}, ${value.preference}`;
        }).join("\n");
      }
      else {
        formInput.value = props.record.values.join("\n");
      }
      domain.value = props.record.name;
      ttl.value = props.record.ttl;
    });

    const resetForm = () => {
      domain.value = "";
      formInput.value = "";
      ttl.value = 3600;
    };

    const submitForm = async () => {
      try {
        let response;
        let values = [];
        loading.value = true;

        switch (props.type) {
          case "domain":
            response = await axios.put(
              `${process.env.VUE_APP_API_ORIGIN}/api/zone/${domain.value}`,
              { context: formInput.value },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json, */*;q=0.1",
                },
              }
            );
            break;

          case "A":
          case "AAAA":
          case "TXT":
            values = formInput.value.split("\n");
            response = await axios.put(
              `${process.env.VUE_APP_API_ORIGIN}/api/zone/${domain.value}/${props.type}`,
              { values, ttl: ttl.value },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json, */*;q=0.1",
                },
              }
            );
            break;

          case "CNAME":
            response = await axios.put(
              `${process.env.VUE_APP_API_ORIGIN}/api/zone/${domain.value}/${props.type}`,
              { cname: formInput.value, ttl: ttl.value },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json, */*;q=0.1",
                },
              }
            );
            break;

          case "MX":
            values = formInput.value.split("\n").map((value) => {
              const [exchange, preference] = value.split(",");
              return { exchange, preference: parseInt(preference) };
            });
            response = await axios.put(
              `${process.env.VUE_APP_API_ORIGIN}/api/zone/${domain.value}/${props.type}`,
              { values, ttl: ttl.value },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json, */*;q=0.1",
                },
              }
            );
            break;
        }

        loading.value = false;
        resetForm();
        console.log(response.status)
        if (response.status === 200) {
          emit("getZone");
          emit("showSuccess", props.type, true);
        }
      } catch (error) {
        loading.value = false;
        emit("showError", props.type, error, true);
      }
    };

    return {
      domain,
      loading,
      formInput,
      ttl,
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
