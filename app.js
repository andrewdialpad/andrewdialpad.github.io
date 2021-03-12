import DialpadClient from './dialpad_client.js'

const client = new DialpadClient({env: 'sandbox'})
client.init().then(response => {
  client.getCurrentContact().then(response => {
    document.getElementById('contact').innerText = response.first_name || response.primary_phone
  })
  client.getCurrentUser().then(response => {
    document.getElementById('name').innerText = response.first_name
  })
})
