const ObjectId = require("mongodb").ObjectID;
const queryDb = require('./queryDb')

const dispatch = unit => {

    


    const collection = database.collection(unit.collection)
    unit.documents.forEach(document => {
        switch (unit.method) {
            case 'insert':
                collection.insertOne (document.data)
                break
        
            case 'update-room':
                collection.findOne({number: document.number})
                .then(res => {
                    collection.updateOne (
                        {number: document.number},
                        {$set: {
                            view: document.data.view || res.view,
                            status: document.data.status || res.status,
                            players: document.data.players ? [...res.players, ...document.data.players] : res.players
                        }}
                    )
                })
                .catch(error => {
                    console.log(error)
                })
                break
                
            case 'update-player':
                collection.findOne({number: document.number})
                .then(res => {
                    collection.updateOne (
                        {number: document.number},
                        {$set: {
                            name: document.data.name || res.name,
                            address: document.data.address || res.address
                        }}
                    )
                })
                .catch(error => {
                    console.log(error)
                })
                break

            case 'remove':
                collection.remove (
                    {number : document.number},
                )
                break
    
            default:
                break
        }
    })
}

module.exports = dispatch