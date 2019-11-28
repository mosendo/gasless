<template>
    <div>
        <form action="">
            <div class="modal-card" style="width: auto">
                <header class="modal-card-head">
                    <p class="modal-card-title">Select Web3 Provider</p>
                </header>
                <section class="modal-card-body">
                    <b-field v-if="isMetamask()">
                        <b-button @click="metamask" expanded>Metamask</b-button>
                    </b-field>
                    <b-field>
                        <b-button @click="walletConnect" :disabled="true" expanded>Wallet Connect</b-button>
                    </b-field>
                    <b-field>
                        <b-button @click="torus" :disabled="true" :loading="torusLoading" expanded>Sign in with Google</b-button>
                    </b-field>
                </section>
            </div>
        </form>
    </div>
</template>
<script>
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";

const torus = new Torus();

export default {
  data () {
      return {
          torusLoading:false
      }
  },
  methods: {
    isMetamask() {
        return (window.ethereum && window.ethereum.isMetaMask)
    },
    async walletConnect() {
        const provider = new WalletConnectProvider({
        chainId:42,
        infuraId: "d12fc9464334437e8508de34b4fdce60"
        });

        await provider.enable();
        this.$initDrizzle(provider)
        this.$parent.close()
    },
    async metamask() {
        await window.ethereum.enable()
        this.$initDrizzle()
        this.$parent.close()
    },
    async torus() {
        this.torusLoading = true
        try {
            await torus.init({
                showTorusButton: false
            });
            await torus.login({
                verifier:"google"
            });
            this.$parent.close()
            this.$initDrizzle(torus.provider);
        } catch(e) {
            this.torusLoading = false;
        }
    }
  },
}
</script>