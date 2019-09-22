// Set db here, either using environment varialbes or editing the strings

const db = {
    uri: process.env.DB_URI || 'mongodb+srv://{DB_USER}:{USER_PASSWORD}@{DB_ADDRESS}/test?retryWrites=true&w=majority',
    name: process.env.DB_NAME || '{DB_NAME}'
}

module.exports = db
