<template>
  <v-container class="login-container">
    <v-row justify="center" align="center" class="min-height-screen">
      <v-col lg="5" md="6" sm="8" cols="12">
        <div class="login-wrapper animate-fade-in">
          <!-- Header with gradient -->
          <div class="login-header">
            <div class="login-icon">
              <v-icon size="48" color="white">mdi-account-circle</v-icon>
            </div>
            <h1 class="login-title font-heading">Welcome Back</h1>
            <p class="login-subtitle">Sign in to your account</p>
          </div>

          <v-card class="login-card" elevation="0">
            <v-card-text class="pa-8">
              <v-form v-model="valid" ref="loginForm">
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
                  variant="outlined" 
                  size="large"
                  color="primary"
                  class="signup-btn"
                  @click="signUp"
                  :disabled="loading"
                >
                  Create Account
                </v-btn>
                
                <v-btn 
                  variant="elevated" 
                  size="large"
                  color="primary" 
                  class="login-btn"
                  @click="login" 
                  :disabled="!valid || loading"
                  :loading="loading"
                >
                  Sign In
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';

export default {
  data() {
    return {
      valid: false,
      loading: false,
      showPassword: false,
      email: '',
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
      password: '',
      passwordRules: [
        v => !!v || 'Password is required',
        v => (v && v.length >= 1) || 'Password must be at least 1 character',
      ],
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      if (!this.valid) {
        return;
      }

      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await axios.post('/user/login', {
          email: this.email,
          password: this.password
        });
        
        store.setUser({
          username: response.data.username,
          role: response.data.role
        });
        
        this.$router.push("/");
      } catch (error) {
        this.errorMessage = error.response?.data?.errors?.[0]?.message || 'Login failed. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    signUp() {
      this.$router.push("/signup");
    }
  }
};
</script>

<style scoped>
.login-container {
  background: var(--warm-bg);
  min-height: 100vh;
  padding: 0 !important;
  
  /* Background pattern */
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(212, 115, 10, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(251, 191, 36, 0.03) 0%, transparent 50%);
}

.min-height-screen {
  min-height: 100vh;
}

.login-wrapper {
  max-width: 450px;
  margin: 0 auto;
}

.login-header {
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

.login-icon {
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

.login-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.login-card {
  border-radius: 0 0 24px 24px !important;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-top: none !important;
}

.form-group {
  margin-bottom: 24px;
}

.form-field {
  :deep(.v-field) {
    border-radius: 16px !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.08) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(212, 115, 10, 0.12) !important;
    }
  }
  
  :deep(.v-field--focused) {
    box-shadow: 0 4px 20px rgba(212, 115, 10, 0.2) !important;
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

.error-alert {
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.15) !important;
  
  :deep(.v-alert__content) {
    font-weight: 500;
  }
}

.actions-container {
  display: flex;
  gap: 16px;
  width: 100%;
  flex-direction: column;
}

.signup-btn, .login-btn {
  border-radius: 16px !important;
  height: 56px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 16px rgba(212, 115, 10, 0.15) !important;
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(212, 115, 10, 0.25) !important;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.signup-btn {
  order: 2;
  
  &:hover:not(:disabled) {
    background: rgba(212, 115, 10, 0.04) !important;
  }
}

.login-btn {
  order: 1;
  
  &:disabled {
    opacity: 0.6 !important;
    transform: none !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.1) !important;
  }
}

/* Media queries */
@media (max-width: 960px) {
  .login-container {
    padding: 16px !important;
  }
  
  .login-wrapper {
    max-width: 100%;
  }
  
  .login-header {
    padding: 24px 16px;
    margin-bottom: 0;
    border-radius: 16px 16px 0 0;
  }
  
  .login-title {
    font-size: 1.6rem;
  }
  
  .login-subtitle {
    font-size: 1rem;
  }
  
  .login-card {
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
    margin-bottom: 20px;
  }
  
  .actions-container {
    gap: 12px;
  }
  
  .signup-btn, .login-btn {
    height: 48px !important;
    font-size: 0.95rem !important;
  }
}

@media (max-width: 600px) {
  .login-icon {
    width: 64px;
    height: 64px;
    
    .v-icon {
      font-size: 36px !important;
    }
  }
  
  .login-title {
    font-size: 1.4rem;
  }
  
  .login-subtitle {
    font-size: 0.9rem;
  }
}

/* Loading states */
.login-btn {
  :deep(.v-btn__loader) {
    color: white !important;
  }
}

/* Focus states */
.signup-btn:focus-visible,
.login-btn:focus-visible {
  outline: 2px solid var(--warm-amber) !important;
  outline-offset: 2px !important;
}
</style>