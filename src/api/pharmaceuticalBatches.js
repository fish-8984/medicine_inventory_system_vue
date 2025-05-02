import request from '@/utils/request.js'

export const pharmaceuticalBatchesAddService = ({batchNo, medicineId, expiryDate, productionDate, supplierId, initialQuantity, storageLocation, createdAt})=> {
    return request.post(`/medicine-batches`, {batchNo, medicineId, expiryDate, productionDate, supplierId, initialQuantity, storageLocation, createdAt})
}
export const pharmaceuticalBatchesGetPageService = ({page, pageSize, batchNo}) => {
    return request.get(`/medicine-batches`, {
        params: {
            page,
            pageSize,
            batchNo
        }
    })
}

export const pharmaceuticalBatchesGetService = (id) => {
    return request.get(`/medicine-batches/${id}`)
}
