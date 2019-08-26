const MongoClient = require("mongodb").MongoClient

// Query database, args is an array of objects containing the data :
// collection, type of query, arg for the query (object), and callback function
const queryDb = queries => MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function(error, client) {
    if (error) return error

    const db = client.db('etscope')
    queries.forEach(query => {
        try {
            db.collection(query.collection)[query.type](query.filter, query.arg, query.options).then(query.callback)
        } catch (error) {
            console.log('ntm pd pd pd pd pd')
        }
        
    })
})

module.exports = queryDb