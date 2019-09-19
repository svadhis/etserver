const queryDb = require("./methods/queryDb")
const problems = require("./database/problems")

const MongoClient = require("mongodb").MongoClient

// "mongodb://localhost:27017"
MongoClient.connect("mongodb+srv://g3k:6VSa7J6pTCsNEfyC@cluster0-jge1t.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true })
.then(client => queryDb(client.db('game-3000')), {
    collection: 'problems',
    type: 'insertMany',
    filter: problems,
    callback: () => {
        console.log('Successfully populated database')
        process.exit()
    }})
