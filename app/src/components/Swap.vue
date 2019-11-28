<template>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
            <p class="modal-card-title">Swap</p>
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
            <b-field label="Receive" label-position="on-border" :type="addressValidator.type" :message="addressValidator.message">
                <b-input
                    readonly
                    v-model="recipient"
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
        swapdDisabled () {
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
        async swap () {
            this.loading = true
            try {
                const bigAmount = new BN(this.amount).shiftedBy(18).toFixed()
                const txHash = await this.$relayer.swap(this.$store.state.accounts.activeAccount, this.recipient, bigAmount, this.fee, this.gasprice, this.$store.state.drizzle.drizzleInstance.web3);
                console.log("tx hash:", txHash)
                this.$parent.close()
                this.$buefy.toast.open('Transaction submitted successfully!')
            } catch(e) {
                console.log(e)
                this.loading = false
            }
        }
    },
    async created () {
        const obj = await this.$relayer.getFee("swap", this.$store.state.drizzle.drizzleInstance.web3)
        this.fee = obj.fee
        this.gasprice = obj.gasprice
    }
}
</script>
<style>
.fee {
    color: #667380 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 20px !important;
}
</style>