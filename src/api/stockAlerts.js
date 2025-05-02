import request from '@/utils/request'

export const stockAlertsAddService = ({alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled}) => {
  return request.post('/stock-alerts', {alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled})
}

export const stockAlertsUpdateService = ({alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled}) => {
  return request.put('/stock-alerts', {alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled})
}

export const stockAlertsDeleteService = (alertId) => {
  return request.delete(`/stock-alerts/${alertId}`)
}


export const stockAlertsEnableService = ({alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled}) => {
  return request.put('/stock-alerts/is-enabled', {alertId, medicineId, minQuantity, alertLevel, notificationMethods, isEnabled})
}


export const stockAlertsListService = ({page, pageSize, medicineId, alertLevel}) => {
  return request.get('/stock-alerts/page', {
    params: {
      page,
      pageSize,
      medicineId,
      alertLevel
    }
  })
}



