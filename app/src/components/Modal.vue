<template>
  <teleport to="body">
      <div
          ref="modal"
          class="modal fade"
          :class="{ show: active, 'd-block': active }"
          tabindex="-1"
          role="dialog"
          :aria-labelledby="`modal-${id}`"
          :aria-hidden="active"
      >
        <div class="modal-dialog modal-dialog-centered" role="document" >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-dark" :id="`modal-${id}`"><slot name="title"></slot></h5>
              <button
                  :disabled="loading"
                  type="button"
                  class="btn-close"
                  data-dismiss="modal"
                  aria-label="Close"
                  @click="$emit('closeModal', false)"
              >
              </button>
            </div>
            <div class="modal-body text-dark">
              <slot></slot>
            </div>
            <div v-if="!hideFooter" class="modal-footer text-dark">
              <button :disabled="loading" type="button" class="btn btn-danger" @click="$emit('closeModal', true)">
                <div v-if="loading">
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span class="sr-only"> Loading...</span>
                </div>
                <span v-else>Yes</span>
              </button>
              <button :disabled="loading" type="button" class="btn btn-secondary" @click="$emit('closeModal', false)">No</button>
            </div>
          </div>
        </div>
      </div>
    <div @click="$emit('closeModal', false)" class="fade" :class="{ show: active, 'modal-backdrop show': active }"></div>
  </teleport>
</template>

<script>

import { ref, watch} from 'vue'

export default {
  name: 'Modal',
  emits: ['closeModal'],
  props: {
    showModal: Boolean,
    modalId: String,
    loading: Boolean,
    hideFooter: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const id = () => {
      let Id = 0;
        return () => {
            return Id++;
        }
    }
    const active = ref(props.showModal);

    watch(() => props.showModal, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        active.value = props.showModal;
        const body = document.querySelector("body");
        props.showModal ? body.classList.add("modal-open") : body.classList.remove("modal-open")
      }
    },{immediate:true, deep: true});

    return {
      active,
      id
    }
  },
}
</script>