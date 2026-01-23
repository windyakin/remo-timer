import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import { createAuth0 } from '@auth0/auth0-vue';
import { AUTH_ENABLED, auth0Config } from '@/config/auth';

import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// Auth0 setup - only if enabled
if (AUTH_ENABLED) {
  app.use(
    createAuth0({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: auth0Config.audience,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    })
  );
}

app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  locale: {
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    dayNamesMin: ['日', '月', '火', '水', '木', '金', '土'],
    monthNames: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ],
    monthNamesShort: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ],
    today: '今日',
    clear: 'クリア',
    accept: 'はい',
    reject: 'いいえ',
    firstDayOfWeek: 0,
  },
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
