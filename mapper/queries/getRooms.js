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
                resolve(rooms)
            }
        })
    })
   
}

module.exports = getRooms