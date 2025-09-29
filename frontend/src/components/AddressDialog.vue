<template>
  <div>
    <v-dialog v-model="dialog" max-width="900px" :persistent="!addressSelected" class="address-dialog">
      <v-card class="warm-card">
        <v-card-title class="warm-card-title">
          <v-icon class="mr-3 warm-icon">mdi-map-marker</v-icon>
          Select your address
        </v-card-title>
        
        <v-card-text class="warm-card-content">
          <div class="map-container">
            <div id="map" class="map"></div>
          </div>
          
          <v-row class="coordinate-inputs mt-4">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="latitude"
                label="Latitude"
                readonly
                variant="outlined"
                density="comfortable"
                class="warm-input"
                prepend-inner-icon="mdi-latitude"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="longitude"
                label="Longitude"
                readonly
                variant="outlined"
                density="comfortable"
                class="warm-input"
                prepend-inner-icon="mdi-longitude"
              />
            </v-col>
          </v-row>
          
          <v-alert
            v-if="!addressSelected"
            type="info"
            variant="tonal"
            class="mt-3 warm-alert"
          >
            <v-icon slot="prepend">mdi-information</v-icon>
            Click on the map to select your address location
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="warm-card-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="elevated"
            :disabled="!addressSelected"
            @click="closeDialog"
            class="warm-btn warm-btn-primary"
          >
            <v-icon left>mdi-check</v-icon>
            Confirm Location
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import { defaultConfig } from '@/config/config';

export default {
  data() {
    return {
      dialog: false,
      map: null,
      vectorSource: null,
      latitude: '',
      longitude: '',
      addressSelected: false
    };
  },
  watch: {
    dialog(val) {
      if (val) {
        this.$nextTick(() => {
          this.initializeMap();
        });
      } else {
        this.destroyMap();
      }
    }
  },
  methods: {
    initializeMap() {
      if (!this.map) {
        this.vectorSource = new VectorSource();

        const vectorLayer = new VectorLayer({
          source: this.vectorSource,
          style: defaultConfig.userAddressMarkerStyle
        });

        this.map = new Map({
          target: 'map',
          layers: [
            new TileLayer({
              source: new OSM()
            }),
            vectorLayer
          ],
          view: new View({
            center: fromLonLat(defaultConfig.mapLocation),
            zoom: defaultConfig.mapZoom
          })
        });

        if (this.latitude && this.longitude) {
          const coordinates = fromLonLat([this.longitude, this.latitude]);
          this.addMarker(coordinates);
        }

        this.map.on('click', (event) => {
          const coordinates = toLonLat(event.coordinate);
          this.latitude = parseFloat(coordinates[1].toFixed(8));
          this.longitude = parseFloat(coordinates[0].toFixed(8));
          this.addressSelected = true;

          this.$emit('address-selected', {
            latitude: this.latitude,
            longitude: this.longitude
          });

          this.addMarker(event.coordinate);
        });
      }
    },
    destroyMap() {
      if (this.map) {
        this.map.setTarget(null);
        this.map = null;
        this.vectorSource = null;
      }
    },
    addMarker(coordinate) {
      this.vectorSource.clear();

      const marker = new Feature({
        geometry: new Point(coordinate)
      });

      this.vectorSource.addFeature(marker);
    },
    closeDialog() {
      this.dialog = false;
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/assets/styles/warm-theme.scss';

.address-dialog {
  .warm-card {
    background: linear-gradient(135deg, #FEF3E8 0%, #FDF7F0 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
    overflow: hidden;

    .warm-card-title {
      background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
      color: white;
      font-weight: 600;
      padding: 20px 24px;
      font-size: 1.2rem;

      .warm-icon {
        color: white;
        font-size: 1.4rem;
      }
    }

    .warm-card-content {
      padding: 24px;

      .map-container {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(212, 115, 10, 0.1);
        border: 2px solid #F59E0B;

        #map {
          width: 100%;
          height: 450px;
          position: relative;
        }
      }

      .coordinate-inputs {
        .warm-input {
          :deep(.v-field) {
            background: rgba(254, 243, 232, 0.8);
            border-radius: 12px;
            border: 1px solid rgba(212, 115, 10, 0.2);

            &:hover {
              border-color: var(--warm-primary);
              box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.1);
            }

            &.v-field--focused {
              border-color: var(--warm-primary);
              box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.15);
            }
          }

          :deep(.v-field__input) {
            color: var(--warm-text);
            font-weight: 500;
          }

          :deep(.v-field__prepend-inner) {
            .v-icon {
              color: var(--warm-primary);
            }
          }

          :deep(.v-label) {
            color: var(--warm-text-secondary);
            font-weight: 500;

            &.v-field-label--floating {
              color: var(--warm-primary);
            }
          }
        }
      }

      .warm-alert {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 12px;

        :deep(.v-alert__content) {
          color: var(--warm-text);
          font-weight: 500;
        }

        :deep(.v-icon) {
          color: var(--warm-secondary);
        }
      }
    }

    .warm-card-actions {
      padding: 16px 24px 24px;
      background: linear-gradient(180deg, transparent 0%, rgba(254, 243, 232, 0.3) 100%);

      .warm-btn {
        border-radius: 12px;
        font-weight: 600;
        text-transform: none;
        padding: 0 24px;
        height: 44px;

        &.warm-btn-primary {
          background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(212, 115, 10, 0.3);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(212, 115, 10, 0.4);
          }

          &:disabled {
            background: rgba(212, 115, 10, 0.3);
            color: rgba(255, 255, 255, 0.6);
            box-shadow: none;
          }
        }

        .v-icon {
          margin-right: 8px;
        }
      }
    }
  }
}

// OpenLayers map styling
:deep(.ol-control) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(212, 115, 10, 0.2);

  button {
    background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
    border: none;
    color: white;
    border-radius: 6px;

    &:hover {
      background: linear-gradient(135deg, var(--warm-secondary) 0%, var(--warm-primary) 100%);
    }
  }
}

:deep(.ol-attribution) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px 0 0 0;
  
  ul {
    color: var(--warm-text);
    font-size: 11px;
  }
}

:deep(.ol-zoom) {
  top: 16px;
  left: 16px;
}
</style>
