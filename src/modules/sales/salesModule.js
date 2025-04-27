
const {getUserSalesHistory} = require('./get/user/getUserSalesHistory')
const {createSale} = require('./create/createSale')
const {getSaleById} = require('./get/[id]/getSalesById')
const {updateSale} = require('./updte/updateSales')
const {getPurchasesByUser} = require('./get/buyers/getSalesByBuyers')
const {getSalesBySeller} = require('./get/selers/getSalersBySeller')

const {getSalesByVehicle} = require('./get/vehicle/getSalesByVehile')

module.exports = {
    createSale,
    updateSale,
    getSaleById,
    getPurchasesByUser,
    getSalesBySeller,
    getUserSalesHistory,
    getSalesByVehicle
}
