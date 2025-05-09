const {uploadVehicleImages, uploadVehicleVideos} = require('./midia/uploadMidia')
const {deleteVehicleImage} = require('./midia/deleteMidia')

module.exports = {
    uploadVehicleImages,
    deleteVehicleImage,
    uploadVehicleVideos
}
