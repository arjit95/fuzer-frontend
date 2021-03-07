self.importScripts('/wasm_exec.js')
self.importScripts('/fuzer.js')

let len = 0

async function loadData(url) {
  const cities = await (await fetch(url)).json()
  const instance = self.Fuzer.getInstance()
  const visited = new Set()

  for (const city of cities) {
    if (visited.has(city.name)) continue

    instance.add(city.name)
    visited.add(city.name)
  }

  len = cities.length

  self.postMessage({
    eventType: 'loadData',
  })
}

async function search({ pattern, numRecords }) {
  const start = Date.now()
  const results = await self.Fuzer.getInstance().search(pattern, numRecords)
  const end = Date.now() - start

  self.postMessage({
    eventType: 'search',
    eventData: {
      time: end,
      total: len,
      results: results.filter(({ rank }) => rank >= 0),
    },
  })
}

async function loadLibrary(modulePath) {
  await self.Fuzer.load(modulePath)

  self.postMessage({
    eventType: 'loadLibrary',
  })
}

const exports = {
  loadLibrary,
  loadData,
  search,
}

self.addEventListener('message', function (event) {
  const { eventType, eventData } = event.data
  if (!(eventType in exports)) {
    return self.postMessage({
      eventType: 'error',
      eventData: `Unknown method ${eventType}`,
    })
  }

  exports[eventType](eventData)
})
