import request from '@/utils/request.js'

export const purchaseOrdersAddService = ({poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy}) => {
    return request.post('/purchase-orders', {poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy})
}

export const purchaseOrdersUpdateService = ({poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy}) => {
    return request.put(`/purchase-orders`, {poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy})
}

export const purchaseOrdersUpdateStatusService = ({poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy}) => {
    return request.put(`/purchase-orders/updateStatus`, {poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy})
}

export const purchaseOrdersCancelOrderService = ({poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy}) => {
    return request.put(`/purchase-orders/CancelOrder`, {poId, supplierId, orderDate, expectedDeliveryDate, totalAmount, status, createdBy})
}

export const purchaseOrdersPageService = ({page, pageSize, supplierId, orderDate, expectedDeliveryDate, status, createdBy}) => {
    return request.get('/purchase-orders/page', {
        params: {
            page, pageSize, supplierId, orderDate, expectedDeliveryDate, status, createdBy
        }
    })
}

export const purchaseOrdersGetService = (id) => {
    return request.get(`/purchase-orders/${id}`)
}
