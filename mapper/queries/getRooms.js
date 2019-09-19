const queryDb = require('../../methods/queryDb')

const getRooms = db => {
    return new Promise((resolve) => {
        queryDb(db, {
            collection: 'rooms',
            type: 'find',
            filter: {
                status: { $ne: 'closed' }
            },
            callback: rooms => {
                let output =  {}
                rooms.forEach(room => {
                    output[room.number] = room
                })
                resolve(output)
            }
        })
    })
   
}

module.exports = getRooms