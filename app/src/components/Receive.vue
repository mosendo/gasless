<template>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
            <p class="modal-card-title">Receive</p>
        </header>
        <section class="modal-card-body">
            <b-field>
                <qrcode :value="$store.state.accounts.activeAccount" :options="{ width: 200 }"></qrcode>
            </b-field>

            <b-field label="Address">
                <b-input
                    :value="$store.state.accounts.activeAccount"
                    readonly>
                </b-input>
            </b-field>
        </section>
        <footer class="modal-card-foot">
            <button @click="copyAddress" class="button">Copy Address</button>
        </footer>
    </div>
</template>
<script>
export default {
    methods: {
        copyAddress () {
            window.navigator.clipboard.writeText(this.$store.state.accounts.activeAccount)
            this.$buefy.toast.open('Address copied to clipboard')
        }
    }
}
</script>