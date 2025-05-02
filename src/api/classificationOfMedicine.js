import request from '@/utils/request'

export const classifyGetService = ({ page, pageSize }) => {
    return request.get(`/medicine-categories/page`, {
        params: {
            page,
            pageSize
        }
    })
}

export const classifyAddService = ({ categoryId, categoryName, parentId, description, sortOrder, isDeleted, createdAt, updatedAt }) => {
    return request.post(`/medicine-categories`, { categoryId, categoryName, parentId, description, sortOrder, isDeleted, createdAt, updatedAt })
}

export const classifyUpdateService = ({ categoryId, categoryName, parentId, description, sortOrder, isDeleted, createdAt, updatedAt }) => {
    return request.put(`/medicine-categories`, { categoryId, categoryName, parentId, description, sortOrder, isDeleted, createdAt, updatedAt })
}

export const classifyDeleteService = (id) => {
    return request.delete(`/medicine-categories/${id}`)
}

export const classifyGetByIdService = (id) => {
    return request.get(`/medicine-categories/${id}`)
}


export const classifyGetNameService = () => {
    return request.get(`/medicine-categories/names/all`)
}


