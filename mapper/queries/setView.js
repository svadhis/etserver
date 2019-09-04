const queryDb = require('../../methods/queryDb')
const sendState = require('../../methods/sendState')

const setView = (io, number, room) => {
    queryDb({
        collection: 'rooms',
        type: 'replaceOne',
        filter: {
            number: number
        },
        arg: room,
        callback: () => {
            sendState(io, number)
        }
    })
}

module.exports = setView