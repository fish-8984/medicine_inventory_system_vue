import request from '@/utils/request.js'

// 添加医护人员
export const staffAddService = ({ staffId, name, title, department, isActive, createdAt }) => {
    return request.post('/staff', { staffId, name, title, department, isActive, createdAt });
}

// 更新医护人员
export const staffUpdateService = ({ staffId, name, title, department, isActive, createdAt }) => {
    return request.put('/staff', { staffId, name, title, department, isActive, createdAt });
}

// 获取医护人员列表
export const staffFetchService = ({ page, pageSize, name, title, department, isActive }) => {
    return request.get(`/staff/page`, {
        params: {
            page,
            pageSize,
            name,
            title,
            department,
            isActive
        }
    });
}


// 获取单个医护人员
export const staffFetchIdService = (id) => {
    return request.get(`/staff`, {
        params: {
            id
        }
    });
}

export const staffGetNameService = (name) => {
    return request.get(`/staff/name`, {
        params: {
            name
        }
    });
}

// 删除医护人员
export const staffDeleteService = (id) => {
    return request.delete(`/staff/${id}`);
}



