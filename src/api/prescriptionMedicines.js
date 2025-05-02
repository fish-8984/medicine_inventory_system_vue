import request from "@/utils/request.js";

export const prescriptionMedicinesGetIdService = (id) => {
    return request.get(`/prescription-medicines/${id}`)
}

export const prescriptionMedicinesTotalPriceService = ({startDate, endDate}) => {
    return request.get(`/prescription-medicines/total-price`, {
        params: {
            startDate, endDate
        }
    })
}


