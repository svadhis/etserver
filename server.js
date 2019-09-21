const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const port = process.env.PORT || 4001
const db = require("./database/config/db")
const index = require("./routes/index")
const socketListener = require("./mapper/listener")
const app = express()
app.use(index)
const server = http.createServer(app)
const io = socketIo(server)

const MongoClient = require("mongodb").MongoClient

MongoClient.connect(db.uri, { useNewUrlParser: true })
.then(client => socketListener(io, client.db(db.name)))

server.listen(port, () => console.log(`Listening on port ${port}`))
