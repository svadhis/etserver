const queryDb = (db, query) => {
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
}

module.exports = queryDb