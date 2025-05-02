import { ElMessage } from 'element-plus'

const BASE_URL = 'http://127.0.0.1:8082/python'

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json()
        const error = new Error(errorData.error || '请求失败')
        error.status = response.status

        // 根据状态码增强错误信息
        switch(response.status) {
            case 10400:
                error.type = '参数校验错误'
                error.detail = errorData.detail
                error.solution = errorData.solution
                break
            case 10404:
                error.type = '资源未找到'
                error.suggestion = errorData.suggestion
                break
            case 10500:
                error.type = '服务器错误'
                error.solution = [
                    '1. 请稍后重试',
                    '2. 联系系统管理员'
                ]
                break
            default:
                error.type = '未知错误'
        }

        throw error
    }
    return response.json()
}

export const fetchPrediction = async (batchNo, periods) => {
    try {
        const response = await fetch(`${BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_no: batchNo, periods })
        })
        return await handleResponse(response)
    } catch (error) {
        let message = `${error.type || '错误'}：${error.message}`

        // 根据状态码构造详细信息
        if (error.detail) message += `\n详情：${error.detail}`
        if (error.suggestion) message += `\n建议：${error.suggestion}`
        if (error.solution) message += `\n解决方案：${error.solution.join('；')}`

        ElMessage.error({
            message: message,
            duration: 6000,
            showClose: true,
            dangerouslyUseHTMLString: true
        })

        error.handled = true
        throw error
    }
}

export const getBatchInfo = async (batchNo) => {
    try {
        const response = await fetch(`${BASE_URL}/batches/${batchNo}`)
        return await handleResponse(response)
    } catch (error) {
        ElMessage.error({
            message: error.message,
            duration: 5000
        })
        throw error
    }
}

export const getAlertInfo = async (medicineId) => {
    try {
        const response = await fetch(`${BASE_URL}/alerts/${medicineId}`)
        return await handleResponse(response)
    } catch (error) {
        let message = `预警配置获取失败：${error.message}`
        if (error.status === 10404) {
            message = '该药品未设置预警阈值，使用默认配置'
            ElMessage.warning({
                message: message,
                duration: 4000
            })
            return { medicine_id: medicineId, alert_threshold: 0 }
        }

        ElMessage.error(message)
        throw error
    }
}