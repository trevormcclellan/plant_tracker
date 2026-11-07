<template>
  <teleport to="body">
    <div v-if="showModal" ref="modal" class="modal fade show d-block" tabindex="-1" role="dialog"
      :aria-labelledby="titleId" aria-modal="true" :aria-busy="loading" @keydown="handleKeydown" @click.self="close">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-dark" :id="titleId"><slot name="title"></slot></h5>
            <button :disabled="loading" type="button" class="btn-close" aria-label="Close dialog" @click="close"></button>
          </div>
          <div class="modal-body text-dark"><slot></slot></div>
          <div v-if="!hideFooter" class="modal-footer text-dark">
            <button :disabled="loading" type="button" class="btn btn-danger" @click="confirm">
              <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              {{ loading ? 'Deleting…' : 'Delete plant' }}
            </button>
            <button :disabled="loading" type="button" class="btn btn-secondary" @click="close">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show" aria-hidden="true"></div>
  </teleport>
</template>

<script>
let nextModalId = 0;

export default {
  name: "Modal",
  emits: ["closeModal"],
  props: {
    showModal: Boolean,
    modalId: String,
    loading: Boolean,
    hideFooter: Boolean,
  },
  data() {
    return { titleId: this.modalId || `plant-modal-${++nextModalId}`, previousFocus: null, ownsBodyLock: false };
  },
  watch: {
    async loading() {
      await this.$nextTick();
      // Disabling the focused submit button can move focus to the page body.
      if (this.showModal && !this.$refs.modal?.contains(document.activeElement)) {
        this.$refs.modal?.focus();
      }
    },
    showModal: {
      immediate: true,
      async handler(open) {
        if (open) {
          this.previousFocus = document.activeElement;
          this.ownsBodyLock = !document.body.classList.contains("modal-open");
          document.body.classList.add("modal-open");
          await this.$nextTick();
          if (this.showModal) {
            const input = this.$refs.modal?.querySelector("input:not([disabled])");
            (input || this.$refs.modal)?.focus();
          }
        } else {
          this.restoreFocus();
        }
      },
    },
  },
  beforeUnmount() { this.restoreFocus(); },
  methods: {
    close() { if (!this.loading) this.$emit("closeModal", false); },
    confirm() { if (!this.loading) this.$emit("closeModal", true); },
    restoreFocus() {
      if (this.ownsBodyLock) document.body.classList.remove("modal-open");
      this.ownsBodyLock = false;
      if (this.previousFocus?.isConnected) this.previousFocus.focus();
      this.previousFocus = null;
    },
    handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(this.$refs.modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      )).filter(item => item.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        this.$refs.modal.focus();
      } else if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    },
  },
};
</script>
