"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  props: {
    activeTab: String
  },
  emits: ["tabChange"],
  data() {
    return {
      navItems: [
        { id: "home", label: "首页", icon: "home" },
        { id: "yarn", label: "毛线库", icon: "shop" },
        { id: "discover", label: "发现", icon: "navigate" },
        { id: "profile", label: "我的", icon: "person" }
      ]
    };
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
    a: common_vendor.f($data.navItems, (item, k0, i0) => {
      return {
        a: "744d182b-0-" + i0,
        b: common_vendor.p({
          type: item.icon,
          size: "24",
          color: $props.activeTab === item.id ? "#6C8EA4" : "#999999"
        }),
        c: common_vendor.t(item.label),
        d: $props.activeTab === item.id ? 1 : "",
        e: item.id,
        f: common_vendor.o(($event) => _ctx.$emit("tabChange", item.id), item.id)
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-744d182b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/BottomNavBar.js.map
