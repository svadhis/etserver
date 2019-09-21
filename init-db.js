// Script to initialize and populate database

const db = require("./database/config/db")

const queryDb = require("./methods/queryDb")
const problems = require("./database/problems")

const MongoClient = require("mongodb").MongoClient

MongoClient.connect(db.uri, { useNewUrlParser: true })
.then(client => queryDb(client.db(db.name), {
    collection: 'problems',
    type: 'insertMany',
    filter: problems,
    callback: () => {
        console.log('Successfully populated database')
        process.exit()
    }
}))
