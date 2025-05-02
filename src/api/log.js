import request from '@/utils/request.js'

export const logGetPageService = ({page, pageSize, userId, action, actionDate }) => {
    return request.get('/audit-logs/page', {
        params: {
            page,
            pageSize,
            userId,
            action,
            actionDate
        }
    })
}