<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container>
        <v-row align="center" justify="center" class="min-height-70vh">
          <v-col cols="12" md="8" lg="6" class="text-center">
            <div class="hero-content animate-fade-in">
              <div class="hero-icon">
                <v-icon size="80" color="white">mdi-airplane</v-icon>
              </div>
              <h1 class="hero-title font-heading">
                Welcome to Tourist Agency
              </h1>
              <p class="hero-subtitle">
                Your gateway to unforgettable adventures. Discover the world with our premium travel services and 24/7 customer support.
              </p>
              <div class="hero-actions">
                <v-btn
                  size="large"
                  color="white"
                  variant="elevated"
                  class="hero-btn primary-btn"
                  prepend-icon="mdi-compass-outline"
                  to="/my/destinations"
                >
                  Explore Destinations
                </v-btn>
                <v-btn
                  size="large"
                  variant="outlined"
                  class="hero-btn secondary-btn"
                  prepend-icon="mdi-account-plus"
                  to="/signup"
                >
                  Join Us Today
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <v-container>
        <div class="section-header">
          <h2 class="section-title font-heading">Why Choose Us?</h2>
          <p class="section-subtitle">Experience the difference with our world-class services</p>
        </div>
        
        <v-row class="features-grid">
          <v-col v-for="(feature, index) in features" :key="index" cols="12" sm="6" md="4">
            <v-card class="feature-card" elevation="0" :style="{ animationDelay: `${index * 0.1}s` }">
              <v-card-text class="text-center pa-8">
                <div class="feature-icon">
                  <v-icon size="48" :color="feature.color">{{ feature.icon }}</v-icon>
                </div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Support Section -->
    <section class="support-section">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="support-content">
              <h2 class="section-title font-heading text-white">
                Need Help?
              </h2>
              <p class="section-subtitle text-white mb-6">
                Our dedicated support team is here to assist you 24/7. Create a support ticket and get personalized help for all your travel needs.
              </p>
              <v-btn
                size="large"
                color="white"
                variant="elevated"
                class="support-btn"
                prepend-icon="mdi-headset"
                to="/my/tickets"
              >
                Get Support
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6" class="text-center">
            <div class="support-graphic">
              <v-icon size="200" color="rgba(255,255,255,0.2)">mdi-customer-service</v-icon>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const features = ref([
  {
    icon: 'mdi-earth',
    color: '#D4730A',
    title: 'Global Destinations',
    description: 'Explore amazing destinations across the globe with our carefully curated travel packages.'
  },
  {
    icon: 'mdi-shield-check',
    color: '#16A34A',
    title: 'Secure Booking',
    description: 'Book with confidence using our secure payment system and comprehensive travel insurance.'
  },
  {
    icon: 'mdi-clock-outline',
    color: '#3B82F6',
    title: '24/7 Support',
    description: 'Get round-the-clock assistance from our experienced travel specialists whenever you need help.'
  },
  {
    icon: 'mdi-star',
    color: '#F59E0B',
    title: 'Premium Service',
    description: 'Enjoy exceptional service quality with personalized attention to every detail of your journey.'
  },
  {
    icon: 'mdi-wallet',
    color: '#10B981',
    title: 'Best Prices',
    description: 'Get the most competitive prices with our exclusive deals and special offers for members.'
  },
  {
    icon: 'mdi-airplane-takeoff',
    color: '#8B5CF6',
    title: 'Easy Travel',
    description: 'Seamless travel experience from planning to return with our comprehensive travel management.'
  }
])
</script>

<style scoped>
.home-view {
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  background: var(--warm-gradient);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="rgba(255,255,255,0.05)"><circle cx="30" cy="30" r="2"/></g></svg>') repeat;
    opacity: 0.3;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, var(--warm-bg), transparent);
  }
}

.min-height-70vh {
  min-height: 70vh;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-icon {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  /* animation: gentleBounce 3s ease-in-out infinite; Removed for better UX */
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 24px;
  letter-spacing: 0.5px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn {
  border-radius: var(--border-radius-md) !important;
  padding: 0 32px !important;
  height: 56px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  /* &:hover { transform: translateY(-3px); } - uklonjeno za bolje UX */
}

.primary-btn {
  color: var(--warm-orange) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  
  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
  }
}

.secondary-btn {
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  color: white !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1) !important;
  }
}

/* Features Section */
.features-section {
  padding: 80px 0;
  background: var(--warm-bg);
  position: relative;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--warm-brown);
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: rgba(28, 25, 23, 0.7);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.features-grid {
  margin-top: 32px;
}

.feature-card {
  border-radius: var(--border-radius-lg) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  height: 100%;
  animation: fadeInUp 0.6s ease-out both;
  
  &:hover {
    /* transform: translateY(-8px) - uklonjeno za bolje UX */
    box-shadow: var(--warm-shadow-lg) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
  }
}

.feature-icon {
  background: rgba(245, 158, 11, 0.1);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  background: rgba(245, 158, 11, 0.15);
  /* transform: scale(1.1); - uklonjeno za bolje UX */
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--warm-brown);
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}

.feature-description {
  color: rgba(28, 25, 23, 0.8);
  line-height: 1.6;
  margin: 0;
}

/* Support Section */
.support-section {
  padding: 80px 0;
  background: var(--warm-gradient);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="rgba(255,255,255,0.03)"><circle cx="20" cy="20" r="1.5"/></g></svg>') repeat;
    opacity: 0.4;
  }
}

.support-content {
  position: relative;
  z-index: 1;
}

.support-btn {
  color: var(--warm-orange) !important;
  border-radius: var(--border-radius-md) !important;
  padding: 0 32px !important;
  height: 56px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    /* transform: translateY(-3px) - uklonjeno za bolje UX */
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
  }
}

.support-graphic {
  position: relative;
  
  .v-icon {
    /* animation: gentleBounce 4s ease-in-out infinite; Removed for better UX */
    animation-delay: 1s;
  }
}

/* Responsive Design */
@media (max-width: 960px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .features-section, .support-section {
    padding: 60px 0;
  }
}

@media (max-width: 600px) {
  .hero-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
    
    .v-icon {
      font-size: 60px !important;
    }
  }
  
  .hero-title {
    font-size: 2rem;
    margin-bottom: 16px;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 32px;
  }
  
  .hero-btn {
    height: 48px !important;
    font-size: 0.95rem !important;
  }
  
  .section-title {
    font-size: 1.75rem;
  }
  
  .feature-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    
    .v-icon {
      font-size: 36px !important;
    }
  }
  
  :deep(.v-card-text) {
    padding: 24px !important;
  }
}

/* Animations */
@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-5px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-3px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 
