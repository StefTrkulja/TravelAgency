<!-- src/components/EscalateCaseDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="720"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">Escalate Case</v-card-title>
      <v-divider />

      <v-card-text>
        <v-row class="mb-4" dense>
          <v-col cols="12" sm="6">
            <div class="meta"><span class="meta-label">Case ID:</span><span class="meta-value">{{ ticket?.id ?? '—' }}</span></div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="meta"><span class="meta-label">Subject:</span><span class="meta-value">{{ ticket?.subject ?? '—' }}</span></div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="meta"><span class="meta-label">Assigned operator:</span><span class="meta-value">{{ ticket?.assigneeUsername ?? '—' }}</span></div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="meta"><span class="meta-label">Status:</span><span class="meta-value">{{ ticket?.statusName ?? '—' }}</span></div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="meta"><span class="meta-label">Priority:</span><span class="meta-value">{{ ticket?.priority ?? '—' }}</span></div>
          </v-col>
        </v-row>

        <v-form ref="formRef" v-model="formValid">
          <v-textarea
            v-model="form.reason"
            :rules="[rules.required, rules.min10]"
            label="Reason for escalation"
            placeholder="Kratko obrazloženje…"
            auto-grow
            rows="3"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            clearable
          />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="submitting" @click="onCancel">Cancel</v-btn>
        <v-btn color="primary" :loading="submitting" :disabled="!formValid" @click="onSubmit">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'EscalateCaseDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    ticket: { type: Object, default: () => ({}) },
    accept: { type: String, default: 'image/*,.pdf' },
    submitting: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'submit', 'cancel'],
  data() {
    return {
      formValid: false,
      form: { reason: ''},
      rules: {
        required: v => !!v || 'Obavezno polje.',
        min10: v => (v && v.trim().length >= 10) || 'Unesi bar 10 karaktera.',
      }
    }
  },
  watch: {
    modelValue(open) {
      if (open) this.resetForm()
    }
  },
  methods: {
    resetForm() {
      this.form = { reason: ''}
      this.formValid = false
      this.$refs.formRef?.resetValidation?.()
    },
    onCancel() {
      this.$emit('cancel')
      this.$emit('update:modelValue', false)
    },
    async onSubmit() {
      const ok = await this.$refs.formRef?.validate()
      if (!ok) return
      this.$emit('submit', {
        ticketId: this.ticket?.id,
        reason: this.form.reason.trim(),
      })
    }
  }
}
</script>

<style scoped>
.meta{display:flex;gap:.5rem;line-height:1.5}
.meta-label{min-width:120px;color:rgba(var(--v-theme-on-surface),0.6)}
.meta-value{font-weight:600}
</style>
