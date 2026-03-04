"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const TopNavBar = () => "../../components/Dashboard/TopNavBar.js";
const BottomNavBar = () => "../../components/Dashboard/BottomNavBar.js";
const HomeTab = () => "../../components/Dashboard/HomeTab.js";
const YarnTab = () => "../../components/Dashboard/YarnTab.js";
const DiscoverTab = () => "../../components/Dashboard/DiscoverTab.js";
const ProfileTab = () => "../../components/Dashboard/ProfileTab.js";
const _sfc_main = {
  components: {
    TopNavBar,
    BottomNavBar,
    HomeTab,
    YarnTab,
    DiscoverTab,
    ProfileTab
  },
  data() {
    return {
      activeTab: "home"
    };
  },
  onLoad(options) {
    if (common_vendor.index.getStorageSync("uni_id_token")) {
      uni_modules_uniIdPages_common_store.mutations.updateUserInfo();
    }
    if (options.tab) {
      this.activeTab = options.tab;
    }
  },
  onShow() {
    if (common_vendor.index.getStorageSync("uni_id_token")) {
      uni_modules_uniIdPages_common_store.mutations.updateUserInfo();
    }
    common_vendor.index.$emit("refreshYarnList");
    const targetTab = common_vendor.index.getStorageSync("dashboard_active_tab");
    if (targetTab) {
      this.activeTab = targetTab;
      common_vendor.index.removeStorageSync("dashboard_active_tab");
    }
  },
  computed: {
    pageTitle() {
      switch (this.activeTab) {
        case "home":
          return "我的项目";
        case "yarn":
          return "我的毛线库";
        case "discover":
          return "发现";
        case "profile":
          return "个人中心";
        default:
          return "我的项目";
      }
    }
  },
  methods: {
    handleTabChange(tabId) {
      this.activeTab = tabId;
    },
    handleNewProject() {
      if (this.activeTab === "yarn") {
        common_vendor.index.navigateTo({
          url: "/pages/yarn/create"
        });
      } else if (this.activeTab === "discover") {
        common_vendor.index.navigateTo({
          url: "/pages/post/create"
        });
      } else {
        common_vendor.index.navigateTo({
          url: "/pages/project/create"
        });
      }
    },
    handleUserClick() {
      common_vendor.index.navigateTo({
        url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo"
      });
    }
  }
};
if (!Array) {
  const _component_TopNavBar = common_vendor.resolveComponent("TopNavBar");
  const _component_HomeTab = common_vendor.resolveComponent("HomeTab");
  const _component_YarnTab = common_vendor.resolveComponent("YarnTab");
  const _component_DiscoverTab = common_vendor.resolveComponent("DiscoverTab");
  const _component_ProfileTab = common_vendor.resolveComponent("ProfileTab");
  const _component_BottomNavBar = common_vendor.resolveComponent("BottomNavBar");
  (_component_TopNavBar + _component_HomeTab + _component_YarnTab + _component_DiscoverTab + _component_ProfileTab + _component_BottomNavBar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o($options.handleNewProject),
    b: common_vendor.o($options.handleUserClick),
    c: common_vendor.p({
      title: $options.pageTitle
    }),
    d: $data.activeTab === "home",
    e: common_vendor.o($options.handleNewProject),
    f: $data.activeTab === "yarn",
    g: $data.activeTab === "discover",
    h: $data.activeTab === "profile",
    i: common_vendor.o($options.handleTabChange),
    j: common_vendor.p({
      activeTab: $data.activeTab
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-515a70f3"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/dashboard/main.js.map
