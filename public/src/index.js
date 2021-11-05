import './tailwind.css'; // import tailwind so that it gets bundled by vite

// import **any file or dependency (module)** that you want to bundle here

import API from './api';

// regular javascript goes below

let api

window.testApi = async () => {
  if (api.connected) {
    await api.command1({
      some: `test payload`,
    })
  } else {
    console.warn(`Not yet connected to server!`)
  }
}

window.onload = function() {

  let host
  if (new URL(document.location).protocol === `https`) {
    host = location.origin.replace(/^https/, 'wss')
  } else {
    host = location.origin.replace(/^http/, 'ws')
  }
  if (import.meta.env.DEV) {
    let hostUrl = new URL(host)
    hostUrl.port = 73
    host = hostUrl.toString()
  }
  
  api = new API(host)
  api.connectToServer().catch(err => {
    console.error(`Error while connecting to backend:`, err)
  })
  
  api.on(`command1Response`, handleCommand1Response)
  api.on(`command1Info`, handleCommand1Info)
  api.on(`command1Error`, handleCommand1Error)

}

function handleCommand1Response(payload) {

}

function handleCommand1Info(payload) {
  
}

function handleCommand1Error(payload) {

}

setInterval(() => {
  fetch(`/keepalive`)
}, 1000*60*5)


// !! IMPORTANT: !!
// Vite doesn't automatically assing global variables to the window context when importing the bundle
// Assign all variables, functions and classes, that you want to be accessible from html, to the window context

