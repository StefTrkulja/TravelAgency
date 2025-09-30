<template>
  <v-container class="signup-container">
    <v-row justify="center" align="center" class="min-height-screen">
      <v-col lg="6" md="7" sm="9" cols="12">
        <div class="signup-wrapper animate-fade-in">
          <!-- Header with gradient -->
          <div class="signup-header">
            <div class="signup-icon">
              <v-icon size="48" color="white">mdi-account-plus</v-icon>
            </div>
            <h1 class="signup-title font-heading">{{ title || 'Create Account' }}</h1>
            <p class="signup-subtitle">Join our community and start your journey</p>
          </div>

          <v-card class="signup-card" elevation="0">
            <v-card-text class="pa-8">
              <v-form v-model="valid" ref="signupForm">
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <v-text-field
                        label="First Name"
                        v-model="name"
                        prepend-inner-icon="mdi-account-outline"
                        :rules="nameRules"
                        variant="outlined"
                        density="comfortable"
                        class="form-field"
                        color="primary"
                        required
                      ></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <v-text-field
                        label="Last Name"
                        v-model="surname"
                        prepend-inner-icon="mdi-account-outline"
                        :rules="surnameRules"
                        variant="outlined"
                        density="comfortable"
                        class="form-field"
                        color="primary"
                        required
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>

                <div class="form-group">
                  <v-text-field
                    label="Username"
                    v-model="username"
                    prepend-inner-icon="mdi-at"
                    :rules="usernameRules"
                    variant="outlined"
                    density="comfortable"
                    class="form-field"
                    color="primary"
                    required
                  ></v-text-field>
                </div>

                <div class="form-group">
                  <v-text-field
                    label="Email Address"
                    v-model="email"
                    prepend-inner-icon="mdi-email-outline"
                    type="email"
                    :rules="emailRules"
                    variant="outlined"
                    density="comfortable"
                    class="form-field"
                    color="primary"
                    required
                  ></v-text-field>
                </div>

                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <v-text-field
                        label="Password"
                        v-model="password"
                        prepend-inner-icon="mdi-lock-outline"
                        :type="showPassword ? 'text' : 'password'"
                        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showPassword = !showPassword"
                        :rules="passwordRules"
                        variant="outlined"
                        density="comfortable"
                        class="form-field"
                        color="primary"
                        required
                      ></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <v-text-field
                        label="Confirm Password"
                        v-model="confirmPassword"
                        prepend-inner-icon="mdi-lock-check-outline"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword"
                        :rules="confirmPasswordRules"
                        variant="outlined"
                        density="comfortable"
                        class="form-field"
                        color="primary"
                        required
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>

                <div class="form-group">
                  <v-btn
                    variant="outlined"
                    color="primary"
                    class="address-btn"
                    prepend-icon="mdi-map-marker-outline"
                    @click="openMapDialog"
                    block
                  >
                    {{ address ? 'Address Selected ✓' : 'Select Address from Map' }}
                  </v-btn>
                  <AddressDialog ref="AddressDialog" @address-selected="updateAddress"/>
                  <v-text-field
                    v-model="address"
                    :rules="addressRules"
                    style="display: none;"
                  ></v-text-field>
                </div>

                <v-alert 
                  v-if="errorMessage" 
                  type="error" 
                  variant="tonal"
                  class="mb-4 error-alert"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </v-alert>
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-8 pt-0">
              <div class="actions-container">
                <v-btn 
                  variant="elevated" 
                  size="large"
                  color="primary" 
                  class="signup-btn"
                  @click="signUp" 
                  :disabled="!valid || loading"
                  :loading="loading"
                  block
                >
                  Create Account
                </v-btn>
                
                <div class="login-link">
                  <span>Already have an account?</span>
                  <v-btn variant="text" color="primary" to="/login" class="login-link-btn">
                    Sign In
                  </v-btn>
                </div>
              </div>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" color="success" class="success-snackbar">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        {{ snackbarMessage }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';
import AddressDialog from '@/components/AddressDialog.vue';

export default {
  components: {
    AddressDialog
  },
  computed: {
    store() {
      return store;
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      showPassword: false,
      showConfirmPassword: false,
      snackbar: false,
      snackbarMessage: '',
      snackbarTimeout: 2500,
      title: '',
      name: '',
      nameRules: [
        v => !!v || 'First name is required',
        v => (v && v.length >= 2) || 'First name must be at least 2 characters',
      ],
      surname: '',
      surnameRules: [
        v => !!v || 'Last name is required',
        v => (v && v.length >= 2) || 'Last name must be at least 2 characters',
      ],
      username: '',
      usernameRules: [
        v => !!v || 'Username is required',
        v => (v && v.length >= 6) || 'Username must be at least 6 characters',
        v => /^[a-zA-Z0-9_]+$/.test(v) || 'Username can only contain letters, numbers and underscores',
      ],
      email: '',
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
      password: '',
      passwordRules: [
        v => !!v || 'Password is required',
        v => (v && v.length >= 6) || 'Password must be at least 6 characters',
        v => /(?=.*[a-zA-Z])/.test(v) || 'Password must contain at least one letter',
      ],
      confirmPassword: '',
      confirmPasswordRules: [
        v => !!v || 'Please confirm your password',
        v => v === this.password || 'Passwords must match',
      ],
      address: null,
      addressRules: [
        v => !!v || 'Address is required',
      ],
      errorMessage: ''
    };
  },
  mounted() {
    if (store.role === 'admin') {
      this.title = 'Admin Registration';
    }
  },
  methods: {
    async signUp() {
      if (!this.valid) {
        return;
      }

      this.loading = true;
      this.errorMessage = '';

      try {
        let endpoint = '/user/register';
        if(store.role === 'admin') {
          endpoint = '/user/register/admin';
        }

        const response = await axios.post(endpoint, {
          name: this.name,
          surname: this.surname,
          username: this.username,
          email: this.email,
          password: this.password,
          address: this.address
        });
        
        this.snackbarMessage = 'Account successfully created! Confirmation email sent.';
        this.snackbar = true;
        this.resetForm();
        
        setTimeout(() => {
          this.$router.push("/login");
        }, this.snackbarTimeout);
        
      } catch (error) {
        this.errorMessage = error.response?.data?.errors?.[0]?.message || 'Registration failed. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.name = '';
      this.surname = '';
      this.username = '';
      this.email = '';
      this.password = '';
      this.confirmPassword = '';
      this.address = '';
      this.errorMessage = '';
      this.valid = false;
    },
    openMapDialog() {
      this.$refs.AddressDialog.dialog = true;
    },
    updateAddress(address) {
      this.address = address;
    }
  }
};
</script>

<style scoped>
.signup-container {
  background: var(--warm-bg);
  min-height: 100vh;
  padding: 0 !important;
  
  /* Background pattern */
  background-image: 
    radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(212, 115, 10, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.02) 0%, transparent 50%);
}

