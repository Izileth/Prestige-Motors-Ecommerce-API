const {register} = require('./register')
const {login} = require('./login')
const {logout} = require('./logout')

const {forgotPassword, validateAndFormatFromField, debugEmailFrom} = require('./forgoutPassword')
const {resetPassword, invalidateUserResetTokens} = require('./resetPassword')


module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    validateAndFormatFromField,
    debugEmailFrom,
    invalidateUserResetTokens
}
