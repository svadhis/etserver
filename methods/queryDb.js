const MongoClient = require("mongodb").MongoClient

// "mongodb://localhost:27017"
module.exports = query => MongoClient.connect("mongodb+srv://g3k:6VSa7J6pTCsNEfyC@cluster0-jge1t.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true }, function(error, client) {
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