"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        name: "",
        description: "",
        color: "",
        weight: "",
        quantity: 1,
        image: "",
        project_id: ""
        // 暂留空
      },
      imagePath: "",
      // 本地预览路径
      submitting: false,
      statusBarHeight: 20,
      menuButtonWidth: 0,
      isEditMode: false,
      yarnId: "",
      isPopupOpen: false,
      // 弹窗开启状态
      // 自定义取色器状态
      hsv: { h: 210, s: 100, v: 100 },
      cursorX: 0,
      cursorY: 0,
      svPanelWidth: 0,
      svPanelHeight: 0,
      svPanelHeight: 0,
      inputHex: "#1B73CC",
      previewColor: "#1B73CC",
      isInternalUpdate: false,
      // Flag to prevent watcher loop
      presetColors: [
        "#FF0000",
        "#FF7F00",
        "#FFFF00",
        "#00FF00",
        "#00FFFF",
        "#0000FF",
        "#8B00FF",
        // 彩虹
        "#FFFFFF",
        "#000000",
        "#808080",
        "#A52A2A",
        "#FFC0CB"
        // 基础
      ]
    };
  },
  onLoad(options) {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
    if (options.id) {
      this.yarnId = options.id;
      this.isEditMode = true;
      this.fetchYarnDetails(options.id);
    }
    this.$watch("inputHex", (newVal) => {
      if (this.isInternalUpdate) {
        this.isInternalUpdate = false;
        return;
      }
      if (!newVal)
        return;
      let cleanVal = newVal.trim();
      const isHex = /^#?([0-9A-Fa-f]{6})$/.test(cleanVal);
      if (isHex) {
        let fullHex = cleanVal;
        if (!fullHex.startsWith("#"))
          fullHex = "#" + fullHex;
        this.previewColor = fullHex;
        this.topColorToHsv(fullHex);
      }
    });
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async fetchYarnDetails(id) {
      common_vendor.index.showLoading({ title: "加载中" });
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-yarns").doc(id).get();
        if (res.result.data.length > 0) {
          const yarn = res.result.data[0];
          this.formData = {
            name: yarn.name,
            description: yarn.description,
            color: yarn.color,
            weight: yarn.weight,
            quantity: yarn.quantity,
            image: yarn.image,
            project_id: yarn.project_id
          };
          if (yarn.image) {
            if (yarn.image.startsWith("cloud://")) {
              const fileRes = await common_vendor.tr.getTempFileURL({ fileList: [yarn.image] });
              if (fileRes.fileList && fileRes.fileList.length > 0) {
                this.imagePath = fileRes.fileList[0].tempFileURL;
              }
            } else {
              this.imagePath = yarn.image;
            }
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/yarn/create.vue:275", "Fetch yarn failed", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // ... rest of existing methods
    openColorPicker() {
      this.$refs.colorPopup.open();
      const color = this.formData.color || "#1B73CC";
      this.inputHex = color;
      this.previewColor = color;
      this.topColorToHsv(color);
      this.$nextTick(() => {
        setTimeout(() => {
          this.getSvPanelRect();
        }, 300);
      });
    },
    closeColorPicker() {
      this.$refs.colorPopup.close();
    },
    onPopupChange(e) {
      this.isPopupOpen = e.show;
    },
    confirmCustomColor() {
      this.formData.color = this.inputHex;
      this.closeColorPicker();
    },
    // --- 自定义取色器逻辑 ---
    getSvPanelRect() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".sv-panel").boundingClientRect((data) => {
        if (data) {
          this.svPanelWidth = data.width;
          this.svPanelHeight = data.height;
          this.updateCursorFromHsv();
        }
      }).exec();
    },
    updateCursorFromHsv() {
      if (!this.svPanelWidth)
        return;
      this.cursorX = this.hsv.s / 100 * this.svPanelWidth;
      this.cursorY = (1 - this.hsv.v / 100) * this.svPanelHeight;
    },
    handleSvTouch(e) {
      if (!this.svPanelWidth)
        return;
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".sv-panel").boundingClientRect((rect) => {
        if (rect) {
          const touch = e.touches[0];
          let clientX = touch.clientX;
          let clientY = touch.clientY;
          let localX = clientX - rect.left;
          let localY = clientY - rect.top;
          localX = Math.max(0, Math.min(localX, rect.width));
          localY = Math.max(0, Math.min(localY, rect.height));
          this.cursorX = localX;
          this.cursorY = localY;
          const s = localX / rect.width * 100;
          const v = (1 - localY / rect.height) * 100;
          this.hsv.s = Math.round(s);
          this.hsv.v = Math.round(v);
          this.updateColorFromHsv();
        }
      }).exec();
    },
    onHueChanging(e) {
      this.hsv.h = e.detail.value;
      this.updateColorFromHsv();
    },
    onHueChange(e) {
      this.hsv.h = e.detail.value;
      this.updateColorFromHsv();
    },
    updateColorFromHsv() {
      const { h, s, v } = this.hsv;
      const rgb = this.hsvToRgb(h, s, v);
      const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      this.isInternalUpdate = true;
      this.inputHex = hex;
      this.previewColor = hex;
    },
    selectPreset(color) {
      this.inputHex = color;
    },
    // --- 颜色算法 ---
    topColorToHsv(hex) {
      const rgb = this.hexToRgb(hex);
      if (rgb) {
        const newHsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.hsv.h = newHsv.h;
        this.hsv.s = newHsv.s;
        this.hsv.v = newHsv.v;
        this.hsv = { ...newHsv };
        this.$forceUpdate();
        this.$nextTick(() => {
          this.updateCursorFromHsv();
        });
      }
    },
    hexToRgb(hex) {
      if (!hex)
        return null;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    },
    hsvToRgb(h, s, v) {
      s = s / 100;
      v = v / 100;
      h = h / 360;
      let r, g, b;
      let i = Math.floor(h * 6);
      let f = h * 6 - i;
      let p = v * (1 - s);
      let q = v * (1 - f * s);
      let t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0:
          r = v, g = t, b = p;
          break;
        case 1:
          r = q, g = v, b = p;
          break;
        case 2:
          r = p, g = v, b = t;
          break;
        case 3:
          r = p, g = q, b = v;
          break;
        case 4:
          r = t, g = p, b = v;
          break;
        case 5:
          r = v, g = p, b = q;
          break;
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    },
    rgbToHsv(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let h, s, v = max;
      let d = max - min;
      s = max === 0 ? 0 : d / max;
      if (max === min) {
        h = 0;
      } else {
        if (max === r) {
          h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
          h = (b - r) / d + 2;
        } else if (max === b) {
          h = (r - g) / d + 4;
        }
        h /= 6;
      }
      return {
        h: Math.round(h * 360) || 0,
        // Ensure no NaN
        s: Math.round(s * 100),
        v: Math.round(v * 100)
      };
    },
    changeQuantity(delta) {
      let newVal = (Number(this.formData.quantity) || 0) + delta;
      if (newVal < 1)
        newVal = 1;
      this.formData.quantity = newVal;
    },
    handleUploadImage() {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.imagePath = tempFilePath;
          common_vendor.index.showLoading({ title: "上传中..." });
          common_vendor.tr.uploadFile({
            filePath: tempFilePath,
            cloudPath: `yarn-images/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
            success: (uploadRes) => {
              this.formData.image = uploadRes.fileID;
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/yarn/create.vue:488", "上传失败", err);
              common_vendor.index.showToast({ title: "上传失败", icon: "none" });
              this.imagePath = "";
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
        return common_vendor.index.showToast({ title: "请输入毛线名称", icon: "none" });
      }
      this.submitting = true;
      const db = common_vendor.tr.database();
      const dataToSave = {
        ...this.formData,
        quantity: Number(this.formData.quantity) || 1
      };
      let promise;
      if (this.isEditMode) {
        promise = db.collection("knitting-yarns").doc(this.yarnId).update(dataToSave);
      } else {
        promise = db.collection("knitting-yarns").add(dataToSave);
      }
      promise.then((res) => {
        common_vendor.index.showToast({ title: this.isEditMode ? "更新成功" : "保存成功" });
        common_vendor.index.getStorageSync("cached_yarn_list_v5");
        setTimeout(() => {
          common_vendor.index.navigateBack();
          common_vendor.index.$emit("refreshYarnList");
        }, 1500);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/yarn/create.vue:528", "保存失败", err);
        common_vendor.index.showToast({ title: "保存失败：" + err.message, icon: "none" });
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
    d: common_vendor.t($data.isEditMode ? "编辑毛线" : "添加毛线"),
    e: $data.menuButtonWidth + "px",
    f: $data.imagePath
  }, $data.imagePath ? {
    g: $data.imagePath
  } : {
    h: common_vendor.p({
      type: "camera-filled",
      size: "32",
      color: "#999999"
    })
  }, {
    i: common_vendor.o((...args) => $options.handleUploadImage && $options.handleUploadImage(...args)),
    j: $data.formData.name,
    k: common_vendor.o(($event) => $data.formData.name = $event.detail.value),
    l: $data.formData.color
  }, $data.formData.color ? {
    m: $data.formData.color || "#F0F0F0"
  } : {}, {
    n: common_vendor.t($data.formData.color || "点击选择颜色"),
    o: common_vendor.n({
      placeholder: !$data.formData.color
    }),
    p: common_vendor.o((...args) => $options.openColorPicker && $options.openColorPicker(...args)),
    q: $data.formData.weight,
    r: common_vendor.o(($event) => $data.formData.weight = $event.detail.value),
    s: common_vendor.p({
      type: "minus",
      size: "18",
      color: "#666"
    }),
    t: common_vendor.o(($event) => $options.changeQuantity(-1)),
    v: $data.formData.quantity,
    w: common_vendor.o(($event) => $data.formData.quantity = $event.detail.value),
    x: common_vendor.p({
      type: "plus",
      size: "18",
      color: "#666"
    }),
    y: common_vendor.o(($event) => $options.changeQuantity(1)),
    z: $data.formData.description,
    A: common_vendor.o(($event) => $data.formData.description = $event.detail.value),
    B: $data.statusBarHeight + 44 + "px",
    C: common_vendor.t($data.submitting ? "保存中..." : $data.isEditMode ? "保存修改" : "保存毛线"),
    D: $data.submitting,
    E: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    F: $data.cursorX + "px",
    G: $data.cursorY + "px",
    H: $data.previewColor,
    I: "hsl(" + $data.hsv.h + ", 100%, 50%)",
    J: common_vendor.o((...args) => $options.handleSvTouch && $options.handleSvTouch(...args)),
    K: common_vendor.o((...args) => $options.handleSvTouch && $options.handleSvTouch(...args)),
    L: $data.hsv.h,
    M: common_vendor.o((...args) => $options.onHueChanging && $options.onHueChanging(...args)),
    N: common_vendor.o((...args) => $options.onHueChange && $options.onHueChange(...args)),
    O: $data.previewColor,
    P: $data.inputHex,
    Q: common_vendor.o(($event) => $data.inputHex = $event.detail.value),
    R: common_vendor.f($data.presetColors, (color, index, i0) => {
      return {
        a: index,
        b: color,
        c: common_vendor.o(($event) => $options.selectPreset(color), index)
      };
    }),
    S: common_vendor.o((...args) => $options.closeColorPicker && $options.closeColorPicker(...args)),
    T: common_vendor.o((...args) => $options.confirmCustomColor && $options.confirmCustomColor(...args)),
    U: common_vendor.sr("colorPopup", "7a277b65-4"),
    V: common_vendor.o($options.onPopupChange),
    W: common_vendor.p({
      type: "center",
      ["background-color"]: "rgba(0,0,0,0)"
    }),
    X: $data.isPopupOpen ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7a277b65"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/yarn/create.js.map
