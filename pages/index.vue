<template>
  <v-row align="center" justify="center">
    <v-col md="6" sm="10">
      <p class="text-h3">
        Fuzer
        <small class="text-caption"
          >Please wait for cities to load (100k+)</small
        >
      </p>
      <v-text-field
        v-model="city"
        class="city-input"
        solo-inverted
        label="Enter City"
        clearable
        :loading="loading"
      ></v-text-field>

      <v-col v-if="results.length > 0" class="results-container">
        <p class="text-caption">
          Took {{ time }}ms to search across {{ total }} results
        </p>
        <ul class="results">
          <li v-for="(result, idx) in results" :key="result.word + idx">
            <small class="rank">{{ result.rank }}</small>
            <span v-html="highlight(result.word, result.matches)"></span>
          </li>
        </ul>
      </v-col>
    </v-col>
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      worker: null,
      city: null,
      results: [],
      time: 0,
      total: 0,
      loading: false,
    }
  },
  watch: {
    async city(val) {
      if (!val.length) {
        this.results = []
        this.time = 0
        this.total = 0
        return
      }

      this.loading = true
      const response = await this.waitForMethod(this.worker, 'search', {
        pattern: val,
        numRecords: 10,
      })

      this.results = response.results
      this.time = response.time
      this.total = response.total
      this.loading = false
    },
  },

  mounted() {
    this.loadData()
  },

  methods: {
    highlight(word, indexes) {
      let result = ''
      let ptr = 0
      for (let i = 0; i < word.length; i++) {
        if (indexes[ptr] === i) {
          result += `<b>${word[i]}</b>`
          ptr++
        } else {
          result += word[i]
        }
      }

      return result
    },

    waitForMethod(worker, eventType, eventData) {
      return new Promise((resolve, reject) => {
        worker.onmessage = function (event) {
          const { eventData, eventType: type } = event.data

          switch (type) {
            case 'error':
              reject(eventData)
              break
            case eventType:
              resolve(eventData)
              break
          }

          delete worker.onmessage
        }

        worker.postMessage({
          eventType,
          eventData,
        })
      })
    },
    async loadData() {
      this.loading = true
      this.worker = new Worker('/worker.js')
      await this.waitForMethod(this.worker, 'loadLibrary', '/fuzer.wasm')
      await this.waitForMethod(
        this.worker,
        'loadData',
        'https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json'
      )

      this.loading = false
    },
  },
}
</script>

<style scoped>
.city-input {
  z-index: 2;
}

.rank {
  color: var(--v-primary-base);
  width: 40px;
  display: inline-block;
}

.results-container {
  background: #fff;
  color: #444;
  margin: 0;
  margin-top: -30px;
  z-index: 1;
}

.results {
  list-style-type: none;
}
</style>
