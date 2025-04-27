const {getVehiclesByVendor} = require('./get/vendors/getVehicleByVendor')
const {createVehicle} = require('./create/createVehicle')
const {deleteVehicle} = require('./delete/deleteVehicle')

const {getVehicleFavorites} = require('./get/favorite/getVehicleFavorites')
const {addFavoriteVehicle} = require('./favorite/addFavoriteVehicle')
const {getVehicleById} = require('./get/[id]/getVehicleById')
const {getVehicleDetails} = require('./get/details/getVehicleDetails')
const {getUserVehicleStats} = require('./get/stats/getUserVehicleStats')
const {getUserVehicles} = require('./get/users/getUserVehicles')
const {getUserFavorites} = require('./get/users/favorites/getUserFavorites')


const {getVehicleStats} = require('./get/stats/getVehicleStats')
const {getVehicles} = require('./get/vehicles/getVehicles')

const {updateVehicleStatus} = require('./status/updte/updateVehicleStatus')

const {updateVehicle} = require('./updte/updateVehicle')

module.exports = {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicles,
    getVehicleById,
    getVehicleDetails,
    getVehicleFavorites,
    addFavoriteVehicle,
    getVehiclesByVendor,
    getUserFavorites,
    getUserVehicleStats,
    getUserVehicles,
    updateVehicleStatus,
    getVehicleStats,
}
