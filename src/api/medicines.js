import request from '@/utils/request'

export const medicineGetService = ({ page, pageSize, name, brand, categoryId, isGeneric }) => {
    return request.get(`/medicines/page`, {
        params: {
            page,
            pageSize,
            name,
            brand,
            categoryId,
            isGeneric
        }
    })
}
export const medicineAddService = ({ medicineId, name, specification, brand, categoryId, unit, price, isGeneric, createdAt, updatedAt }) => {
    return request.post(`/medicines`, { medicineId, name, specification, brand, categoryId, unit, price, isGeneric, createdAt, updatedAt })
}
export const medicineUpdateService = ({ medicineId, name, specification, brand, categoryId, unit, price, isGeneric, createdAt, updatedAt }) => {
    return request.put(`/medicines`, { medicineId, name, specification, brand, categoryId, unit, price, isGeneric, createdAt, updatedAt })
}
export const medicineDeleteService = (id) => {
    return request.delete(`/medicines/${id}`)
}

export const medicineGetNameService = (medicineName) => {
    return request.get(`/medicines/name/${medicineName}`)
}
export const medicineGetIdsService = (params) => {
    return request.get(`/medicines/ids`, {
        params: { medicineIds: params.medicineIds }
    })
}