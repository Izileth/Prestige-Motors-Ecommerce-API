const {register, uploadAvatar} = require('./register/register')
const {login} = require('./login/login')
const {logout} = require('./logout/logout')

const {forgotPassword} = require('./forgout/forgoutPassword')
const {resetPassword} = require('./reset/resetPassword')

module.exports = {
    register,
    login,
    logout,
    uploadAvatar,
    forgotPassword,
    resetPassword,
}
