const queryDb = require("./methods/queryDb")
const problems = require("./database/problems")

queryDb({
    collection: 'problems',
    type: 'insertMany',
    filter: problems,
    callback: () => {
        console.log('Successfully populated database')
        process.exit()
    }
})

