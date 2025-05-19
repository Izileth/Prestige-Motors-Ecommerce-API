
const {getUsers} = require('./getUsers')
const {getUserById} = require('./getUserById')
const {updateUser} =  require('./updateUser')
const {deleteUser} = require('./deleteUser')
const {getUserStats} = require('./getUserStats')
const {getUserAddresses} = require('./getUserAddress')

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserAddresses
}
