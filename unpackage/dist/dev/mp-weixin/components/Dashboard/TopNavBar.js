"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  props: {
    title: String
  },
  emits: ["addClick", "userClick"],
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      menuButtonWidth: 0
      // 胶囊按钮区域宽度
    };
  },
  mounted() {
    this.initLayout();
  },
  methods: {
    initLayout() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 20;
      const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
      const screenWidth = systemInfo.screenWidth;
      screenWidth - menuButtonInfo.right;
      this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.t($props.title),
    c: common_vendor.p({
      type: "plusempty",
      size: "20",
      color: "#FFFFFF"
    }),
    d: common_vendor.o(($event) => _ctx.$emit("addClick")),
    e: common_vendor.p({
      type: "person",
      size: "20",
      color: "#3A3A3A"
    }),
    f: common_vendor.o(($event) => _ctx.$emit("userClick")),
    g: $data.navBarHeight + "px",
    h: $data.menuButtonWidth + "px"
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d78cb672"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/TopNavBar.js.map
