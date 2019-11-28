<template>
    <div class="rows is-mobile is-centered is-half">
            <div v-for="(tx, index) in sortedTxs" :key="index" @click="openInEtherscan(tx.txHash)" class="tx row is-half">
                <div class="columns is-mobile is-centered">
                    <div class="column is-narrow">
                        <img class="icon" src="../assets/tx.png"/>
                    </div>
                    <div class="column is-wide address">
                        {{shortAddress(tx.counterparty)}}
                    </div>
                    <div class="column is-narrow amount">
                        {{tx.balanceSign}}{{$formatDAI(tx.amount, true)}}
                    </div>
                </div>
            </div>
    </div>
</template>
<script>
import { NETWORK_NAME, RELAYER_ADDRESS } from "../utils/constants"

export default {
    data () {
        return {
            txs:[]
        }
    },
    computed: {
        sortedTxs () {
            let keys = {}
            return this.txs
                .filter((v)=>{
                    if(keys[v.counterparty+v.txHash]){
                        return false
                    } else {
                        keys[v.counterparty+v.txHash] = true
                        return true
                    }
                })
                .sort((a,b) => b.block - a.block)
        }
    },
    methods: {
        shortAddress (address) {
            if(address.toLowerCase() === RELAYER_ADDRESS.toLowerCase()) return "Transaction Fee"
            else return address.substring(0, 6) + "..." + address.substring(37, 41)
        },
        openInEtherscan (txHash) {
            const network = NETWORK_NAME !== "mainnet"? (NETWORK_NAME + "."): ""
            var win = window.open('https://'+network+'etherscan.io/tx/'+txHash, '_blank');
            win.focus();
        },
        initEvents() {
            const self = this;
            if(this.$store.state.drizzle && this.$store.state.drizzle.initialized && this.$store.state.drizzle.drizzleInstance.contracts.Dai) {
                const userAddress = this.$store.state.accounts.activeAccount;
                const srcEvent = this.$store.state.drizzle.drizzleInstance.contracts.Dai.events.Transfer({
                    fromBlock:0,
                    filter: {
                        src: userAddress
                    }
                })
                srcEvent.on("data", (ev)=>{
                    self.txs.push({
                        counterparty:ev.returnValues.dst,
                        amount: ev.returnValues.wad,
                        txHash: ev.transactionHash,
                        block: ev.blockNumber,
                        balanceSign:"-"
                    })
                })
                const dstEvent = this.$store.state.drizzle.drizzleInstance.contracts.Dai.events.Transfer({
                    fromBlock:0,
                    filter: {
                        dst: userAddress
                    }
                })
                dstEvent.on("data", (ev)=>{
                    self.txs.push({
                        counterparty:ev.returnValues.src,
                        amount: ev.returnValues.wad,
                        txHash: ev.transactionHash,
                        block: ev.blockNumber,
                        balanceSign:"+"
                    })
                })
            } else {
                setTimeout(function(){
                    self.initEvents()
                },100)
            }
        }
    },
    created () {
        this.initEvents()
    }
}
</script>
<style scoped>
.icon {
    height:50px;
    width:auto;
}
.address {
    line-height:50px;
    color:#232b35;
    font-size:16px;
    font-weight:700;
}
.amount {
    line-height:50px;
    color:#232b35;
    font-size:16px;
    text-transform: uppercase;
}
.tx {
    cursor:pointer;
}
</style>