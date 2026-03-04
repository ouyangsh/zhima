"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  props: {
    label: String,
    count: Number,
    color: String
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($props.count),
    b: $props.color,
    c: common_vendor.t($props.label)
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ae7f78fc"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/StatCard.js.map
