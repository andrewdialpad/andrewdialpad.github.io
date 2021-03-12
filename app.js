import DialpadClient from './dialpad_client'

const client = new DialpadClient()
client.init().then(response => {
  client.init().then(response => {
    client.getCurrentUser().then((response) => {
      console.log(response)
    })
  })
})
