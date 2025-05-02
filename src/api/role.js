import request from '@/utils/request.js'

export const roleGetListService = () => {
    return request.get('/roles')
}

export const roleGetByIdService = (roleId) => {
    return request.get(`/roles/${roleId}`)
}

