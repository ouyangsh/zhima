"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  mounted() {
  },
  props: {
    title: String,
    description: String,
    progress: Number,
    imageUrl: String,
    lastUpdate: String,
    yarnColors: Array
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $props.imageUrl,
    b: common_vendor.t($props.title),
    c: common_vendor.t($props.lastUpdate),
    d: common_vendor.t($props.description),
    e: $props.progress + "%",
    f: common_vendor.t($props.progress),
    g: common_vendor.f($props.yarnColors, (color, index, i0) => {
      return {
        a: index,
        b: color
      };
    }),
    h: common_vendor.o(($event) => _ctx.$emit("click")),
    i: common_vendor.o(($event) => _ctx.$emit("longpress"))
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5dd065ba"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/ProjectCard.js.map
