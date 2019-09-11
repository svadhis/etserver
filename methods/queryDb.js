const MongoClient = require("mongodb").MongoClient

const queryDb = query => MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function(error, client) {
    if (error) return error

    const db = client.db('game-3000')
    try {
        if (query.type === 'aggregate' || query.type === 'find') {
            db.collection(query.collection)[query.type](query.filter, query.arg, query.options).toArray().then(query.callback)
        }
        else {
            db.collection(query.collection)[query.type](query.filter, query.arg, query.options).then(query.callback)
        }
    } catch (error) {
        console.log(error)
    }
})

module.exports = queryDb