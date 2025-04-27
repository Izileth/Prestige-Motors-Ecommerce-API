
const {getUsers} = require('./get/user/getUsers')
const {getUserById} = require('./get/[id]/getUserById')
const {updateUser} =  require('./updte/updateUser')
const {deleteUser} = require('./delete/deleteUser')
const {getUserStats} = require('./get/stats/getUserStats')
const {getUserAddresses} = require('./get/adress/getUserAddress')

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserAddresses
}
