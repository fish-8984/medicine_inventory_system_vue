import request from "@/utils/request.js";

export const prescriptionsAddService = (payload) => {
    return request.post('/prescriptions', payload)
}


export const prescriptionsUpdateService = (payload) => {
    return request.put('/prescriptions', payload)
}

export const prescriptionsDispensingService = (prescriptionId) => {
    return request.put(`/prescriptions/dispensingMedicines/${prescriptionId}`)
}
export const prescriptionsDeleteService = (id) => {
    return request.delete(`/prescriptions/${id}`)
}

export const prescriptionsPageService = ({ page, pageSize, patientId, doctorId, prescriptionDate, status, dispensedBy }) => {
    return request.get('/prescriptions/page', {
        params: {
            page, pageSize, patientId, doctorId, prescriptionDate, status, dispensedBy
}})
}

export const prescriptionsCountService = ({ status, startDate, endDate }) => {
    return request.get('/prescriptions/count', {
        params: {
            status,
            startDate,
            endDate
}})
}




