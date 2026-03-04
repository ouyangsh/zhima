"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      currentSubTab: "mine",
      works: [],
      page: 0,
      pageSize: 10,
      isLoading: false,
      noMore: false,
      currentUid: ""
    };
  },
  onLoad() {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
    this.loadData();
  },
  methods: {
    goBack() {
      common_vendor.index.$emit("refreshDiscover");
      common_vendor.index.navigateBack();
    },
    switchSubTab(tab) {
      if (this.currentSubTab === tab)
        return;
      this.currentSubTab = tab;
      this.works = [];
      this.page = 0;
      this.noMore = false;
      this.loadData();
    },
    async loadData() {
      if (this.isLoading || this.noMore)
        return;
      this.isLoading = true;
      try {
        let rawList = [];
        if (this.currentSubTab === "mine") {
          const uid = uni_modules_uniIdPages_common_store.store.userInfo && uni_modules_uniIdPages_common_store.store.userInfo._id;
          common_vendor.index.__f__("log", "at pages/post/list.vue:130", "[list] 当前用户 uid:", uid);
          if (!uid) {
            common_vendor.index.__f__("warn", "at pages/post/list.vue:132", "[list] 未获取到 uid，无法查询我发布的");
            return;
          }
          const co = common_vendor.tr.importObject("knitting-co");
          const res = await co.getMyPosts(uid, this.page, this.pageSize);
          common_vendor.index.__f__("log", "at pages/post/list.vue:137", "[list] getMyPosts result:", JSON.stringify(res));
          if (res.errCode !== 0) {
            common_vendor.index.__f__("error", "at pages/post/list.vue:139", "[list] getMyPosts error:", res.errMsg);
            return;
          }
          rawList = res.data || [];
        } else {
          const db = common_vendor.tr.database();
          const res = await db.collection("knitting-posts").orderBy("created_at", "desc").skip(this.page * this.pageSize).limit(this.pageSize).get();
          rawList = res.result.data;
        }
        if (rawList.length < this.pageSize) {
          this.noMore = true;
        }
        const coverFiles = rawList.filter((item) => item.cover && item.cover.startsWith("cloud://")).map((item) => item.cover);
        const avatarFiles = rawList.filter((item) => item.user_avatar && item.user_avatar.startsWith("cloud://")).map((item) => item.user_avatar);
        const allFiles = [.../* @__PURE__ */ new Set([...coverFiles, ...avatarFiles])];
        let fileMap = {};
        if (allFiles.length > 0) {
          try {
            const tempFilesRes = await common_vendor.tr.getTempFileURL({ fileList: allFiles });
            tempFilesRes.fileList.forEach((file) => {
              fileMap[file.fileID] = file.tempFileURL;
            });
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/post/list.vue:175", "Image convert failed", e);
          }
        }
        const newWorks = rawList.map((item) => ({
          ...item,
          imageUrl: fileMap[item.cover] || item.cover || "/static/default-cover.png",
          user_avatar: fileMap[item.user_avatar] || item.user_avatar
        }));
        this.works = [...this.works, ...newWorks];
        this.page++;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/list.vue:188", "获取作品列表失败", e);
      } finally {
        this.isLoading = false;
      }
    },
    loadMore() {
      this.loadData();
    },
    handleWorkClick(work) {
      common_vendor.index.navigateTo({
        url: "/pages/post/detail?id=" + work._id
      });
    },
    handleLongPress(work) {
      if (this.currentSubTab !== "mine")
        return;
      common_vendor.index.showActionSheet({
        itemList: ["编辑作品", "删除作品"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.handleEdit(work);
          } else if (res.tapIndex === 1) {
            this.handleDelete(work);
          }
        }
      });
    },
    handleEdit(work) {
      common_vendor.index.navigateTo({
        url: "/pages/post/create?id=" + work._id
      });
    },
    handleDelete(work) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个作品吗？删除后不可恢复。",
        confirmColor: "#FF4D4F",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "删除中..." });
            try {
              const db = common_vendor.tr.database();
              await db.collection("knitting-posts").doc(work._id).remove();
              this.works = this.works.filter((w) => w._id !== work._id);
              common_vendor.index.showToast({ title: "已删除" });
              common_vendor.index.$emit("refreshDiscover");
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/post/list.vue:237", "Delete failed", e);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
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
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      type: "back",
      size: "24",
      color: "#3A3A3A"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    d: ($data.menuButtonWidth || 80) + "px",
    e: $data.currentSubTab === "mine" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchSubTab("mine")),
    g: $data.currentSubTab === "all" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchSubTab("all")),
    i: common_vendor.f($data.works, (work, k0, i0) => {
      return {
        a: work.imageUrl,
        b: common_vendor.t(work.title),
        c: work.user_avatar || "/static/logo.png",
        d: common_vendor.t(work.user_name || "织友"),
        e: "bbac3d2e-1-" + i0,
        f: common_vendor.t(work.likes || 0),
        g: work._id,
        h: common_vendor.o(($event) => $options.handleWorkClick(work), work._id),
        i: common_vendor.o(($event) => $options.handleLongPress(work), work._id)
      };
    }),
    j: common_vendor.p({
      type: "heart-filled",
      size: "14",
      color: "#FF6B6B"
    }),
    k: $data.isLoading
  }, $data.isLoading ? {} : $data.noMore && $data.works.length > 0 ? {} : {}, {
    l: $data.noMore && $data.works.length > 0,
    m: !$data.isLoading && $data.works.length === 0
  }, !$data.isLoading && $data.works.length === 0 ? {
    n: common_vendor.p({
      type: "images",
      size: "48",
      color: "#CCCCCC"
    }),
    o: common_vendor.t($data.currentSubTab === "mine" ? "你还没有发布作品哦~" : "暂无作品~")
  } : {}, {
    p: $data.statusBarHeight + 44 + 44 + "px",
    q: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bbac3d2e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/post/list.js.map
