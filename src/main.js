import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from '@/stores/index';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(ElementPlus, {
    locale: zhCn,
    size: 'default',
    zIndex: 2000
});
app.mount('#app');
