import DialpadClient from './dialpad_client.js'

const client = new DialpadClient({env: 'sandbox'})
client.init().then(response => {
  client.getCurrentUser().then((response) => {
    console.log(response)
  })
})
