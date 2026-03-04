"use strict";
const common_vendor = require("../../common/vendor.js");
const YarnCard = () => "./YarnCard.js";
const _sfc_main = {
  components: {
    YarnCard
  },
  data() {
    return {
      yarnItems: [],
      loading: false
    };
  },
  mounted() {
    this.fetchYarns();
    common_vendor.index.$on("refreshYarnList", () => this.fetchYarns(true));
  },
  destroyed() {
    common_vendor.index.$off("refreshYarnList");
  },
  methods: {
    fetchYarns(forceRefresh = false) {
      if (!forceRefresh) {
        const cachedYarns = common_vendor.index.getStorageSync("cached_yarn_list_v5");
        if (cachedYarns) {
          const hasRawCloudUrl = cachedYarns.some((item) => item.imageUrl && item.imageUrl.startsWith("cloud://"));
          if (!hasRawCloudUrl) {
            common_vendor.index.__f__("log", "at components/Dashboard/YarnTab.vue:90", "YarnTab: 使用缓存数据的毛线列表 v5");
            this.yarnItems = cachedYarns;
            return;
          }
          common_vendor.index.__f__("log", "at components/Dashboard/YarnTab.vue:94", "YarnTab: 缓存包含未转换图片，强制刷新");
        }
      }
      this.loading = true;
      const db = common_vendor.tr.database();
      Promise.all([
        db.collection("knitting-yarns").where("user_id == $env.uid").orderBy("created_at", "desc").get(),
        db.collection("knitting-projects").where("user_id == $env.uid").field("yarns").get()
      ]).then(async ([yarnRes, projectRes]) => {
        const rawList = yarnRes.result.data;
        const projects = projectRes.result.data;
        common_vendor.index.__f__("log", "at components/Dashboard/YarnTab.vue:109", "YarnTab: 获取到的项目列表:", JSON.stringify(projects));
        const yarnUsageCount = {};
        if (projects && projects.length > 0) {
          projects.forEach((project) => {
            if (project.yarns && Array.isArray(project.yarns)) {
              project.yarns.forEach((yarn) => {
                if (yarn.id) {
                  yarnUsageCount[yarn.id] = (yarnUsageCount[yarn.id] || 0) + 1;
                }
              });
            }
          });
        }
        const fileList = rawList.filter((item) => item.image && item.image.startsWith("cloud://")).map((item) => item.image);
        let fileMap = {};
        if (fileList.length > 0) {
          try {
            const tempFilesRes = await common_vendor.tr.getTempFileURL({
              fileList
            });
            tempFilesRes.fileList.forEach((file) => {
              fileMap[file.fileID] = file.tempFileURL;
            });
          } catch (err) {
            common_vendor.index.__f__("error", "at components/Dashboard/YarnTab.vue:140", "转换图片链接失败", err);
          }
        }
        const list = rawList.map((item) => ({
          id: item._id,
          color: item.color,
          brand: item.name,
          description: item.description,
          colorCode: item.color,
          weight: Number(item.weight) || 0,
          ballsCount: item.quantity,
          imageUrl: fileMap[item.image] || item.image,
          relatedProjects: yarnUsageCount[item._id] || 0
        }));
        this.yarnItems = list;
        common_vendor.index.__f__("log", "at components/Dashboard/YarnTab.vue:157", "YarnTab: 处理后的毛线列表:", list);
        common_vendor.index.setStorageSync("cached_yarn_list_v5", list);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at components/Dashboard/YarnTab.vue:161", "获取列表失败", err);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      }).finally(() => {
        this.loading = false;
      });
    },
    handleLongPress(yarn) {
      common_vendor.index.showActionSheet({
        itemList: ["编辑", "删除"],
        itemColor: "#333333",
        success: (res) => {
          if (res.tapIndex === 0) {
            this.editYarn(yarn.id);
          } else if (res.tapIndex === 1) {
            this.deleteYarn(yarn.id);
          }
        }
      });
    },
    editYarn(id) {
      common_vendor.index.navigateTo({
        url: `/pages/yarn/create?id=${id}`
      });
    },
    deleteYarn(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后无法恢复，确定要删除吗？",
        success: (res) => {
          if (res.confirm) {
            const db = common_vendor.tr.database();
            db.collection("knitting-yarns").doc(id).remove().then(() => {
              common_vendor.index.showToast({ title: "删除成功" });
              common_vendor.index.removeStorageSync("cached_yarn_list_v5");
              this.fetchYarns(true);
            }).catch((err) => {
              common_vendor.index.__f__("error", "at components/Dashboard/YarnTab.vue:201", "删除毛线失败", err);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            });
          }
        }
      });
    }
  },
  computed: {
    totalWeight() {
      return this.yarnItems.reduce((sum, item) => sum + item.weight * item.ballsCount, 0);
    },
    totalBalls() {
      return this.yarnItems.reduce((sum, item) => sum + item.ballsCount, 0);
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_YarnCard = common_vendor.resolveComponent("YarnCard");
  (_easycom_uni_icons2 + _component_YarnCard)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      type: "search",
      size: "16",
      color: "#999999"
    }),
    b: common_vendor.p({
      type: "tune",
      size: "16",
      color: "#666666"
    }),
    c: common_vendor.t($data.yarnItems.length),
    d: common_vendor.t($options.totalBalls),
    e: common_vendor.t($options.totalWeight),
    f: common_vendor.f($data.yarnItems, (yarn, k0, i0) => {
      return {
        a: yarn.id,
        b: common_vendor.o(($event) => $options.handleLongPress(yarn), yarn.id),
        c: "51f2448a-2-" + i0,
        d: common_vendor.p({
          color: yarn.color,
          brand: yarn.brand,
          description: yarn.description,
          colorCode: yarn.colorCode,
          weight: yarn.weight,
          ballsCount: yarn.ballsCount,
          imageUrl: yarn.imageUrl,
          relatedProjects: yarn.relatedProjects
        })
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-51f2448a"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/YarnTab.js.map
