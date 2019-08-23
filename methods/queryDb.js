const MongoClient = require("mongodb").MongoClient

// Query database, args is an array of objects containing the data :
// collection, type of query, arg for the query (object), and callback function
const queryDb = args => MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function(error, client) {
    if (error) return error

    const db = client.db('etscope')
    args.forEach(query => {
        db.collection(query.collection)[query.type](query.filter, query.arg).then(query.callback)
    })
})

module.exports = queryDb