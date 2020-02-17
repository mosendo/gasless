<template>
    <div>
        <div class="hero">
            <div class="hero-body">
                <div class="container">
                    <div class="level">
                        <div class="logo-wrapper level-left">
                            <span class="fire">🔥</span>
                            <img src="../assets/gasless-logo.svg" class="is-pulled-left logo"/>
                        </div>
                        <div class="level-right">
                            <div @click="receive" v-if="shortAddress" class="receive is-pulled-right">
                                <div class="short-address is-pulled-left">{{shortAddress}}</div>
                                <img class="qr-icon is-pulled-left" src="../assets/qr.svg"/>
                            </div>
                            <b-button class="connect-button" v-else @click="connectWeb3" outlined>
                                CONNECT
                            </b-button>
                        </div>
                    </div>
                </div>
                <div class="container">
                    <div class="balance-section">
                        <h1 class="title">Balance</h1>
                        <h2 class="subtitle">
                            {{$formatDAI(balance, true)}}
                        </h2>
                    </div>
                </div>
            </div>
        </div>
        <section class="section">
            <div class="container">
                <div class="columns is-mobile">
                    <!--<div class="column">
                        <div @click="swap" class="call-to-action tile is-pulled-right">
                            <div class="icon is-pulled-left">
                                <img src="../assets/ether.svg"/>
                            </div>
                            <div class="text">
                                Swap to ETH
                            </div>
                        </div>
                    </div>-->
                    <div class="column">
                        <div @click="send" class="call-to-action tile">
                            <div class="icon">
                                <img src="../assets/send.svg"/>
                            </div>
                            <div class="text">
                                Send
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <History/>
        <footer class="footer">
            <p><a href="https://medium.com/mosendo/gasless-by-mosendo-3030f5e99099">About Gasless</a> | <a href="https://github.com/mosendo/gasless.js">gasless.js</a> | <a href="https://angel.co/company/mosendo/jobs">We're Hiring!</a> | <a href="https://github.com/mosendo/gasless">Github</a> | <a href="https://twitter.com/GetMosendo">Twitter</a> | <a href="https://mosendo.com/">What is Mosendo?</a></p>
            <p><em><small>Disclaimer: this code is in beta and has not been audited. Use at your own risk.</small></em></p>
        </footer>
    </div>
</template>

<script>
import History from './History.vue'
import Send from './Send.vue'
import Swap from './Swap.vue'
import Receive from './Receive.vue'

export default {
    data () {
        return {
            dataKey:""
        }
    },
    components:{
        History
    },
    computed: {
        shortAddress () {
            if(this.$store.state.accounts && this.$store.state.accounts.activeAccount.length > 0) {
                return this.$store.state.accounts.activeAccount.substring(0, 6) + "..." + this.$store.state.accounts.activeAccount.substring(37, 41)
            }
        },
        balance () {
            if(this.$store.state.drizzle && this.$store.state.drizzle.initialized && this.shortAddress) {
                this.dataKey = this.$store.state.drizzle.drizzleInstance.contracts.Dai.methods.balanceOf.cacheCall(this.$store.state.accounts.activeAccount)
                if(this.$store.state.contracts.instances.Dai.balanceOf[this.dataKey]) {
                    return this.$store.state.contracts.instances.Dai.balanceOf[this.dataKey].value
                } else {
                    return "0"
                }
            } else {
                return "0"
            }
        }
    },
    methods: {
        send () {
            if(this.$store.state.drizzle && this.$store.state.drizzle.initialized) {
                this.$buefy.modal.open({
                    parent: this,
                    component: Send,
                    hasModalCard: true,
                })
            } else {
                this.connectToast()
            }
        },
        swap () {
            if(this.$store.state.drizzle && this.$store.state.drizzle.initialized) {
                this.$buefy.modal.open({
                    parent: this,
                    component: Swap,
                    hasModalCard: true,
                })
            } else {
                this.connectToast()
            }
        },
        receive () {
            this.$buefy.modal.open({
                parent: this,
                component: Receive,
                hasModalCard: true,
            })            
        },
        connectWeb3 () {
            this.$onConnect()
        },
        connectToast() {
            this.$buefy.toast.open('Please connect your Web3 provider first.')
        }
    }
}
</script>

<style scoped>
.container {
    max-width: 450px;
}
.section {
    padding: 1rem 1.5rem;
}
.hero-body {
    height: 250px;
    background-color: #8e38b5;
}
.hero {
    margin-bottom:15px;
}
.logo-wrapper {
    margin-left: -32px;
}
.fire {
    font-size: 32px;
    float: left;
    position: relative;
    left: -8px;
    top: -16px;
}
.logo {
    width: 130px;
}
.short-address {
    color:white;
    font-size:15px;
}
.qr-icon {
    margin-left:10px;
}
.balance-section {
    margin-top: 2rem;
}
.balance-section .title {
    color:rgba(249, 250, 251, 0.8);
    font-size: 14px;
    line-height:20px;
    font-weight:700;
    height:29px;
}
.balance-section .subtitle {
    color:rgba(249, 250, 251, 0.8);
    font-size: 25px;
    line-height:20px;
    font-weight:700;
    height:29px;
}
.call-to-action {
    margin:auto;
    padding-top:20px;
    width:168px;
    height:59px;
    box-shadow: 0 2px 4px rgba(10, 10, 10, 0.08);
    border-radius:30px;
    cursor:pointer;
}
.call-to-action .text {
    width:100%;
    font-size:18px;
    color: #8e38b5;
    text-align:center;
}
.call-to-action .icon {
    margin-left:20px;
}
.call-to-action .icon img {
    height:28px;
}
.nav {
    padding-bottom:25px;
}
.receive {
    cursor:pointer;
}
.connect-button {
    background: transparent;
    color: white;
    font-size: 12px;
    float:right;
    width:150px;
}
.footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    padding: 20px;
    background:#f9fafb;
}
@media only screen and (max-width: 768px) {
    .level {
        display: flex;
    }
    .logo-wrapper {
        margin-left: 0px;
    }
    .call-to-action {
        padding-top:10px;
        width:127px;
        height:40px;
    }
    .call-to-action .text {
        position:relative;
        bottom:30px;
        font-size:14px;
    }
    .call-to-action .icon {
        margin-left:15px;
    }
    .call-to-action .icon img {
        height:20px;
    }
    .connect-button {
        width:100px;
    }
    .short-address {
        cursor:pointer;
        font-size:13px;
    }
}
</style>