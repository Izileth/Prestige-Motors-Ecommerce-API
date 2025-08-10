const {register, uploadAvatar} = require('./register')
const {login} = require('./login')
const {logout} = require('./logout')

const {forgotPassword, validateAndFormatFromField, debugEmailFrom} = require('./forgoutPassword')
const {resetPassword} = require('./resetPassword')


module.exports = {
    register,
    login,
    logout,
    uploadAvatar,
    forgotPassword,
    resetPassword,
    validateAndFormatFromField,
    debugEmailFrom
}
