<template>
    <v-container>
        <v-row> 
            <v-col cols="12"><h2>Operator – kontrolna tabla</h2></v-col>
            <v-col cols="12" md="3"><v-card class="pa-4" to="/op/arrangements" title="Aranžmani" subtitle="Lista i novi" /></v-col>
            <v-col cols="12" md="3">
                <v-card class="pa-4" to="/op/inquiries" title="Pošalji upit" subtitle="Destinacija + datumi" />
            </v-col>          
              <v-col cols="12" md="3">
                <v-card class="pa-4" to="/op/inquiries/list" title="Moji upiti" subtitle="Pregled & ponude" />
            </v-col>
            <v-col cols="12" md="3"><v-card class="pa-4" to="/op/destinations" title="Destinacije" /></v-col>
            
            <v-col cols="12" md="3"><v-card class="pa-4" to="/analytics" title="Analitika" /></v-col>
        </v-row>
    </v-container>
</template>