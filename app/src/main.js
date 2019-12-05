import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import storeObj from './store'
import { Modal, Button, Field, Input, Toast } from 'buefy'
import drizzleVuePlugin from '@drizzle/vue-plugin'
import Gasless from '../contracts/Gasless.json';
import Dai from '../contracts/Dai.json';
import BN from 'bignumber.js'
import VueQrcode from '@chenfengyuan/vue-qrcode';
import relayer from './utils/relayer'
import { CHAIN_ID, DAI_CONTRACT } from './utils/constants'
import * as firebase from "firebase/app";
import "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDyA6jbDeCzFvg68zgOQIBNraFkuqYwLvE",
  authDomain: "gasless-20d13.firebaseapp.com",
  databaseURL: "https://gasless-20d13.firebaseio.com",
  projectId: "gasless-20d13",
  storageBucket: "gasless-20d13.appspot.com",
  messagingSenderId: "463586167757",
  appId: "1:463586167757:web:cb18e110b101b32301d284",
  measurementId: "G-8WCWLRRKZZ"
};

firebase.initializeApp(firebaseConfig);

Vue.component(VueQrcode.name, VueQrcode);
// Todo: Update this when publishing
// import drizzleVuePlugin from '@drizzle/vue-plugin'
//

Vue.use(Modal)
Vue.use(Button)
Vue.use(Field)
Vue.use(Input)
Vue.use(Toast)
Vue.use(Vuex)
const store = new Vuex.Store(storeObj)

Vue.config.productionTip = false

function initDrizzle (customProvider) {

  let url = "wss://mainnet.infura.io/ws/v3/" + process.env.INFURA_ACCESS_KEY

  if(customProvider) {
    delete window.ethereum;
    delete window.web3;
  }

  Dai.networks = {
    [CHAIN_ID]:{
      address: DAI_CONTRACT
    }
  }

  const drizzleOptions = {
    web3: {
      customProvider,
      block: true,
      fallback: {
        type: 'ws',
        url
      }
    },
    contracts: [Gasless, Dai],
    // events: {
    //   Dai: [
    //     { eventName: 'Transfer',
    //       eventOptions:{
    //         fromBlock:0
    //       }
    //     }
    //   ]
    // },
    syncAlways:true
  }

  Vue.use(drizzleVuePlugin, { store, drizzleOptions })
}

function formatDAI (amount, showDAI, decimals = 2) {
  amount = new BN(amount).shiftedBy(-18).toFixed()
  if(amount.includes(".")) {
    amount = new BN(amount).toFormat(decimals)
  }
  return amount + (showDAI? " DAI":"")
}

var isAddress = function (address) {
  return /^(0x)?[0-9a-f]{40}$/i.test(address);
};

Vue.prototype.$initDrizzle = initDrizzle
Vue.prototype.$formatDAI = formatDAI
Vue.prototype.$isAddress = isAddress
Vue.prototype.$relayer = relayer

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
