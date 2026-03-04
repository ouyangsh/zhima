"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  props: {
    color: String,
    brand: String,
    description: String,
    colorCode: String,
    weight: Number,
    ballsCount: Number,
    imageUrl: String,
    relatedProjects: Number
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.imageUrl,
    b: common_vendor.t($props.ballsCount),
    c: common_vendor.t($props.brand),
    d: $props.color,
    e: common_vendor.t($props.description || "暂无描述"),
    f: common_vendor.t($props.weight),
    g: $props.relatedProjects > 0
  }, $props.relatedProjects > 0 ? {
    h: common_vendor.t($props.relatedProjects)
  } : {}, {
    i: common_vendor.o(($event) => _ctx.$emit("longpress"))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a6a8ba5a"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/YarnCard.js.map
