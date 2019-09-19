const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const port = process.env.PORT || 4001
const index = require("./routes/index")
const socketListener = require("./mapper/listener")
const app = express()
app.use(index)
const server = http.createServer(app)
const io = socketIo(server)

const MongoClient = require("mongodb").MongoClient

// "mongodb://localhost:27017"
MongoClient.connect("mongodb+srv://g3k:6VSa7J6pTCsNEfyC@cluster0-jge1t.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true })
.then(client => socketListener(io, client.db('game-3000')))

server.listen(port, () => console.log(`Listening on port ${port}`))
