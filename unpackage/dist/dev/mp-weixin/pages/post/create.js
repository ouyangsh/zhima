"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      formData: {
        title: "",
        content: ""
      },
      imageList: [],
      // { tempPath, cloudPath, uploading, uploaded }
      submitting: false
    };
  },
  onLoad() {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    handleChooseImages() {
      const remaining = 9 - this.imageList.length;
      if (remaining <= 0) {
        return common_vendor.index.showToast({ title: "最多上传9张图片", icon: "none" });
      }
      common_vendor.index.chooseImage({
        count: remaining,
        success: (res) => {
          const newImages = res.tempFilePaths.map((path) => ({
            tempPath: path,
            cloudPath: "",
            uploading: true,
            uploaded: false
          }));
          this.imageList = [...this.imageList, ...newImages];
          newImages.forEach((img, idx) => {
            const listIndex = this.imageList.length - newImages.length + idx;
            this.uploadImage(listIndex, img.tempPath);
          });
        }
      });
    },
    async uploadImage(index, filePath) {
      try {
        const uploadRes = await common_vendor.tr.uploadFile({
          filePath,
          cloudPath: `post-images/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`
        });
        if (this.imageList[index]) {
          this.imageList[index].cloudPath = uploadRes.fileID;
          this.imageList[index].uploading = false;
          this.imageList[index].uploaded = true;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/post/create.vue:151", "Upload failed", err);
        common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
        if (this.imageList[index]) {
          this.imageList[index].uploading = false;
        }
      }
    },
    removeImage(index) {
      this.imageList.splice(index, 1);
    },
    previewImage(index) {
      const urls = this.imageList.map((img) => img.tempPath);
      common_vendor.index.previewImage({
        urls,
        current: urls[index]
      });
    },
    async handlePublish() {
      var _a;
      if (!this.formData.title.trim()) {
        return common_vendor.index.showToast({ title: "请输入标题", icon: "none" });
      }
      if (this.imageList.length === 0) {
        return common_vendor.index.showToast({ title: "请至少上传一张图片", icon: "none" });
      }
      const uploading = this.imageList.filter((img) => img.uploading);
      if (uploading.length > 0) {
        return common_vendor.index.showToast({ title: "图片还在上传中，请稍候", icon: "none" });
      }
      const failedImages = this.imageList.filter((img) => !img.uploaded);
      if (failedImages.length > 0) {
        return common_vendor.index.showToast({ title: "部分图片上传失败，请删除后重试", icon: "none" });
      }
      this.submitting = true;
      common_vendor.index.showLoading({ title: "发布中..." });
      const db = common_vendor.tr.database();
      let userInfo = uni_modules_uniIdPages_common_store.store.userInfo;
      if (!userInfo.nickname) {
        try {
          await uni_modules_uniIdPages_common_store.mutations.updateUserInfo();
          userInfo = uni_modules_uniIdPages_common_store.store.userInfo;
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/post/create.vue:198", "Update user info failed", e);
        }
      }
      const images = this.imageList.map((img) => img.cloudPath);
      const postData = {
        title: this.formData.title.trim(),
        content: this.formData.content.trim(),
        images,
        cover: images[0],
        // 第一张图作为封面
        user_name: userInfo.nickname || "织友",
        user_avatar: ((_a = userInfo.avatar_file) == null ? void 0 : _a.url) || "/static/logo.png",
        likes: 0,
        views: 0
      };
      db.collection("knitting-posts").add(postData).then(() => {
        common_vendor.index.showToast({ title: "发布成功" });
        common_vendor.index.$emit("refreshDiscover");
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/post/create.vue:222", "Publish failed", err);
        common_vendor.index.showToast({ title: "发布失败", icon: "none" });
      }).finally(() => {
        this.submitting = false;
        common_vendor.index.hideLoading();
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
    e: common_vendor.t($data.imageList.length),
    f: common_vendor.f($data.imageList, (img, index, i0) => {
      return common_vendor.e({
        a: img.tempPath,
        b: common_vendor.o(($event) => $options.previewImage(index), index),
        c: "4a9252c8-1-" + i0,
        d: common_vendor.o(($event) => $options.removeImage(index), index),
        e: index === 0
      }, index === 0 ? {} : {}, {
        f: index
      });
    }),
    g: common_vendor.p({
      type: "clear",
      size: "20",
      color: "#FF4D4F"
    }),
    h: $data.imageList.length < 9
  }, $data.imageList.length < 9 ? {
    i: common_vendor.p({
      type: "plusempty",
      size: "32",
      color: "#CCCCCC"
    }),
    j: common_vendor.o((...args) => $options.handleChooseImages && $options.handleChooseImages(...args))
  } : {}, {
    k: common_vendor.t($data.formData.title.length),
    l: $data.formData.title,
    m: common_vendor.o(($event) => $data.formData.title = $event.detail.value),
    n: $data.formData.content,
    o: common_vendor.o(($event) => $data.formData.content = $event.detail.value),
    p: $data.statusBarHeight + 44 + "px",
    q: common_vendor.t($data.submitting ? "发布中..." : "发布作品"),
    r: $data.submitting,
    s: common_vendor.o((...args) => $options.handlePublish && $options.handlePublish(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4a9252c8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/post/create.js.map
