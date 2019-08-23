const orders = require("../mapper/orders")
const dispatch = require("./dispatch")
const sendAction = require("./sendAction")

const setState = (order, socket, io) => {

    dispatch(order)



    orders(socket, order.data)[order.type].forEach(unit => {
        dispatch(unit)
    })
    setTimeout(() => {
        sendAction('updateLocalState', io, order.data.number || order.data.room.number)
    }, 300);
    
}

module.exports = setState