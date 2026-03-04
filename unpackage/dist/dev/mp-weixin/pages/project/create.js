"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        name: "",
        description: "",
        total_rows: "",
        current_row: "",
        cover: ""
      },
      selectedYarns: [],
      // 已选中的毛线
      availableYarns: [],
      // 可选的毛线列表
      coverPath: "",
      // 用于显示的本地或临时链接
      submitting: false,
      statusBarHeight: 20,
      menuButtonWidth: 0,
      isEditMode: false,
      projectId: ""
    };
  },
  onLoad(options) {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
    this.fetchAvailableYarns();
    if (options.id) {
      this.projectId = options.id;
      this.isEditMode = true;
      this.fetchProjectDetails(options.id);
    }
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async fetchProjectDetails(id) {
      common_vendor.index.showLoading({ title: "加载中" });
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-projects").doc(id).get();
        if (res.result.data.length > 0) {
          const project = res.result.data[0];
          this.formData = {
            name: project.name,
            description: project.description,
            total_rows: project.total_rows,
            current_row: project.current_row,
            cover: project.cover
          };
          if (project.cover) {
            if (project.cover.startsWith("cloud://")) {
              const fileRes = await common_vendor.tr.getTempFileURL({ fileList: [project.cover] });
              if (fileRes.fileList && fileRes.fileList.length > 0) {
                this.coverPath = fileRes.fileList[0].tempFileURL;
              }
            } else {
              this.coverPath = project.cover;
            }
          }
          if (project.yarns) {
            this.selectedYarns = project.yarns.map((y) => ({
              id: y.id,
              brand: y.name,
              color: y.color,
              colorCode: ""
              // Assuming color code isn't stored in simple view
            }));
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/project/create.vue:233", "Fetch project failed", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // ... existing fetchAvailableYarns ...
    fetchAvailableYarns() {
      const cachedYarns = common_vendor.index.getStorageSync("cached_yarn_list_v5");
      if (cachedYarns) {
        common_vendor.index.__f__("log", "at pages/project/create.vue:244", "ProjectCreate: 使用 YarnTab 缓存列表 v5");
        this.availableYarns = cachedYarns;
        return;
      }
      const db = common_vendor.tr.database();
      db.collection("knitting-yarns").where("user_id == $env.uid").orderBy("created_at", "desc").get().then((res) => {
        const list = res.result.data.map((item) => ({
          id: item._id,
          color: item.color,
          brand: item.name,
          colorCode: item.color,
          ballsCount: item.quantity,
          imageUrl: item.image
        }));
        this.availableYarns = list;
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/project/create.vue:268", "获取毛线列表失败", err);
      });
    },
    openYarnSelector() {
      this.$refs.yarnPopup.open();
    },
    closeYarnSelector() {
      this.$refs.yarnPopup.close();
    },
    toggleYarn(yarn) {
      const index = this.selectedYarns.findIndex((y) => y.id === yarn.id);
      if (index > -1) {
        this.selectedYarns.splice(index, 1);
      } else {
        this.selectedYarns.push(yarn);
      }
    },
    isYarnSelected(id) {
      return this.selectedYarns.some((y) => y.id === id);
    },
    removeYarn(index) {
      this.selectedYarns.splice(index, 1);
    },
    handleUploadCover() {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.coverPath = tempFilePath;
          common_vendor.index.showLoading({ title: "上传中..." });
          common_vendor.tr.uploadFile({
            filePath: tempFilePath,
            cloudPath: `project-covers/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
            success: (uploadRes) => {
              this.formData.cover = uploadRes.fileID;
              common_vendor.index.__f__("log", "at pages/project/create.vue:307", "上传成功，fileID:", uploadRes.fileID);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/project/create.vue:310", "上传失败", err);
              common_vendor.index.showToast({ title: "上传失败", icon: "none" });
              this.coverPath = "";
            },
            complete: () => {
              common_vendor.index.hideLoading();
            }
          });
        }
      });
    },
    handleSubmit() {
      if (!this.formData.name.trim()) {
        return common_vendor.index.showToast({ title: "请输入项目名称", icon: "none" });
      }
      this.submitting = true;
      const db = common_vendor.tr.database();
      const yarnsToSave = this.selectedYarns.map((y) => ({
        id: y.id,
        name: y.brand,
        color: y.color
      }));
      const current = Number(this.formData.current_row) || 0;
      const total = Number(this.formData.total_rows) || 0;
      let status = "planning";
      if (current > 0) {
        status = "in_progress";
      }
      if (total > 0 && current >= total) {
        status = "completed";
      }
      const dataToSave = {
        ...this.formData,
        total_rows: total,
        current_row: current,
        status,
        yarns: yarnsToSave
        // updated_at: Date.now() // Removed: handled by schema forceDefaultValue
      };
      let promise;
      if (this.isEditMode) {
        promise = db.collection("knitting-projects").doc(this.projectId).update(dataToSave);
      } else {
        promise = db.collection("knitting-projects").add(dataToSave);
      }
      promise.then((res) => {
        common_vendor.index.showToast({ title: this.isEditMode ? "更新成功" : "创建成功" });
        common_vendor.index.removeStorageSync("cached_project_list_v5");
        setTimeout(() => {
          common_vendor.index.navigateBack();
          common_vendor.index.$emit("refreshProjectList");
        }, 1500);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/project/create.vue:375", "操作失败", err);
        common_vendor.index.showToast({ title: "操作失败：" + err.message, icon: "none" });
      }).finally(() => {
        this.submitting = false;
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_icons2 + _easycom_uni_popup2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_popup)();
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
    d: common_vendor.t($data.isEditMode ? "编辑项目" : "新建项目"),
    e: $data.menuButtonWidth + "px",
    f: $data.coverPath
  }, $data.coverPath ? {
    g: $data.coverPath
  } : {
    h: common_vendor.p({
      type: "camera-filled",
      size: "32",
      color: "#999999"
    })
  }, {
    i: common_vendor.o((...args) => $options.handleUploadCover && $options.handleUploadCover(...args)),
    j: $data.formData.name,
    k: common_vendor.o(($event) => $data.formData.name = $event.detail.value),
    l: $data.formData.description,
    m: common_vendor.o(($event) => $data.formData.description = $event.detail.value),
    n: common_vendor.p({
      type: "plusempty",
      size: "14",
      color: "#6C8EA4"
    }),
    o: common_vendor.o((...args) => $options.openYarnSelector && $options.openYarnSelector(...args)),
    p: $data.selectedYarns.length > 0
  }, $data.selectedYarns.length > 0 ? {
    q: common_vendor.f($data.selectedYarns, (yarn, index, i0) => {
      return {
        a: yarn.color,
        b: common_vendor.t(yarn.brand),
        c: common_vendor.t(yarn.colorCode),
        d: "f3e7bcea-3-" + i0,
        e: common_vendor.o(($event) => $options.removeYarn(index), yarn.id),
        f: yarn.id
      };
    }),
    r: common_vendor.p({
      type: "closeempty",
      size: "12",
      color: "#999999"
    })
  } : {
    s: common_vendor.o((...args) => $options.openYarnSelector && $options.openYarnSelector(...args))
  }, {
    t: $data.formData.total_rows,
    v: common_vendor.o(($event) => $data.formData.total_rows = $event.detail.value),
    w: $data.formData.current_row,
    x: common_vendor.o(($event) => $data.formData.current_row = $event.detail.value),
    y: $data.statusBarHeight + 44 + "px",
    z: common_vendor.t($data.submitting ? "保存中..." : $data.isEditMode ? "保存修改" : "创建项目"),
    A: $data.submitting,
    B: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    C: common_vendor.p({
      type: "closeempty",
      size: "20",
      color: "#999"
    }),
    D: common_vendor.o((...args) => $options.closeYarnSelector && $options.closeYarnSelector(...args)),
    E: common_vendor.f($data.availableYarns, (yarn, k0, i0) => {
      return common_vendor.e({
        a: yarn.imageUrl,
        b: common_vendor.t(yarn.brand),
        c: yarn.color,
        d: common_vendor.t(yarn.colorCode),
        e: common_vendor.t(yarn.ballsCount),
        f: $options.isYarnSelected(yarn.id)
      }, $options.isYarnSelected(yarn.id) ? {
        g: "f3e7bcea-6-" + i0 + ",f3e7bcea-4",
        h: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#fff"
        })
      } : {}, {
        i: yarn.id,
        j: common_vendor.o(($event) => $options.toggleYarn(yarn), yarn.id),
        k: $options.isYarnSelected(yarn.id) ? 1 : ""
      });
    }),
    F: $data.availableYarns.length === 0
  }, $data.availableYarns.length === 0 ? {} : {}, {
    G: common_vendor.o((...args) => $options.closeYarnSelector && $options.closeYarnSelector(...args)),
    H: common_vendor.sr("yarnPopup", "f3e7bcea-4"),
    I: common_vendor.p({
      type: "bottom",
      ["background-color"]: "#fff"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f3e7bcea"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/project/create.js.map
