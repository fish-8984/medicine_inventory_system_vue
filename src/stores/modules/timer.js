import { ref, onUnmounted, computed } from 'vue'
import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', () => {
    // 状态
    const timer = ref(null)
    const isRunning = ref(false)
    const refreshInterval = ref(10000) // 默认10秒刷新一次
    const lastRefreshTime = ref(null)

    // 开始定时器
    const startTimer = (callback, interval = 10000) => {
        // 如果已经运行，先停止
        if (isRunning.value) {
            stopTimer()
        }

        refreshInterval.value = interval
        isRunning.value = true

        // 立即执行一次回调
        // callback()
        // lastRefreshTime.value = new Date()

        // 设置定时器
        timer.value = setInterval(() => {
            callback()
            lastRefreshTime.value = new Date()
        }, refreshInterval.value)
    }

    // 停止定时器
    const stopTimer = () => {
        if (timer.value) {
            clearInterval(timer.value)
            timer.value = null
        }
        isRunning.value = false
    }

    // 切换定时器状态
    const toggleTimer = (callback) => {
        if (isRunning.value) {
            stopTimer()
        } else {
            startTimer(callback, refreshInterval.value)
        }
    }

    // 计算距离下次刷新的时间
    const timeToNextRefresh = computed(() => {
        if (!isRunning.value || !lastRefreshTime.value) return 0

        const now = new Date()
        const elapsed = now - lastRefreshTime.value
        return Math.max(0, refreshInterval.value - elapsed)
    })

    // 组件卸载时自动清理
    onUnmounted(() => {
        stopTimer()
    })

    return {
        timer,
        isRunning,
        refreshInterval,
        lastRefreshTime,
        timeToNextRefresh,
        startTimer,
        stopTimer,
        toggleTimer
    }
})

