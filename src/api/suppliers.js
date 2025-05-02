import request from '@/utils/request.js'


export const suppliersAddService = ({supplierId, name, contactPerson, phone, address, contractEndDate}) => {
    return request.post('/suppliers', {supplierId, name, contactPerson, phone, address, contractEndDate})
}

export const suppliersUpdateService = ({supplierId, name, contactPerson, phone, address, contractEndDate}) => {
    return request.put('/suppliers', {supplierId, name, contactPerson, phone, address, contractEndDate})
}

export const suppliersDeleteService = (id) => {
    return request.delete(`/suppliers/${id}`)
}

export const suppliersGetIdService = (id) => {
    return request.get(`/suppliers/${id}`)
}
export const suppliersGetIdsService = (ids) => {
    return request.get(`/suppliers/supplierIds`, {
        params: {
            supplierId: ids
        }
    })
}

export const suppliersGetService = ({page, pageSize, name, phone, contractEndDate}) => {
    return request.get('/suppliers/page',{
        params: {
            page,
            pageSize,
            name,
            phone,
            contractEndDate
        }
    })
}



