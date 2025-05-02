import axios from "axios";
import { useUserStore } from "@/stores";
import { ElMessage } from "element-plus";
import router from "@/router";

const baseURL = "http://127.0.0.1:8082/api";

const instance = axios.create({
    baseURL,
    timeout: 3000
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const userStore = useUserStore();
        if (userStore.token) {
            config.headers.token = userStore.token;
        }
        config.headers["Content-Type"] = "application/json";
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        const res = response.data;
        if (res.code === 1) {  // 业务成功
            return res;
        }
        else if (res.code === 401) {
            // token 失效处理
            const userStore = useUserStore();
            userStore.removeToken(); // 清除 token
            router.push({name: "login"}).then(r =>
                ElMessage.error("登录已过期，请重新登录")
            ) // 跳转到登录页;
        }
        else {
            // 业务逻辑错误
            const errorMsg = res.msg || "操作失败，请稍后重试";
            ElMessage.error(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }
    },
    (error) => {
        // 网络错误/超时处理
        if (!error.response) {
            ElMessage.error("网络连接异常，请检查网络");
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        // 401 未授权处理
        if (status === 401) {
            const userStore = useUserStore();
            userStore.removeToken(); // 清除 token
            router.push({name: "login"}).then(r =>
                ElMessage.error("登录已过期，请重新登录")
            )
        } else {
            // 其他错误
            const errorMsg = data?.msg || `服务器错误 (${status})`;
            ElMessage.error(errorMsg);
        }

        return Promise.reject(data || error);
    }
);

export default instance;
export { baseURL };