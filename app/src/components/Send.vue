<template>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
            <p class="modal-card-title">Send</p>
        </header>
        <section class="modal-card-body">
            <b-field label="Amount" label-position="on-border">
                <b-input
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
            <b-field style="margin-bottom:30px">
                <span class="fee">Fee {{daiFee}}</span>
            </b-field>
            <b-field label="Recipient" label-position="on-border" :type="addressValidator.type" :message="addressValidator.message">
                <b-input
                    v-model="recipient"
                    placeholder="0x123..."
                    >
                </b-input>            
            </b-field>
        </section>
        <footer class="modal-card-foot">
            <b-button @click="send" :disabled="sendDisabled" :loading="loading" class="button">Send</b-button>
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
            recipient:"",
            fee:"",
            loading:false,
            gasprice:""
        }
    },
    computed: {
        daiFee () {
            if(this.fee.length === 0) {
                return "loading..."
            } else {
                return this.$formatDAI(this.fee, true)
            }
        },
        addressValidator () {
            let showError = this.recipient.length > 0? !this.$isAddress(this.recipient): false
            if(showError) {
                return {
                    type:'is-danger',
                    message:'Invalid Ethereum Address'
                }
            } else {
                return {}
            }
        },
        sendDisabled () {
            if(this.fee.length === 0) {
                return true
            }
            if(this.recipient.length === 0 || this.addressValidator.message) {
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
            return false
        }
    },
    methods: {
        max() {
            this.amount = this.$formatDAI(this.$parent.$parent.balance, false)
        },
        async send () {
            this.loading = true
            try {
                const bigAmount = new BN(this.amount).shiftedBy(18).toFixed()
                const txHash = await this.$relayer.send(this.$store.state.accounts.activeAccount, this.recipient, bigAmount, this.fee, this.gasprice, this.$store.state.drizzle.drizzleInstance.web3);
                this.openInEtherscan(txHash);
                this.$parent.close()
                this.$buefy.toast.open('Transaction submitted successfully!')
            } catch(e) {
                console.log(e)
                this.loading = false
            }
        },
        openInEtherscan (txHash) {
            const network = NETWORK_NAME !== "mainnet"? (NETWORK_NAME + "."): ""
            var win = window.open('https://'+network+'etherscan.io/tx/'+txHash, '_blank');
            win.focus();
        }
    },
    async created () {
        const obj = await this.$relayer.getFee("send", this.$store.state.drizzle.drizzleInstance.web3)
        this.fee = obj.fee
        this.gasprice = obj.gasprice
    }
}
</script>
<style scoped>
.fee {
    color: #667380 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 20px !important;
}
</style>