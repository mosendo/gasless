<template>
  <div id="app">
    <Home/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Home from './components/Home'

export default {
  name: 'app',
  computed: mapGetters('drizzle', ['isDrizzleInitialized']),
  components:{
    Home
  }
}
</script>

<style lang="scss">
body, html {
  margin:0px;
  background:#f9fafb;
  height: 100%;
}
body {
  position: relative;
}
* {
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
}

$gap: 32px;

// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
 $primary: #8e38b5;
 $primary-invert: findColorInvert($primary);
// $twitter: #4099FF;
// $twitter-invert: findColorInvert($twitter);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
// $colors: (
//     "white": ($white, $black),
//     "black": ($black, $white),
//     "light": ($light, $light-invert),
//     "dark": ($dark, $dark-invert),
//     "primary": ($primary, $primary-invert),
//     "info": ($info, $info-invert),
//     "success": ($success, $success-invert),
//     "warning": ($warning, $warning-invert),
//     "danger": ($danger, $danger-invert),
//     "twitter": ($twitter, $twitter-invert)
// );

// Links
// $link: $primary;
// $link-invert: $primary-invert;
// $link-focus-border: $primary;

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";
</style>
