<!-- src/components/ProposeCompensationDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="720"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">Propose Compensation</v-card-title>
      <v-divider />

      <v-card-text>
        <v-row dense class="mb-4">
          <v-col cols="12" sm="6">
            <div><b>Case ID:</b> {{ ticket?.id ?? '—' }}</div>
          </v-col>
          <v-col cols="12" sm="6">
            <div><b>Subject:</b> {{ ticket?.subject ?? '—' }}</div>
          </v-col>
          <v-col cols="12" sm="6">
            <div><b>Passenger:</b> {{ ticket?.passenger ?? '—' }}</div>
          </v-col>
        </v-row>

        <!-- Toggle -->
        <v-btn-toggle v-model="form.type" class="w-100 mb-4" mandatory>
          <v-btn value="REFUND" class="flex-1">Refund</v-btn>
          <v-btn value="VOUCHER" class="flex-1">Voucher</v-btn>
          <v-btn value="DISCOUNT" class="flex-1">Discount</v-btn>
        </v-btn-toggle>

        <!-- Fields -->
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.value" label="Value" type="number" variant="outlined" density="compact"/>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.currency" :items="['USD','EUR','RSD','%']" label="Currency" variant="outlined" density="compact"/>
          </v-col>
          <v-col cols="12" sm="6" v-if="form.type!=='REFUND'">
            <v-text-field v-model="form.validUntil" label="Valid Until" type="date" variant="outlined" density="compact"/>
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="form.note" label="Note" variant="outlined" auto-grow rows="3"/>
          </v-col>
        </v-row>

        <div class="text-caption mt-2">Summary: {{ summary }}</div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="submit">Submit Proposal</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ProposeCompensationDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    ticket: { type: Object, default: () => ({}) },
    defaultCurrency: { type: String, default: 'USD' },
    defaultType: { type: String, default: 'VOUCHER' }
  },
  emits: ['update:modelValue','submit'],
  data() {
    return {
      form: {
        type: this.defaultType,
        value: null,
        currency: this.defaultCurrency,
        validUntil: '',
        note: ''
      }
    }
  },
  computed: {
    summary() {
      if (!this.form.value) return ''
      const money = `${this.form.currency} ${this.form.value}`
      if (this.form.type === 'REFUND') return `Refund of ${money}`
      return `${this.form.type} of ${money} valid until ${this.form.validUntil || '—'}`
    }
  },
  watch: {
    // Resetuj formu pri otvaranju dijaloga (opciono, ali korisno)
    modelValue(open) {
      if (open) {
        this.form = {
          type: this.defaultType,
          value: null,
          currency: this.defaultCurrency,
          validUntil: '',
          note: ''
        }
      }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    submit() {
      this.$emit('submit', {
        caseId: this.ticket?.id,
        ...this.form
      })
      this.close()
    }
  }
}
</script>

<style scoped>
.flex-1{ flex:1 }
</style>
