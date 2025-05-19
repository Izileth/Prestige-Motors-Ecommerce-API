
const {getUserSalesHistory} = require('./getUserSalesHistory')
const {createSale} = require('./createSale')
const {getSaleById} = require('./getSalesById')
const {updateSale} = require('./updateSales')
const {getPurchasesByUser} = require('./getSalesByBuyers')
const {getSalesBySeller} = require('./getSalersBySeller')

const {getSalesStats} = require('./getSalesStats')

const {getSalesByVehicle} = require('./getSalesByVehile')

module.exports = {
    createSale,
    updateSale,
    getSaleById,
    getPurchasesByUser,
    getSalesBySeller,
    getUserSalesHistory,
    getSalesByVehicle,
    getSalesStats
}
