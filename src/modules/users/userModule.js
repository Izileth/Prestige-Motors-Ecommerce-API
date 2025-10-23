
const {getUsers} = require('./getUsers')
const {getUserById} = require('./getUserById')
const {updateUser} =  require('./updateUser')
const {deleteUser} = require('./deleteUser')
const {getUserStats} = require('./getUserStats')
const {getUserAddresses} = require('./getUserAddress')

const {deleteUserAvatar, uploadAvatar} = require('./getUserAvatar')
const {getUserBySlug} = require('./getUserBySlug')
const {updateUserSlug} = require('./updateUserSlug')

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserAddresses,
    uploadAvatar, 
    deleteUserAvatar,
    getUserBySlug,
    updateUserSlug
}
