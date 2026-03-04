"use strict";
const common_vendor = require("../../common/vendor.js");
require("../../uni_modules/uni-id-pages/common/store.js");
const utils_seedData = require("../../utils/seed-data.js");
const _sfc_main = {
  data() {
    return {
      finishedWorks: [],
      activities: [],
      isLoading: false,
      tools: [
        {
          icon: "image",
          title: "花样图解",
          description: "输入花样简写，生成圆形图解",
          color: "#6C8EA4",
          action: "pattern"
        },
        {
          icon: "list",
          title: "术语翻译",
          description: "中英日术语对照",
          color: "#5BB98A",
          action: "dict"
        },
        {
          icon: "gear",
          title: "设置",
          description: "个性化设置与偏好",
          color: "#F0A500",
          action: "settings"
        },
        {
          icon: "help",
          title: "帮助中心",
          description: "使用指南与常见问题",
          color: "#FF8C82",
          action: "help"
        }
      ]
    };
  },
  async created() {
    this.isLoading = true;
    await this.fetchData();
    if (this.finishedWorks.length === 0 && this.activities.length === 0) {
      const seeded = await utils_seedData.seedDiscoverData();
      if (seeded) {
        await this.fetchData();
      }
    }
    this.isLoading = false;
    common_vendor.index.$on("refreshDiscover", () => {
      this.fetchData();
    });
  },
  beforeDestroy() {
    common_vendor.index.$off("refreshDiscover");
  },
  methods: {
    fetchData() {
      this.fetchWorks();
      this.fetchActivities();
    },
    async fetchWorks() {
      const db = common_vendor.tr.database();
      try {
        const userInfo = common_vendor.tr.getCurrentUserInfo();
        let query = db.collection("knitting-posts");
        if (userInfo.uid) {
          query = query.where({ user_id: userInfo.uid });
        }
        const res = await query.orderBy("created_at", "desc").limit(4).get();
        const rawList = res.result.data;
        const fileList = rawList.filter((item) => item.cover && item.cover.startsWith("cloud://")).map((item) => item.cover);
        let fileMap = {};
        if (fileList.length > 0) {
          try {
            const tempFilesRes = await common_vendor.tr.getTempFileURL({ fileList });
            tempFilesRes.fileList.forEach((file) => {
              fileMap[file.fileID] = file.tempFileURL;
            });
          } catch (e) {
            common_vendor.index.__f__("error", "at components/Dashboard/DiscoverTab.vue:189", "Discover items image convert failed", e);
          }
        }
        this.finishedWorks = rawList.map((item) => ({
          ...item,
          imageUrl: fileMap[item.cover] || item.cover || "/static/default-cover.png"
        }));
      } catch (e) {
        common_vendor.index.__f__("error", "at components/Dashboard/DiscoverTab.vue:198", "获取作品展示失败", e);
      }
    },
    async fetchActivities() {
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-activities").where("user_id == $env.uid").orderBy("created_at", "desc").limit(5).get();
        let activities = res.result.data;
        const fileList = activities.filter((item) => item.from_user_avatar && item.from_user_avatar.startsWith("cloud://")).map((item) => item.from_user_avatar);
        if (fileList.length > 0) {
          try {
            const tempFilesRes = await common_vendor.tr.getTempFileURL({ fileList });
            const fileMap = {};
            tempFilesRes.fileList.forEach((file) => {
              fileMap[file.fileID] = file.tempFileURL;
            });
            activities = activities.map((item) => ({
              ...item,
              from_user_avatar: fileMap[item.from_user_avatar] || item.from_user_avatar
            }));
          } catch (e) {
            common_vendor.index.__f__("error", "at components/Dashboard/DiscoverTab.vue:231", "Convert activity avatars failed", e);
          }
        }
        this.activities = activities;
      } catch (e) {
        common_vendor.index.__f__("error", "at components/Dashboard/DiscoverTab.vue:237", "获取动态失败", e);
      }
    },
    formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const minute = 60 * 1e3;
      const hour = 60 * minute;
      const day = 24 * hour;
      if (diff < minute)
        return "刚刚";
      if (diff < hour)
        return Math.floor(diff / minute) + "分钟前";
      if (diff < day)
        return Math.floor(diff / hour) + "小时前";
      if (diff < day * 7)
        return Math.floor(diff / day) + "天前";
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    handleSeeAllWorks() {
      common_vendor.index.navigateTo({ url: "/pages/post/list" });
    },
    handleWorkClick(work) {
      common_vendor.index.navigateTo({
        url: "/pages/post/detail?id=" + work._id
      });
    },
    handleToolClick(tool) {
      if (tool.action === "pattern") {
        common_vendor.index.navigateTo({ url: "/pages/pattern/viewer" });
      } else if (tool.action === "settings") {
        common_vendor.index.showToast({ title: "设置功能开发中", icon: "none" });
      } else {
        common_vendor.index.showToast({ title: tool.title + " 开发中", icon: "none" });
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
    a: common_vendor.o((...args) => $options.handleSeeAllWorks && $options.handleSeeAllWorks(...args)),
    b: $data.finishedWorks.length > 0
  }, $data.finishedWorks.length > 0 ? {
    c: common_vendor.f($data.finishedWorks, (work, k0, i0) => {
      return {
        a: work.imageUrl,
        b: common_vendor.t(work.title),
        c: "c5e15279-0-" + i0,
        d: common_vendor.t(work.likes || 0),
        e: work._id,
        f: common_vendor.o(($event) => $options.handleWorkClick(work), work._id)
      };
    }),
    d: common_vendor.p({
      type: "heart-filled",
      size: "12",
      color: "#fff"
    })
  } : {}, {
    e: $data.activities.length > 0
  }, $data.activities.length > 0 ? {
    f: common_vendor.f($data.activities, (activity, k0, i0) => {
      return common_vendor.e({
        a: activity.from_user_avatar
      }, activity.from_user_avatar ? {
        b: activity.from_user_avatar
      } : {
        c: common_vendor.t(activity.from_user_name ? activity.from_user_name[0].toUpperCase() : "U")
      }, {
        d: common_vendor.t(activity.from_user_name),
        e: activity.type === "like"
      }, activity.type === "like" ? {} : activity.type === "comment" ? {} : {
        g: common_vendor.t(activity.content)
      }, {
        f: activity.type === "comment",
        h: activity.target_title
      }, activity.target_title ? {
        i: common_vendor.t(activity.target_title)
      } : {}, {
        j: common_vendor.t($options.formatTime(activity.created_at)),
        k: activity._id
      });
    })
  } : {}, {
    g: common_vendor.f($data.tools, (tool, index, i0) => {
      return {
        a: "c5e15279-1-" + i0,
        b: common_vendor.p({
          type: tool.icon,
          size: "24",
          color: tool.color
        }),
        c: tool.color + "20",
        d: common_vendor.t(tool.title),
        e: common_vendor.t(tool.description),
        f: "c5e15279-2-" + i0,
        g: index,
        h: common_vendor.o(($event) => $options.handleToolClick(tool), index)
      };
    }),
    h: common_vendor.p({
      type: "right",
      size: "16",
      color: "#CCCCCC"
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c5e15279"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/DiscoverTab.js.map
