<template>
  <v-container>
    <v-row justify="center">
      <v-col lg="6">
        <v-card variant="text">
          <v-card-title class="headline">Login</v-card-title>
          <v-spacer />
          <v-card-text>
            <v-form v-model="valid">
              <v-text-field
                label="Email *"
                v-model="email"
                prepend-icon="mdi-email"
                type="email"
                :rules="emailRules"
                required
              />
              <br />
              <v-text-field
                label="Password *"
                v-model="password"
                prepend-icon="mdi-lock"
                type="password"
                :rules="passwordRules"
                required
              />
              <v-alert v-if="errorMessage" type="error" class="mt-2">
                {{ errorMessage }}
              </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="flat" @click="signUp">Sign Up</v-btn>
            <v-btn
              variant="elevated"
              color="primary"
              :disabled="!valid || loading"
              :loading="loading"
              @click="login"
            >
              Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';

export default {
  name: 'LoginView',
  data() {
    return {
      valid: false,
      loading: false,
      email: '',
      emailRules: [v => !!v || 'Email je obavezan'],
      password: '',
      passwordRules: [v => !!v || 'Lozinka je obavezna'],
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      if (!this.valid || this.loading) return;
      this.errorMessage = '';
      this.loading = true;

      try {
        const { data } = await axios.post('/user/login', {
          email: String(this.email || '').trim(),
          password: this.password
        });

        // Normalizuj rolu (fallback TRAVELER)
        const role = String(data?.role || 'TRAVELER').trim().toUpperCase();

        // Upis u store (podrži i varijantu bez setUser)
        if (typeof store.setUser === 'function') {
          store.setUser({
            username: data?.username || data?.email || '',
            role,
            token: data?.token
          });
        } else {
          store.username = data?.username || data?.email || '';
          store.role = role;
        }

        // Redirect po roli (TRAVELER -> /arrangements)
        if (role === 'TRAVELER') {
          this.$router.replace('/arrangements');
        } else if (role === 'OPERATOR') {
          this.$router.replace({ name: 'op-home' });
        } else if (role === 'SUPPLIER') {
          this.$router.replace({ name: 'sup-home' });
        } else if (role === 'MANAGER') {
          this.$router.replace({ name: 'mgr-home' });
        } else {
          // ADMIN ili default
          this.$router.replace({ name: 'Home' });
        }
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.[0]?.message ||
          'Login failed. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    signUp() {
      this.$router.push('/signup');
    }
  }
};
</script>

<style scoped>
.v-container { margin-top: 10vh; }
.v-card { padding: 3%; }
</style>
