<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Travel Agency Management Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Countries Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Countries</span>
            <v-btn color="primary" @click="openCountryDialog()">
              <v-icon left>mdi-plus</v-icon>
              Add Country
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="countryHeaders"
              :items="countries"
              :loading="loading.countries"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="editCountry(item)">mdi-pencil</v-icon>
                <v-icon small @click="deleteCountry(item.id)">mdi-delete</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Destinations Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Destinations</span>
            <v-btn color="primary" @click="openDestinationDialog()">
              <v-icon left>mdi-plus</v-icon>
              Add Destination
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="destinationHeaders"
              :items="destinations"
              :loading="loading.destinations"
              class="elevation-1"
            >
              <template v-slot:item.country="{ item }">
                {{ item.country?.name || 'N/A' }}
              </template>
              <template v-slot:item.isActive="{ item }">
                <v-chip :color="item.isActive ? 'green' : 'red'" small>
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="editDestination(item)">mdi-pencil</v-icon>
                <v-icon small @click="deleteDestination(item.id)">mdi-delete</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Arrangements Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Travel Arrangements</span>
            <v-btn color="primary" @click="openArrangementDialog()">
              <v-icon left>mdi-plus</v-icon>
              Add Arrangement
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="arrangementHeaders"
              :items="arrangements"
              :loading="loading.arrangements"
              class="elevation-1"
            >
              <template v-slot:item.destination="{ item }">
                {{ item.destination?.name || 'N/A' }}
              </template>
              <template v-slot:item.basePricePerPerson="{ item }">
                ${{ parseFloat(item.basePricePerPerson).toFixed(2) }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" small>
                  {{ item.status }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-icon small class="mr-2" @click="editArrangement(item)">mdi-pencil</v-icon>
                <v-icon small @click="deleteArrangement(item.id)">mdi-delete</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Country Dialog -->
    <v-dialog v-model="dialogs.country" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingCountry ? 'Edit Country' : 'Add New Country' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="countryForm" v-model="forms.country.valid">
            <v-text-field
              v-model="forms.country.name"
              label="Country Name"
              :rules="[v => !!v || 'Country name is required']"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeCountryDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveCountry" :loading="saving.country">
            {{ editingCountry ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Destination Dialog -->
    <v-dialog v-model="dialogs.destination" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingDestination ? 'Edit Destination' : 'Add New Destination' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="destinationForm" v-model="forms.destination.valid">
            <v-select
              v-model="forms.destination.countryId"
              :items="countries"
              item-title="name"
              item-value="id"
              label="Country"
              :rules="[v => !!v || 'Country is required']"
              required
            ></v-select>
            <v-text-field
              v-model="forms.destination.name"
              label="Destination Name"
              :rules="[v => !!v || 'Destination name is required']"
              required
            ></v-text-field>
            <v-textarea
              v-model="forms.destination.description"
              label="Description"
              rows="3"
            ></v-textarea>
            <v-switch
              v-model="forms.destination.isActive"
              label="Active"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDestinationDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveDestination" :loading="saving.destination">
            {{ editingDestination ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Arrangement Dialog -->
    <v-dialog v-model="dialogs.arrangement" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editingArrangement ? 'Edit Arrangement' : 'Add New Arrangement' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="arrangementForm" v-model="forms.arrangement.valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="forms.arrangement.destinationId"
                  :items="destinations"
                  item-title="name"
                  item-value="id"
                  label="Destination"
                  :rules="[v => !!v || 'Destination is required']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="forms.arrangement.basePricePerPerson"
                  label="Base Price Per Person"
                  type="number"
                  step="0.01"
                  :rules="[v => !!v || 'Price is required', v => v > 0 || 'Price must be greater than 0']"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-text-field
              v-model="forms.arrangement.title"
              label="Title"
              :rules="[v => !!v || 'Title is required']"
              required
            ></v-text-field>
            <v-textarea
              v-model="forms.arrangement.summary"
              label="Summary"
              rows="3"
            ></v-textarea>
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="forms.arrangement.type"
                  :items="arrangementTypes"
                  label="Type"
                  :rules="[v => !!v || 'Type is required']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="forms.arrangement.transportType"
                  :items="transportTypes"
                  label="Transport Type"
                  :rules="[v => !!v || 'Transport type is required']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="forms.arrangement.accommodationType"
                  :items="accommodationTypes"
                  label="Accommodation Type"
                  :rules="[v => !!v || 'Accommodation type is required']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="forms.arrangement.status"
                  :items="arrangementStatuses"
                  label="Status"
                  :rules="[v => !!v || 'Status is required']"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeArrangementDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveArrangement" :loading="saving.arrangement">
            {{ editingArrangement ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { store } from '@/utils/store';
import axiosInstance from '@/utils/axiosInstance';

export default {
  name: 'AnjaHomeView',
  data() {
    return {
      // Loading states
      loading: {
        countries: false,
        destinations: false,
        arrangements: false
      },
      // Saving states
      saving: {
        country: false,
        destination: false,
        arrangement: false
      },

      // Data arrays
      countries: [],
      destinations: [],
      arrangements: [],

      // Dialog states
      dialogs: {
        country: false,
        destination: false,
        arrangement: false
      },

      // Editing states
      editingCountry: null,
      editingDestination: null,
      editingArrangement: null,

      // Form data
      forms: {
        country: { valid: false, name: '' },
        destination: {
          valid: false,
          countryId: null,
          name: '',
          description: '',
          isActive: true,
          createdBy: ''
        },
        arrangement: {
          valid: false,
          destinationId: null,
          createdByUsername: '',
          title: '',
          type: 'DAY_TRIP',
          summary: '',
          basePricePerPerson: 0,
          transportType: '',
          accommodationType: '',
          status: 'DRAFT'
        }
      },

      // Table headers
      countryHeaders: [
        { text: 'ID', value: 'id', sortable: true },
        { text: 'Name', value: 'name', sortable: true },
        { text: 'Created At', value: 'createdAt', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      destinationHeaders: [
        { text: 'ID', value: 'id', sortable: true },
        { text: 'Name', value: 'name', sortable: true },
        { text: 'Country', value: 'country', sortable: false },
        { text: 'Created By', value: 'createdBy', sortable: true },
        { text: 'Status', value: 'isActive', sortable: true },
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      arrangementHeaders: [
        { text: 'ID', value: 'id', sortable: true },
        { text: 'Title', value: 'title', sortable: true },
        { text: 'Destination', value: 'destination', sortable: false },
        { text: 'Created By', value: 'createdByUsername', sortable: true },
        { text: 'Price', value: 'basePricePerPerson', sortable: true },
        { text: 'Type', value: 'type', sortable: true },
        { text: 'Transport', value: 'transportType', sortable: true },
        { text: 'Accommodation', value: 'accommodationType', sortable: true },
        { text: 'Status', value: 'status', sortable: true },
        { text: 'Actions', value: 'actions', sortable: false }
      ],

      // Dropdown options
      transportTypes: ['BUS', 'PLANE', 'OWN'],
      accommodationTypes: ['HOTEL', 'APT', 'HOSTEL'],
      arrangementStatuses: ['DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE'],
      arrangementTypes: ['DAY_TRIP', 'MULTI_DAY'],

      // Snackbar
      snackbar: { show: false, message: '', color: 'success' }
    };
  },

  async mounted() {
    await this.loadAllData();
  },

  methods: {
    // Load all data
    async loadAllData() {
      await Promise.all([
        this.loadCountries(),
        this.loadDestinations(),
        this.loadArrangements()
      ]);
    },

    // Countries CRUD
    async loadCountries() {
      this.loading.countries = true;
      try {
        const response = await axiosInstance.get('/countries');
        this.countries = response.data;
      } catch (error) {
        this.showError('Failed to load countries');
        console.error('Error loading countries:', error);
      } finally {
        this.loading.countries = false;
      }
    },
    openCountryDialog(country = null) {
      this.editingCountry = country;
      this.forms.country.name = country ? country.name : '';
      this.dialogs.country = true;
    },
    closeCountryDialog() {
      this.dialogs.country = false;
      this.editingCountry = null;
      this.forms.country.name = '';
      this.$refs.countryForm?.resetValidation();
    },
    async saveCountry() {
      if (!this.forms.country.valid) return;
      this.saving.country = true;
      try {
        const data = { name: this.forms.country.name };
        if (this.editingCountry) {
          await axiosInstance.put(`/countries/${this.editingCountry.id}`, data);
          this.showSuccess('Country updated successfully');
        } else {
          await axiosInstance.post('/countries', data);
          this.showSuccess('Country created successfully');
        }
        this.closeCountryDialog();
        await this.loadCountries();
      } catch (error) {
        this.showError('Failed to save country');
        console.error('Error saving country:', error);
      } finally {
        this.saving.country = false;
      }
    },
    editCountry(country) { this.openCountryDialog(country); },
    async deleteCountry(id) {
      if (!confirm('Are you sure you want to delete this country?')) return;
      try {
        await axiosInstance.delete(`/countries/${id}`);
        this.showSuccess('Country deleted successfully');
        await this.loadCountries();
      } catch (error) {
        this.showError('Failed to delete country');
        console.error('Error deleting country:', error);
      }
    },

    // Destinations CRUD
    async loadDestinations() {
      this.loading.destinations = true;
      try {
        const response = await axiosInstance.get('/destinations');
        this.destinations = response.data;
      } catch (error) {
        this.showError('Failed to load destinations');
        console.error('Error loading destinations:', error);
      } finally {
        this.loading.destinations = false;
      }
    },
    openDestinationDialog(destination = null) {
      this.editingDestination = destination;
      if (destination) {
        this.forms.destination.countryId = destination.countryId;
        this.forms.destination.name = destination.name;
        this.forms.destination.description = destination.description || '';
        this.forms.destination.isActive = destination.isActive;
        this.forms.destination.createdBy = destination.createdBy;
      } else {
        this.forms.destination.countryId = null;
        this.forms.destination.name = '';
        this.forms.destination.description = '';
        this.forms.destination.isActive = true;
        this.forms.destination.createdBy = '';
      }
      this.dialogs.destination = true;
    },
    closeDestinationDialog() {
      this.dialogs.destination = false;
      this.editingDestination = null;
      this.forms.destination.countryId = null;
      this.forms.destination.name = '';
      this.forms.destination.description = '';
      this.forms.destination.isActive = true;
      this.forms.destination.createdBy = '';
      this.$refs.destinationForm?.resetValidation();
    },
    async saveDestination() {
      if (!this.forms.destination.valid) return;
      this.saving.destination = true;
      try {
        const data = {
          countryId: Number(this.forms.destination.countryId),
          name: this.forms.destination.name,
          description: this.forms.destination.description,
          isActive: this.forms.destination.isActive,
          createdBy: 'admin'
        };
        if (this.editingDestination) {
          await axiosInstance.put(`/destinations/${this.editingDestination.id}`, data);
          this.showSuccess('Destination updated successfully');
        } else {
          await axiosInstance.post('/destinations', data);
          this.showSuccess('Destination created successfully');
        }
        this.closeDestinationDialog();
        await this.loadDestinations();
      } catch (error) {
        this.showError('Failed to save destination');
        console.error('Error saving destination:', error);
      } finally {
        this.saving.destination = false;
      }
    },
    editDestination(destination) { this.openDestinationDialog(destination); },
    async deleteDestination(id) {
      if (!confirm('Are you sure you want to delete this destination?')) return;
      try {
        await axiosInstance.delete(`/destinations/${id}`);
        this.showSuccess('Destination deleted successfully');
        await this.loadDestinations();
      } catch (error) {
        this.showError('Failed to delete destination');
        console.error('Error deleting destination:', error);
      }
    },

    // Arrangements CRUD
    async loadArrangements() {
      this.loading.arrangements = true;
      try {
        const response = await axiosInstance.get('/anjaArrangements');
        this.arrangements = response.data;
      } catch (error) {
        this.showError('Failed to load arrangements');
        console.error('Error loading arrangements:', error);
      } finally {
        this.loading.arrangements = false;
      }
    },
    openArrangementDialog(arrangement = null) {
      this.editingArrangement = arrangement;
      if (arrangement) {
        this.forms.arrangement.destinationId = arrangement.destinationId;
        this.forms.arrangement.createdByUsername = arrangement.createdByUsername || arrangement.createdBy || '';
        this.forms.arrangement.title = arrangement.title;
        this.forms.arrangement.type = arrangement.type || 'DAY_TRIP';
        this.forms.arrangement.summary = arrangement.summary || '';
        this.forms.arrangement.basePricePerPerson = arrangement.basePricePerPerson;
        this.forms.arrangement.transportType = arrangement.transportType;
        this.forms.arrangement.accommodationType = arrangement.accommodationType;
        this.forms.arrangement.status = arrangement.status;
      } else {
        this.forms.arrangement.destinationId = null;
        this.forms.arrangement.createdByUsername = '';
        this.forms.arrangement.title = '';
        this.forms.arrangement.type = 'DAY_TRIP';
        this.forms.arrangement.summary = '';
        this.forms.arrangement.basePricePerPerson = 0;
        this.forms.arrangement.transportType = '';
        this.forms.arrangement.accommodationType = '';
        this.forms.arrangement.status = 'DRAFT';
      }
      this.dialogs.arrangement = true;
    },
    closeArrangementDialog() {
      this.dialogs.arrangement = false;
      this.editingArrangement = null;
      this.forms.arrangement.destinationId = null;
      this.forms.arrangement.createdByUsername = '';
      this.forms.arrangement.type = 'DAY_TRIP';
      this.forms.arrangement.title = '';
      this.forms.arrangement.summary = '';
      this.forms.arrangement.basePricePerPerson = 0;
      this.forms.arrangement.transportType = '';
      this.forms.arrangement.accommodationType = '';
      this.forms.arrangement.status = 'DRAFT';
      this.$refs.arrangementForm?.resetValidation();
    },
    async saveArrangement() {
      const username = store?.state?.user?.username;
      if (!username) { this.showError('Please sign in first.'); return; }
      if (!this.forms.arrangement.valid) return;

      this.saving.arrangement = true;
      try {
        const data = {
          destinationId: Number(this.forms.arrangement.destinationId),
          createdByUsername: username,
          title: this.forms.arrangement.title,
          type: this.forms.arrangement.type,
          summary: this.forms.arrangement.summary,
          basePricePerPerson: Number(this.forms.arrangement.basePricePerPerson),
          transportType: this.forms.arrangement.transportType,
          accommodationType: this.forms.arrangement.accommodationType,
          status: this.forms.arrangement.status
        };
        if (this.editingArrangement) {
          await axiosInstance.put(`/anjaArrangements/${this.editingArrangement.id}`, data);
          this.showSuccess('Arrangement updated successfully');
        } else {
          await axiosInstance.post('/anjaArrangements', data);
          this.showSuccess('Arrangement created successfully');
        }
        this.closeArrangementDialog();
        await this.loadArrangements();
      } catch (error) {
        this.showError('Failed to save arrangement');
        console.error('Error saving arrangement:', error);
      } finally {
        this.saving.arrangement = false;
      }
    },
    editArrangement(arrangement) { this.openArrangementDialog(arrangement); },
    async deleteArrangement(id) {
      if (!confirm('Are you sure you want to delete this arrangement?')) return;
      try {
        await axiosInstance.delete(`/anjaArrangements/${id}`);
        this.showSuccess('Arrangement deleted successfully');
        await this.loadArrangements();
      } catch (error) {
        this.showError('Failed to delete arrangement');
        console.error('Error deleting arrangement:', error);
      }
    },

    // Utility methods
    getStatusColor(status) {
      const colors = { DRAFT: 'grey', ACTIVE: 'green', INACTIVE: 'orange', CANCELLED: 'red' };
      return colors[status] || 'grey';
    },
    showSuccess(message) {
      this.snackbar.message = message;
      this.snackbar.color = 'success';
      this.snackbar.show = true;
    },
    showError(message) {
      this.snackbar.message = message;
      this.snackbar.color = 'error';
      this.snackbar.show = true;
    }
  }
};
</script>

<style scoped>
.v-card { border-radius: 12px; }
.v-card-title { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; }
.v-data-table { border-radius: 8px; }
.v-chip { font-weight: 500; }
.v-btn { border-radius: 8px; font-weight: 600; text-transform: none; }
.text-h4 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}
.v-dialog .v-card { border-radius: 16px; }
.v-dialog .v-card-title { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.25rem; font-weight: 600; padding: 16px 24px; }
.v-form .v-text-field, .v-form .v-select, .v-form .v-textarea { margin-bottom: 8px; }
.elevation-1 { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; }
.v-container { max-width: 1400px; }
.v-card-text { padding: 20px; }
.v-snackbar { font-weight: 500; }
@media (max-width: 960px) {
  .v-container { padding: 12px; }
  .v-card-title { font-size: 1.1rem; padding: 12px 16px; }
  .v-data-table { font-size: 0.875rem; }
}
</style>


