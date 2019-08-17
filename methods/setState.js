const orders = require("../mapper/orders")
const dispatch = require("./dispatch")
const sendAction = require("./sendAction")

const setState = (database, order, socket, io) => {
    orders(socket, order.data)[order.type].forEach(unit => {
        dispatch(database, unit)
    })
    setTimeout(() => {
        sendAction(database, 'updateLocalState', io, order.data.number || order.data.room.number)
    }, 300);
    
}

module.exports = setState