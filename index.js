const http = require(`http`)

require(`dotenv`).config()
const betterLogging = require(`better-logging`)
betterLogging(console, {
  messageConstructionStrategy: betterLogging.MessageConstructionStrategy.FIRST,
})
console.logLevel = process.env.environment === `development` ? 4 : 2
const Koa = require(`koa`)
const cors = require(`@koa/cors`)
const static = require('koa-static')
const compress = require('koa-compress')
const bodyParser = require(`koa-bodyparser`)

const GuiConnection = require(`./gui-connection`)
const mount = require('koa-mount')

const app = new Koa()
app.use(cors())

// for Heroku, etc. to prevent spindown
app.use(async (context, next) => {
  if (context.method === `GET` && context.path === `/keepalive`) {
    context.status = 201
    context.body = `...for the people who are still alive`
  }
  await next() // ALWAYS use `await` with next, to wait for other middlewares before sending the response
})

const staticServer = new Koa()
staticServer.use(static(`./public/dist`));
app.use(mount(`/`, staticServer));

app.use(compress({
  br: {
    params: {
      [require(`zlib`).constants.BROTLI_PARAM_QUALITY]: 5
    }
  },
}))
app.use(bodyParser())

let server = http.createServer(app.callback())
server.listen(process.env.PORT)

const clients = new GuiConnection(server)

clients.on(`command`, commandHandler)

async function commandHandler(socketId, command) {

  /**
   * Signals the completion of a command
   * @returns An object containing all the necessary info needed in order for the client to handle the data. Needs to be sent through `GuiConnection.send()`.
   */
  let end = () => {
    return {
      type: `end`,
      value: [
        command[0],
      ]
    }
  }
  
  /**
   * Sends a response to a command to the client.  
   * Can be used multiple times, until `end()` is sent.
   * @param {*} payload The payload to send to the client. The client needs to be able to explicitly handle it
   * @returns An object containing all the necessary info needed in order for the client to handle the data. Needs to be sent through `GuiConnection.send()`.
   */
  let response = (payload) => {
    return {
      type: `response`,
      value: [
        command[0],
        payload,
      ]
    }
  }
  
  /**
   * Sends additional data to the client, that isn't a full response.  
   * *Example: logs, status reports, progress info, etc.*
   * @param {*} payload The payload to send to the client. The client needs to be able to explicitly handle it.
   * @returns An object containing all the necessary info needed in order for the client to handle the data. Needs to be sent through `GuiConnection.send()`.
   */
  let info = (payload) => {
    return {
      type: `info`,
      value: [
        command[0],
        payload,
      ]
    }
  }

  /**
   * Sends an error to the client, indicating that there was a problem while running the command.  
   * The error **doesn't have to be fatal**, the command will stay active until `end()` is sent.
   * @param {String} reason The cause of the error.
   * @param {*} additionalPayload Any additional payload to send to the client
   * @returns An object containing all the necessary info needed in order for the client to handle the data. Needs to be sent through `GuiConnection.send()`.
   */
  let error = (reason, additionalPayload = null) => {
    let errorObject = {
      type: `error`,
      value: [
        command[0],
        reason,
      ]
    }

    if (additionalPayload) {
      errorObject.value.push(additionalPayload)
    }

    return errorObject
    
  }

  switch (command[0]) {
    case `command1`:
      try {

        let payload = command[1]
        
        console.info(`Client '${socketId}', command '${command[0]}', payload`, payload)
        
        clients.send(socketId, response({
          some: `data`,
        }))

        clients.send(socketId, info({
          some: `data`,
        }))

      } catch (err) {

        clients.send(socketId, error(`An error occurred!`, {
          some: `data`,
        }))
        clients.send(socketId, end())
        return;
        
      }
        
      clients.send(socketId, response({}))
      clients.send(socketId, end())

      break;
  
    default:
      break;
  }
  
}
