import request from "@/utils/request.js";

export const purchaseAddService = ({ recordId, poId, medicineId, batchNo, quantity, unitPrice }) => {
        return request.post('/purchase-records', { recordId, poId, medicineId, batchNo, quantity, unitPrice })
}

export const purchaseUpdateService = ({ recordId, poId, medicineId, batchNo, quantity, unitPrice }) => {
        return request.put('/purchase-records', { recordId, poId, medicineId, batchNo, quantity, unitPrice })
}

export const purchaseGetIdService = (id) => {
        return request.get(`/purchase-records/${id}`)
}

export const purchasePageService = ({ page, pageSize, medicineId, batchNo }) => {
        return request.get('/purchase-records/page', {
                params: {
                    page, pageSize, medicineId, batchNo
                }
        })
}






