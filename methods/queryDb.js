const MongoClient = require("mongodb").MongoClient

// Query database, args is an array of objects containing the data :
// collection, type of query, arg for the query (object), and callback function
const queryDb = query => MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function(error, client) {
    if (error) return error

    const db = client.db('etscope')
    try {
        if (query.type === 'aggregate') {
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