.min-height-screen {
  min-height: 100vh;
  padding: 24px 0;
}

.signup-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.signup-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px 0;
  background: var(--warm-gradient);
  border-radius: 24px 24px 0 0;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="rgba(255,255,255,0.05)" fill-opacity="0.4"><circle cx="30" cy="30" r="2"/></g></svg>') repeat;
    opacity: 0.3;
  }
}

.signup-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.signup-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.signup-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.signup-card {
  border-radius: 0 0 24px 24px !important;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-top: none !important;
}

.form-group {
  margin-bottom: 20px;
}

.form-field {
  :deep(.v-field) {
    border-radius: 16px !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.06) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(212, 115, 10, 0.1) !important;
    }
  }
  
  :deep(.v-field--focused) {
    box-shadow: 0 4px 20px rgba(212, 115, 10, 0.15) !important;
  }
  
  :deep(.v-field__outline) {
    --v-field-border-opacity: 0.3;
  }
  
  :deep(.v-field--focused .v-field__outline) {
    --v-field-border-opacity: 1;
  }
  
  :deep(.v-field__input) {
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  
  :deep(.v-field__prepend-inner) {
    .v-icon {
      color: var(--warm-orange) !important;
      opacity: 0.8;
    }
  }
  
  :deep(.v-field__append-inner) {
    .v-icon {
      color: var(--warm-orange) !important;
      opacity: 0.6;
      cursor: pointer;
      transition: opacity 0.2s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

.address-btn {
  border-radius: 16px !important;
  height: 56px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border-width: 2px !important;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(212, 115, 10, 0.15) !important;
  }
}

.error-alert {
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.15) !important;
  
  :deep(.v-alert__content) {
    font-weight: 500;
  }
}

.actions-container {
  width: 100%;
}

.signup-btn {
  border-radius: 16px !important;
  height: 56px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 16px rgba(212, 115, 10, 0.15) !important;
  margin-bottom: 16px !important;
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(212, 115, 10, 0.25) !important;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6 !important;
    transform: none !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.1) !important;
  }
}

.login-link {
  text-align: center;
  color: rgba(28, 25, 23, 0.7);
  font-size: 0.95rem;
  
  span {
    margin-right: 8px;
  }
}

.login-link-btn {
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
  padding: 0 8px !important;
  min-width: auto !important;
  height: auto !important;
  
  :deep(.v-btn__content) {
    text-decoration: underline;
  }
}

.success-snackbar {
  :deep(.v-snackbar__wrapper) {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3) !important;
  }
  
  :deep(.v-snackbar__content) {
    font-weight: 600;
    letter-spacing: 0.3px;
  }
}

/* Media queries */
@media (max-width: 960px) {
  .signup-container {
    padding: 16px !important;
  }
  
  .min-height-screen {
    padding: 16px 0;
  }
  
  .signup-wrapper {
    max-width: 100%;
  }
  
  .signup-header {
    padding: 24px 16px;
    margin-bottom: 0;
    border-radius: 16px 16px 0 0;
  }
  
  .signup-title {
    font-size: 1.6rem;
  }
  
  .signup-subtitle {
    font-size: 1rem;
  }
  
  .signup-card {
    border-radius: 0 0 16px 16px !important;
  }
  
  :deep(.v-card-text) {
    padding: 24px !important;
  }
  
  :deep(.v-card-actions) {
    padding: 24px !important;
    padding-top: 0 !important;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .signup-btn {
    height: 48px !important;
    font-size: 0.95rem !important;
  }
  
  .address-btn {
    height: 48px !important;
    font-size: 0.95rem !important;
  }
}

@media (max-width: 600px) {
  .signup-icon {
    width: 64px;
    height: 64px;
    
    .v-icon {
      font-size: 36px !important;
    }
  }
  
  .signup-title {
    font-size: 1.4rem;
  }
  
  .signup-subtitle {
    font-size: 0.9rem;
  }
  
  .login-link {
    font-size: 0.9rem;
  }
}

/* Loading states */
.signup-btn {
  :deep(.v-btn__loader) {
    color: white !important;
  }
}

/* Focus states */
.signup-btn:focus-visible,
.address-btn:focus-visible {
  outline: 2px solid var(--warm-amber) !important;
  outline-offset: 2px !important;
}
</style>