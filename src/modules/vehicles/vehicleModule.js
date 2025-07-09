const {getVehiclesByVendor} = require('./getVehicleByVendor')

const {createVehicle} = require('./createVehicle')
const {updateVehicle} = require('./updateVehicle')
const {deleteVehicle} = require('./deleteVehicle')

const {getVehicleFavorites} = require('./getVehicleFavorites')
const {addFavoriteVehicle} = require('./addFavoriteVehicle')
const {removeFavoriteVehicle} = require('./deleteFavoirteVehicle')
const {getVehicleById} = require('./getVehicleById')
const {getVehicleDetails} = require('./getVehicleDetails')
const {getUserVehicleStats} = require('./getUserVehicleStats')
const {getUserVehicles} = require('./getUserVehicles')
const {getUserFavorites} = require('./getUserFavorites')


const {getVehicleStats} = require('./getVehicleStats')
const {getVehicles} = require('./getVehicles')

const {updateVehicleStatus} = require('./updateVehicleStatus')

const {getVehicleAddress} = require('./getVehicleAddress')
const {addOrUpdateVehicleAddress} = require('./createVehicleAdress')
const {removeVehicleAddress} = require('./deleteVehicleAdress')

module.exports = {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicles,
    getVehicleById,
    getVehicleDetails,
    getVehicleFavorites,
    addFavoriteVehicle,
    removeFavoriteVehicle,
    getVehiclesByVendor,
    getUserFavorites,
    getUserVehicleStats,
    getUserVehicles,
    updateVehicleStatus,
    getVehicleStats,
    getVehicleAddress,
    addOrUpdateVehicleAddress,
    removeVehicleAddress
}
