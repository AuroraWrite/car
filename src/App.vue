<script>
export default {
  onLaunch: function () {
    console.log("App Launch");
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style>
/*每个页面公共css */

/* #ifdef H5 */
html {
  font-size: 14px !important;
}
body {
  font-size: 1rem !important;
  -webkit-text-size-adjust: 100% !important;
}
input,
textarea {
  font-size: 1rem !important;
}
@media (max-width: 375px) {
  html {
    font-size: 12px !important;
  }
}
@media (min-width: 376px) and (max-width: 414px) {
  html {
    font-size: 14px !important;
  }
}
@media (min-width: 415px) {
  html {
    font-size: 16px !important;
  }
}
/* #endif */
</style>
