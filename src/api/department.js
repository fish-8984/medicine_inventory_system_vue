import request from '@/utils/request.js'


export const departmentAddService = ({ departmentId, name, location, managerId }) => {
    return request.post('/departments', { departmentId, name, location, managerId })
}

export const departmentUpdateService = ({ departmentId, name, location, managerId }) => {
    return request.put('/departments', { departmentId, name, location, managerId })
}

export const departmentDeleteService = (id) => {
    return request.delete(`/departments/${id}`)
}

export const departmentGetService = ({ page, pageSize, name }) => {
    return request.get('/departments/page', {
        params: {
            page,
            pageSize,
            name
        }
    })
}

export const departmentGetAllNameService = () => {
    return request.get('/departments/nameList')
}

