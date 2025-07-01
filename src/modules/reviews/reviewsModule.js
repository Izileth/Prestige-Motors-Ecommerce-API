const {createReview} = require('./createReview')
const {getVehicleReviews} = require('./getVehicleReview')
const {updateReview} = require('./updateReview')
const {deleteReview} = require('./deleteReview')

module.exports = {
    createReview,
    getVehicleReviews,
    updateReview,
    deleteReview
}
