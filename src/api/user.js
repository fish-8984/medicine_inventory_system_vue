import request from '@/utils/request.js'

export const userLoginService = ({ username, password }) => {
    return request.post(`/login`, { username, password });
}

export const userLogoutService = () => {
    return request.post('/logout');
}

export const userAddService = ({userId, username, passwordHash, roleId, department, lastLogin, createdAt, departmentId, status}) => {
    return request.post('/users/register', {userId, username, passwordHash, roleId, department, lastLogin, createdAt, departmentId, status});
}

export const userGetListService = ({ page, pageSize}) => {
    return request.get('/users/page', { params: { page, pageSize } });
}


export const userGetByIdService = (id) => {
    return request.get(`/users/selectById/${id}`);
}
export const userGetByNameService = (name) => {
    return request.get(`/users/selectByName/${name}`);
}

export const userUpdatePasswordService = ({users, oldPassword}) => {
    return request.put(`/users/updatePassword`, { users, oldPassword });
}

export const userUpdateService = ({userId, username, passwordHash, roleId, department, lastLogin, createdAt, departmentId, status}) => {
    return request.put(`/users`, {userId, username, passwordHash, roleId, department, lastLogin, createdAt, departmentId, status});
}

export const userUpdateStatusService = (status, id) => {
    return request.put(`/users/updateStatus/${status}/${id}`);
}