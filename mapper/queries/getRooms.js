const queryDb = require('../../methods/queryDb')

const getRooms = () => {
    return new Promise((resolve) => {
        queryDb({
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