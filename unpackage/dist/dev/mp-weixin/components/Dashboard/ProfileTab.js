"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      finalAvatarUrl: "",
      // 最终显示的头像 URL (转换 cloud:// 后的)
      stats: [
        { label: "发布作品", count: 0, color: "#5BB98A" },
        { label: "全部项目", count: 0, color: "#6C8EA4" },
        { label: "毛线库存", count: 0, color: "#F0A500" }
      ],
      settingsItems: [
        {
          icon: "notification",
          title: "通知设置",
          description: "管理推送通知偏好",
          color: "#6C8EA4"
        },
        {
          icon: "heart",
          title: "我的收藏",
          description: "查看收藏的图解和教程",
          color: "#FF8C82"
        },
        {
          icon: "star",
          title: "我的点赞",
          description: "浏览点赞的作品",
          color: "#F0A500"
        },
        {
          icon: "gear",
          title: "账户设置",
          description: "个人信息与偏好设置",
          color: "#6C8EA4",
          action: "editProfile"
        }
      ],
      helpItems: [
        {
          icon: "help",
          title: "帮助中心",
          description: "常见问题与使用指南"
        },
        {
          icon: "wallet",
          title: "使用条款",
          description: "服务条款与隐私政策"
        },
        {
          icon: "locked",
          title: "隐私安全",
          description: "数据安全与隐私保护"
        }
      ]
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    },
    hasLogin() {
      return uni_modules_uniIdPages_common_store.store.hasLogin;
    },
    // 原始头像数据
    rawAvatar() {
      if (!this.hasLogin)
        return null;
      if (this.userInfo.avatar_file && this.userInfo.avatar_file.url) {
        return this.userInfo.avatar_file.url;
      }
      if (this.userInfo.avatar && typeof this.userInfo.avatar === "string") {
        return this.userInfo.avatar;
      }
      return "/static/logo.png";
    },
    userName() {
      if (!this.hasLogin)
        return "未登录用户";
      return this.userInfo.nickname || this.userInfo.username || "编织爱好者";
    },
    userId() {
      return this.userInfo.username || this.userInfo._id || "";
    }
  },
  watch: {
    // 监听原始头像变化，进行转换
    rawAvatar: {
      immediate: true,
      handler(newVal) {
        this.processAvatar(newVal);
      }
    },
    hasLogin: {
      immediate: true,
      handler(val) {
        if (val) {
          this.$nextTick(() => {
            this.fetchStats();
          });
        }
      }
    }
  },
  mounted() {
    common_vendor.index.__f__("log", "at components/Dashboard/ProfileTab.vue:204", "[ProfileTab] mounted, hasLogin:", uni_modules_uniIdPages_common_store.store.hasLogin, "uid:", uni_modules_uniIdPages_common_store.store.userInfo && uni_modules_uniIdPages_common_store.store.userInfo._id);
    if (!uni_modules_uniIdPages_common_store.store.hasLogin && common_vendor.index.getStorageSync("uni_id_token")) {
      uni_modules_uniIdPages_common_store.mutations.updateUserInfo();
    }
    if (uni_modules_uniIdPages_common_store.store.hasLogin) {
      this.fetchStats();
    }
    setTimeout(() => {
      if (uni_modules_uniIdPages_common_store.store.hasLogin && this.stats[0].count === 0 && this.stats[1].count === 0 && this.stats[2].count === 0) {
        common_vendor.index.__f__("log", "at components/Dashboard/ProfileTab.vue:215", "[ProfileTab] 延迟兜底调用 fetchStats");
        this.fetchStats();
      }
    }, 1500);
    common_vendor.index.$on("refreshYarnList", this.fetchStats);
    common_vendor.index.$on("refreshProjectList", this.fetchStats);
    common_vendor.index.$on("refreshPostList", this.fetchStats);
  },
  beforeUnmount() {
    common_vendor.index.$off("refreshYarnList", this.fetchStats);
    common_vendor.index.$off("refreshProjectList", this.fetchStats);
    common_vendor.index.$off("refreshPostList", this.fetchStats);
  },
  methods: {
    async processAvatar(url) {
      if (!url) {
        this.finalAvatarUrl = "";
        return;
      }
      if (url.startsWith("cloud://")) {
        try {
          const result = await common_vendor.tr.getTempFileURL({
            fileList: [url]
          });
          if (result.fileList && result.fileList.length > 0) {
            this.finalAvatarUrl = result.fileList[0].tempFileURL;
          } else {
            this.finalAvatarUrl = url;
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at components/Dashboard/ProfileTab.vue:250", "头像地址转换失败", e);
          this.finalAvatarUrl = url;
        }
      } else {
        this.finalAvatarUrl = url;
      }
    },
    async fetchStats() {
      try {
        const uid = uni_modules_uniIdPages_common_store.store.userInfo && uni_modules_uniIdPages_common_store.store.userInfo._id;
        if (!uid) {
          common_vendor.index.__f__("warn", "at components/Dashboard/ProfileTab.vue:262", "[ProfileTab] 未获取到 uid");
          return;
        }
        const co = common_vendor.tr.importObject("knitting-co");
        const res = await co.getMyStats(uid);
        common_vendor.index.__f__("log", "at components/Dashboard/ProfileTab.vue:267", "[ProfileTab] getMyStats result:", JSON.stringify(res));
        if (res.errCode === 0 && res.stats) {
          this.stats[0].count = res.stats.posts;
          this.stats[1].count = res.stats.projects;
          this.stats[2].count = res.stats.yarns;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at components/Dashboard/ProfileTab.vue:274", "Fetch stats failed", e);
      }
    },
    handleAuthAction() {
      if (this.hasLogin) {
        this.handleLogout();
      } else {
        this.handleLogin();
      }
    },
    handleLogin() {
      common_vendor.index.navigateTo({
        url: "/uni_modules/uni-id-pages/pages/login/login-withoutpwd"
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            uni_modules_uniIdPages_common_store.mutations.logout();
            common_vendor.index.reLaunch({
              url: "/pages/dashboard/main"
            });
          }
        }
      });
    },
    handleSettingClick(item) {
      if (item.action === "editProfile") {
        common_vendor.index.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo"
        });
      }
    },
    handleUserInfoClick() {
      if (this.hasLogin) {
        common_vendor.index.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo"
        });
      } else {
        this.handleLogin();
      }
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
  return common_vendor.e({
    a: $data.finalAvatarUrl
  }, $data.finalAvatarUrl ? {
    b: $data.finalAvatarUrl
  } : {
    c: common_assets._imports_0$1
  }, {
    d: common_vendor.t($options.userName),
    e: $options.hasLogin
  }, $options.hasLogin ? {
    f: common_vendor.t($options.userId)
  } : {}, {
    g: common_vendor.t($options.hasLogin ? "退出" : "去登录"),
    h: !$options.hasLogin ? 1 : "",
    i: $options.hasLogin ? 1 : "",
    j: common_vendor.o((...args) => $options.handleAuthAction && $options.handleAuthAction(...args)),
    k: common_vendor.o((...args) => $options.handleUserInfoClick && $options.handleUserInfoClick(...args)),
    l: common_vendor.f($data.stats, (stat, index, i0) => {
      return {
        a: common_vendor.t(stat.count),
        b: stat.color,
        c: common_vendor.t(stat.label),
        d: index
      };
    }),
    m: common_vendor.f($data.settingsItems, (item, index, i0) => {
      return {
        a: item.color,
        b: "62992097-0-" + i0,
        c: common_vendor.p({
          type: item.icon,
          size: "20"
        }),
        d: item.color + "20",
        e: common_vendor.t(item.title),
        f: common_vendor.t(item.description),
        g: "62992097-1-" + i0,
        h: index,
        i: common_vendor.o(($event) => $options.handleSettingClick(item), index)
      };
    }),
    n: common_vendor.p({
      type: "forward",
      size: "20",
      color: "#999999"
    }),
    o: common_vendor.f($data.helpItems, (item, index, i0) => {
      return {
        a: "62992097-2-" + i0,
        b: common_vendor.p({
          type: item.icon,
          size: "20",
          color: "#6C8EA4"
        }),
        c: common_vendor.t(item.title),
        d: common_vendor.t(item.description),
        e: "62992097-3-" + i0,
        f: index,
        g: index !== $data.helpItems.length - 1 ? 1 : ""
      };
    }),
    p: common_vendor.p({
      type: "forward",
      size: "20",
      color: "#999999"
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-62992097"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/ProfileTab.js.map
