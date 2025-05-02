import request from '@/utils/request.js'

export const patientsAddService = ({ patientId, name, gender, birthdate, contactPhone, createdAt }) => {
    return request.post('/patients', { patientId, name, gender, birthdate, contactPhone, createdAt });
}

export const patientsUpdateService = ({ patientId, name, gender, birthdate, contactPhone, createdAt }) => {
    return request.put('/patients', { patientId, name, gender, birthdate, contactPhone, createdAt });
}

export const patientsFetchService = ({ page, pageSize, name, gender, birthdate, contactPhone }) => {
    return request.get(`/patients/page`,{
        params: {
            page,
            pageSize,
            name,
            gender,
            birthdate,
            contactPhone
        }
    });
}
export const patientsFetchNameService = (patientName) => {
    return request.get(`/patients/name/${patientName}`);
}
export const patientsFetchIdService = (id) => {
    return request.get(`/patients/${id}`);
}