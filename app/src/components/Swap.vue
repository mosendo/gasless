<template>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
            <p class="modal-card-title">Swap</p>
        </header>
        <section class="modal-card-body">
            <b-field label="Amount" label-position="on-border">
                <b-input
                    @input="getReceived"
                    v-model="amount"
                    placeholder="1.00"
                    >
                </b-input>
                <div class="control">
                    <button @click="max" class="button">
                        <span>MAX</span>
                    </button>
                </div>            
            </b-field>
            <b-field style="margin-bottom:30px" grouped>
                <b-field expanded>
                <span class="fee">Fee {{daiFee}}</span>
                </b-field>
                <b-field expanded>
                <span v-if="rate" class="rate">Rate {{rate}}</span>
                </b-field>
            </b-field>
            <b-field label="Receive" label-position="on-border">
                <b-input
                    readonly
                    v-model="receivedEth"
                    >
                </b-input>            
            </b-field>
        </section>
        <footer class="modal-card-foot">
            <b-button @click="swap" :disabled="swapDisabled" :loading="loading" class="button">Swap</b-button>
        </footer>
    </div>
</template>
<script>
import BN from 'bignumber.js'
import { NETWORK_NAME } from "../utils/constants"

export default {
    data () {
        return {
            amount:"",
            fee:"",
            loading:false,
            gasprice:"",
            receivedWei:"",
        }
    },
    computed: {
        receivedEth () {
            if(this.receivedWei.length === 0) {
                return ""
            } else {
                return BN(this.receivedWei).shiftedBy(-18).toFixed(3) + " ETH";
            }
        },
        rate () {
            if(this.receivedWei.length !== 0 && this.amount.length !== 0) {
                return BN(this.amount).shiftedBy(18).minus(this.fee).div(this.receivedWei).toFixed(2) + " DAI/ETH"
            }
        },
        daiFee () {
            if(this.fee.length === 0) {
                return "loading..."
            } else {
                return this.$formatDAI(this.fee, true)
            }
        },
        swapDisabled () {
            if(this.fee.length === 0) {
                return true
            }
            if(this.amount.length === 0) {
                return true
            }
            if(isNaN(this.amount)) {
                return true
            }
            if(Number(this.amount) <= 0) {
                return true
            }
            const bigAmount = new BN(this.amount).shiftedBy(18)
            if(bigAmount.gt(this.$parent.$parent.balance)) {
                return true
            }
            if(bigAmount.lte(this.fee)) {
                return true
            }
            if(this.receivedWei.length === 0) {
                return true;
            }
            return false
        }
    },
    methods: {
        max() {
            this.amount = this.$formatDAI(this.$parent.$parent.balance, false)
            this.getReceived()
        },
        async swap () {
            this.loading = true
            try {
                const bigAmount = new BN(this.amount).shiftedBy(18).toFixed()
                const txHash = await this.$relayer.swap(this.$store.state.accounts.activeAccount, bigAmount, this.receivedWei, this.fee, this.gasprice, this.$store.state.drizzle.drizzleInstance.web3);
                this.openInEtherscan(txHash);
                this.$parent.close()
                this.$buefy.toast.open('Transaction submitted successfully!')
            } catch(e) {
                console.log(e)
                this.loading = false
            }
        },
        async getReceived () {
            this.receivedWei = "";
            if(this.fee.length === 0) {
                const self = this;
                setTimeout(()=>{
                    self.getReceived()
                },500)
            } else {
                this.receivedWei = await this.$relayer.getSwapRate(BN(this.amount).shiftedBy(18).minus(this.fee).toFixed(0), this.$store.state.drizzle.drizzleInstance.web3);
            }
        },
        openInEtherscan (txHash) {
            const network = NETWORK_NAME !== "mainnet"? (NETWORK_NAME + "."): ""
            var win = window.open('https://'+network+'etherscan.io/tx/'+txHash, '_blank');
            win.focus();
        }
    },
    async created () {
        const obj = await this.$relayer.getFee("swap", this.$store.state.drizzle.drizzleInstance.web3)
        this.fee = obj.fee
        this.gasprice = obj.gasprice
    }
}
</script>
<style scoped>
.fee {
    float: left;
    color: #667380 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 20px !important;
}
.rate {
    float: right;
    color: #667380 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 20px !important;
}
</style>