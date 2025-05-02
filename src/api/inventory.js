import request from '@/utils/request.js'

export const inventoryGetService = ({ page, pageSize, batchNo, id }) => {
    return request.get('/inventory/page', {
        params: {
            page,
            pageSize,
            batchNo,
            id
        }
    })
}

export const inventoryCountService = () => {
    return request.get(`/inventory/count`)
}


export const inventoryTransactionsGetService = ({ page, pageSize, transactionType, startDate, endDate }) => {
    return request.get('/inventory-transactions/page', {
        params: {
            page,
            pageSize,
            transactionType,
            startDate,
            endDate
        }
    })
}

export const inventoryTransactionsSummaryService = ({startTime, endTime}) => {
    return request.get('/inventory-transactions/summary', {
        params: {
            startTime,
            endTime
        }
    })
}