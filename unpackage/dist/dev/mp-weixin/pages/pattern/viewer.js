"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_patternParser = require("../../utils/pattern-parser.js");
const utils_pattern3dRenderer = require("../../utils/pattern-3d-renderer.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      activeTab: "text",
      patternText: "",
      parsedData: {
        title: "",
        author: "",
        parts: [],
        sewings: [],
        stats: { totalParts: 0, totalRounds: 0, totalStitches: 0, estimatedLengthCm: 0, estimatedWeightG: 0 }
      },
      expandedParts: [],
      expandedRows: [],
      selectedPartId: 0,
      canvasSize: 300,
      is3DMode: false,
      show3DHint: true,
      tabs: [
        { key: "chart", label: "图解" },
        { key: "text", label: "文本" },
        { key: "detail", label: "详情" },
        { key: "ref", label: "参考" }
      ],
      stitchRef: [],
      symbolSyntax: [],
      hookSizes: [],
      syntaxHelp: [
        { symbol: "Pn:", meaning: "部件定义" },
        { symbol: "Rn:", meaning: "环形行" },
        { symbol: "Hn:", meaning: "平织行" },
        { symbol: "X", meaning: "短针" },
        { symbol: "T", meaning: "中长针" },
        { symbol: "F", meaning: "长针" },
        { symbol: "E", meaning: "长长针" },
        { symbol: "V", meaning: "加针(2)" },
        { symbol: "A", meaning: "减针(2)" },
        { symbol: "W", meaning: "加针(3)" },
        { symbol: "M", meaning: "减针(3)" },
        { symbol: "CH", meaning: "锁针" },
        { symbol: "SL", meaning: "引拔针" },
        { symbol: "K", meaning: "跳过" },
        { symbol: "TV/FV", meaning: "复合加针" },
        { symbol: "NF/NX", meaning: "前柱针" },
        { symbol: "Q/G", meaning: "枣形/爆米花" },
        { symbol: "BLO()", meaning: "后半针" },
        { symbol: "环起", meaning: "环形起针" },
        { symbol: "6(X,V)", meaning: "重复6次" },
        { symbol: "[X,F]", meaning: "同针多针" },
        { symbol: "缝合:", meaning: "缝合指令" }
      ],
      legendItems: []
    };
  },
  created() {
    this.renderer3d = null;
    this.webgl3dReady = false;
  },
  onLoad() {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    this.canvasSize = systemInfo.windowWidth - 60;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    this.menuButtonWidth = systemInfo.screenWidth - menuButtonInfo.left + 10;
    this.stitchRef = utils_patternParser.getStitchReference();
    this.symbolSyntax = utils_patternParser.getSymbolSyntax();
    this.hookSizes = utils_patternParser.getHookSizes();
    this.loadSample();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    switchTab(key) {
      this.activeTab = key;
      if (key === "chart") {
        this.$nextTick(() => {
          if (this.is3DMode) {
            this.init3DCanvas();
          } else {
            setTimeout(() => this.drawChart(), 150);
          }
        });
      }
    },
    selectPart(partId) {
      this.selectedPartId = partId;
      if (this.is3DMode) {
        this.render3D();
      } else {
        this.drawChart();
      }
    },
    switch3DMode(to3D) {
      var _a;
      if (this.is3DMode === to3D)
        return;
      this.is3DMode = to3D;
      if (to3D) {
        this.selectedPartId = -1;
        setTimeout(() => {
          this.init3DCanvas();
        }, 100);
        setTimeout(() => {
          this.show3DHint = false;
        }, 5e3);
      } else {
        if (this.renderer3d)
          this.renderer3d.stopAutoRotate();
        const roundPart = this.parsedData.parts.find((p) => p.rows.some((r) => r.type === "round"));
        this.selectedPartId = roundPart ? roundPart.id : ((_a = this.parsedData.parts[0]) == null ? void 0 : _a.id) || 0;
        this.$nextTick(() => setTimeout(() => this.drawChart(), 150));
      }
    },
    init3DCanvas(retryCount = 0) {
      const query = common_vendor.wx$1.createSelectorQuery().in(this);
      query.select("#webgl3d").node().exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          common_vendor.index.__f__("error", "at pages/pattern/viewer.vue:361", "[3D] 无法获取 WebGL Canvas, 重试:", retryCount);
          if (retryCount < 5) {
            setTimeout(() => this.init3DCanvas(retryCount + 1), 200);
          } else {
            common_vendor.index.showToast({ title: "3D组件加载超时，请重试", icon: "none" });
          }
          return;
        }
        const canvas = res[0].node;
        this._setup3DRenderer(canvas);
      });
    },
    _setup3DRenderer(canvas) {
      if (this.renderer3d) {
        this.renderer3d.dispose();
      }
      this.renderer3d = new utils_pattern3dRenderer.Pattern3DRenderer();
      this.renderer3d.init(canvas, this.canvasSize, this.canvasSize);
      this.webgl3dReady = true;
      this.render3D();
      this.renderer3d.startAutoRotate();
    },
    render3D() {
      if (!this.renderer3d || !this.webgl3dReady)
        return;
      this.renderer3d.generateModel(this.parsedData, this.selectedPartId);
    },
    onWebGLTouchStart(e) {
      if (this.renderer3d)
        this.renderer3d.handleTouchStart(e);
    },
    onWebGLTouchMove(e) {
      if (this.renderer3d)
        this.renderer3d.handleTouchMove(e);
    },
    onWebGLTouchEnd(e) {
      if (this.renderer3d)
        this.renderer3d.handleTouchEnd(e);
    },
    getSymbolColor(symbol) {
      const s = symbol.split("/")[0].trim().replace("(...)", "");
      return utils_patternParser.getStitchColor(s) || "#5BB98A";
    },
    loadSample() {
      this.patternText = utils_patternParser.getSamplePattern();
      this.parseAndUpdate();
    },
    clearText() {
      this.patternText = "";
      this.parseAndUpdate();
    },
    onTextChange() {
      if (this._parseTimer)
        clearTimeout(this._parseTimer);
      this._parseTimer = setTimeout(() => this.parseAndUpdate(), 500);
    },
    parseAndUpdate() {
      var _a;
      this.parsedData = utils_patternParser.parsePattern(this.patternText);
      this.expandedParts = this.parsedData.parts.map((p) => p.id);
      this.expandedRows = [];
      for (const part of this.parsedData.parts) {
        for (const row of part.rows) {
          this.expandedRows.push("P" + part.id + "R" + row.rowNumber);
        }
      }
      const roundPart = this.parsedData.parts.find((p) => p.rows.some((r) => r.type === "round"));
      this.selectedPartId = roundPart ? roundPart.id : ((_a = this.parsedData.parts[0]) == null ? void 0 : _a.id) || 0;
      this.updateLegend();
      if (this.activeTab === "chart") {
        this.$nextTick(() => {
          if (this.is3DMode) {
            this.render3D();
          } else {
            setTimeout(() => this.drawChart(), 150);
          }
        });
      }
    },
    togglePart(partId) {
      const idx = this.expandedParts.indexOf(partId);
      if (idx > -1) {
        this.expandedParts.splice(idx, 1);
      } else {
        this.expandedParts.push(partId);
      }
    },
    toggleRow(partId, rowNumber) {
      const key = "P" + partId + "R" + rowNumber;
      const idx = this.expandedRows.indexOf(key);
      if (idx > -1) {
        this.expandedRows.splice(idx, 1);
      } else {
        this.expandedRows.push(key);
      }
    },
    getPartStitches(part) {
      if (!part.rows.length)
        return 0;
      return part.rows[part.rows.length - 1].endStitches;
    },
    updateLegend() {
      const usedTypes = /* @__PURE__ */ new Set();
      for (const part of this.parsedData.parts) {
        for (const row of part.rows) {
          for (const st of row.stitches) {
            usedTypes.add(st.type);
          }
        }
      }
      const LABELS = { "X": "短针", "V": "加针", "A": "减针", "W": "长针", "T": "中长针", "CH": "锁针", "SL": "引拔针" };
      this.legendItems = Array.from(usedTypes).map((t) => ({ type: t, label: LABELS[t] || t, color: utils_patternParser.getStitchColor(t) }));
    },
    drawChart() {
      const ctx = common_vendor.index.createCanvasContext("patternChart", this);
      const size = this.canvasSize;
      const cx = size / 2;
      const cy = size / 2;
      ctx.clearRect(0, 0, size, size);
      const part = this.parsedData.parts.find((p) => p.id === this.selectedPartId);
      if (!part || part.rows.length === 0) {
        ctx.setFontSize(14);
        ctx.setFillStyle("#999");
        ctx.setTextAlign("center");
        ctx.fillText("请输入花样文本", cx, cy);
        ctx.draw();
        return;
      }
      const roundRows = part.rows.filter((r) => r.type === "round");
      const flatRows = part.rows.filter((r) => r.type === "flat");
      if (roundRows.length === 0 && flatRows.length === 0) {
        ctx.setFontSize(14);
        ctx.setFillStyle("#999");
        ctx.setTextAlign("center");
        ctx.fillText("无可绘制的行", cx, cy);
        ctx.draw();
        return;
      }
      const totalDrawRows = roundRows.length + (flatRows.length > 0 ? 1 : 0);
      const maxRadius = Math.min(cx, cy) - 20;
      const ringWidth = Math.min(maxRadius / (totalDrawRows + 1), 22);
      const innerRadius = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.setFillStyle("#333");
      ctx.fill();
      for (let i = 0; i < roundRows.length; i++) {
        const row = roundRows[i];
        const r = innerRadius + (i + 1) * ringWidth;
        const stitchCount = row.stitches.length || row.endStitches;
        if (stitchCount === 0)
          continue;
        const anglePerStitch = Math.PI * 2 / stitchCount;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.setStrokeStyle("#E8E8E8");
        ctx.setLineWidth(0.5);
        ctx.stroke();
        for (let j = 0; j < stitchCount; j++) {
          const stitch = row.stitches[j] || { type: "X" };
          const angle = j * anglePerStitch - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const color = utils_patternParser.getStitchColor(stitch.type);
          const dotSize = Math.max(1.5, Math.min(ringWidth * 0.22, 4));
          if (i > 0) {
            const prevR = innerRadius + i * ringWidth;
            ctx.beginPath();
            ctx.moveTo(cx + prevR * Math.cos(angle), cy + prevR * Math.sin(angle));
            ctx.lineTo(x, y);
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(0.4);
            ctx.setGlobalAlpha(0.25);
            ctx.stroke();
            ctx.setGlobalAlpha(1);
          }
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.setFillStyle(color);
          ctx.fill();
          if (stitch.type === "V") {
            ctx.beginPath();
            const ts = dotSize * 1.5;
            ctx.moveTo(x, y - ts);
            ctx.lineTo(x - ts * 0.7, y + ts * 0.5);
            ctx.lineTo(x + ts * 0.7, y + ts * 0.5);
            ctx.closePath();
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(0.8);
            ctx.stroke();
          }
        }
        ctx.setFontSize(7);
        ctx.setFillStyle("#AAA");
        ctx.setTextAlign("center");
        ctx.fillText("R" + row.rowNumber, cx, cy - r - 4);
      }
      if (flatRows.length > 0) {
        const barY = size - 30;
        const barWidth = size - 60;
        const totalFlatStitches = flatRows.reduce((s, r) => s + r.endStitches, 0);
        const stitchW = Math.min(barWidth / totalFlatStitches, 8);
        let offsetX = (size - totalFlatStitches * stitchW) / 2;
        ctx.setFontSize(8);
        ctx.setFillStyle("#AAA");
        ctx.setTextAlign("left");
        ctx.fillText("平织:", 10, barY - 8);
        for (const row of flatRows) {
          for (let j = 0; j < (row.stitches.length || row.endStitches); j++) {
            const st = row.stitches[j] || { type: "CH" };
            const color = utils_patternParser.getStitchColor(st.type);
            ctx.beginPath();
            ctx.rect(offsetX + j * stitchW, barY, stitchW - 1, 6);
            ctx.setFillStyle(color);
            ctx.fill();
          }
          offsetX += (row.stitches.length || row.endStitches) * stitchW;
        }
      }
      ctx.draw();
    },
    showMenu() {
      common_vendor.index.showActionSheet({
        itemList: ["示例文本", "清空画布", "查看帮助"],
        success: (res) => {
          if (res.tapIndex === 0)
            this.loadSample();
          else if (res.tapIndex === 1)
            this.clearText();
          else if (res.tapIndex === 2)
            this.switchTab("ref");
        }
      });
    }
  },
  onUnload() {
    if (this.renderer3d) {
      this.renderer3d.dispose();
      this.renderer3d = null;
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
      color: "#333"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    d: common_vendor.o($options.showMenu),
    e: common_vendor.p({
      type: "more-filled",
      size: "24",
      color: "#333"
    }),
    f: $data.menuButtonWidth + "px",
    g: common_vendor.f($data.tabs, (tab, k0, i0) => {
      return {
        a: common_vendor.t(tab.label),
        b: tab.key,
        c: $data.activeTab === tab.key ? 1 : "",
        d: common_vendor.o(($event) => $options.switchTab(tab.key), tab.key)
      };
    }),
    h: $data.parsedData.parts.length > 1
  }, $data.parsedData.parts.length > 1 ? {
    i: common_vendor.f($data.parsedData.parts, (part, k0, i0) => {
      return {
        a: common_vendor.t(part.id),
        b: part.id,
        c: $data.selectedPartId === part.id || $data.selectedPartId === -1 ? 1 : "",
        d: common_vendor.o(($event) => $options.selectPart(part.id), part.id)
      };
    })
  } : {}, {
    j: !$data.is3DMode ? 1 : "",
    k: common_vendor.o(($event) => $options.switch3DMode(false)),
    l: $data.is3DMode ? 1 : "",
    m: common_vendor.o(($event) => $options.switch3DMode(true)),
    n: !$data.is3DMode
  }, !$data.is3DMode ? {
    o: $data.canvasSize + "px",
    p: $data.canvasSize + "px"
  } : {}, {
    q: $data.is3DMode
  }, $data.is3DMode ? common_vendor.e({
    r: $data.canvasSize + "px",
    s: $data.canvasSize + "px",
    t: $data.canvasSize + "px",
    v: $data.canvasSize + "px",
    w: common_vendor.o((...args) => $options.onWebGLTouchStart && $options.onWebGLTouchStart(...args)),
    x: common_vendor.o((...args) => $options.onWebGLTouchMove && $options.onWebGLTouchMove(...args)),
    y: common_vendor.o((...args) => $options.onWebGLTouchEnd && $options.onWebGLTouchEnd(...args)),
    z: $data.is3DMode && $data.show3DHint
  }, $data.is3DMode && $data.show3DHint ? {} : {}) : {}, {
    A: $data.legendItems.length > 0
  }, $data.legendItems.length > 0 ? {
    B: common_vendor.f($data.legendItems, (item, k0, i0) => {
      return {
        a: item.color,
        b: common_vendor.t(item.label),
        c: item.type
      };
    })
  } : {}, {
    C: $data.activeTab === "chart",
    D: common_vendor.o((...args) => $options.loadSample && $options.loadSample(...args)),
    E: common_vendor.o((...args) => $options.clearText && $options.clearText(...args)),
    F: common_vendor.o([($event) => $data.patternText = $event.detail.value, (...args) => $options.onTextChange && $options.onTextChange(...args)]),
    G: $data.patternText,
    H: common_vendor.f($data.syntaxHelp, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.symbol),
        b: common_vendor.t(item.meaning),
        c: item.symbol
      };
    }),
    I: $data.activeTab === "text",
    J: $data.parsedData.title
  }, $data.parsedData.title ? common_vendor.e({
    K: common_vendor.t($data.parsedData.title),
    L: $data.parsedData.author
  }, $data.parsedData.author ? {
    M: common_vendor.t($data.parsedData.author)
  } : {}) : {}, {
    N: common_vendor.f($data.parsedData.parts, (part, k0, i0) => {
      return {
        a: common_vendor.t(part.id),
        b: common_vendor.t(part.name),
        c: common_vendor.t(part.rows.length),
        d: common_vendor.t($options.getPartStitches(part)),
        e: "a5e62500-2-" + i0,
        f: common_vendor.p({
          type: $data.expandedParts.includes(part.id) ? "up" : "down",
          size: "16",
          color: "#999"
        }),
        g: common_vendor.o(($event) => $options.togglePart(part.id), part.id),
        h: common_vendor.f(part.rows, (row, k1, i1) => {
          return common_vendor.e({
            a: common_vendor.t(row.type === "round" ? "R" : "H"),
            b: common_vendor.t(row.rowNumber),
            c: common_vendor.n(row.type),
            d: common_vendor.t(row.isRepeat ? row.repeatTimes + " × (" : ""),
            e: common_vendor.f(row.stitches.slice(0, 5), (st, idx, i2) => {
              return {
                a: common_vendor.t(st.type),
                b: idx,
                c: ["V", "A", "W", "M"].includes(st.type) ? 1 : ""
              };
            }),
            f: common_vendor.t(row.stitches.length > 5 ? "..." : ""),
            g: common_vendor.t(row.isRepeat ? ")" : ""),
            h: common_vendor.t(row.endStitches),
            i: row.color
          }, row.color ? {
            j: common_vendor.t(row.color)
          } : {}, {
            k: row.modifier
          }, row.modifier ? {
            l: common_vendor.t(row.modifierName)
          } : {}, {
            m: common_vendor.t(row.description),
            n: $data.expandedRows.includes("P" + part.id + "R" + row.rowNumber),
            o: "P" + part.id + "R" + row.rowNumber,
            p: common_vendor.o(($event) => $options.toggleRow(part.id, row.rowNumber), "P" + part.id + "R" + row.rowNumber)
          });
        }),
        i: $data.expandedParts.includes(part.id),
        j: part.id
      };
    }),
    O: $data.parsedData.sewings && $data.parsedData.sewings.length > 0
  }, $data.parsedData.sewings && $data.parsedData.sewings.length > 0 ? {
    P: common_vendor.p({
      type: "link",
      size: "16",
      color: "#5BB98A"
    }),
    Q: common_vendor.f($data.parsedData.sewings, (sew, idx, i0) => {
      return {
        a: common_vendor.t(sew.instruction),
        b: idx
      };
    })
  } : {}, {
    R: $data.parsedData.parts.length === 0
  }, $data.parsedData.parts.length === 0 ? {
    S: common_vendor.p({
      type: "compose",
      size: "48",
      color: "#CCC"
    })
  } : {}, {
    T: $data.activeTab === "detail",
    U: common_vendor.f($data.stitchRef, (cat, k0, i0) => {
      return {
        a: common_vendor.t(cat.category),
        b: common_vendor.f(cat.items, (item, k1, i1) => {
          return {
            a: common_vendor.t(item.symbol),
            b: $options.getSymbolColor(item.symbol),
            c: common_vendor.t(item.cn),
            d: common_vendor.t(item.en),
            e: common_vendor.t(item.note),
            f: item.symbol
          };
        }),
        c: cat.category
      };
    }),
    V: common_vendor.f($data.symbolSyntax, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.syntax),
        b: common_vendor.t(item.meaning),
        c: common_vendor.t(item.example),
        d: item.syntax
      };
    }),
    W: common_vendor.f($data.hookSizes, (h, k0, i0) => {
      return {
        a: common_vendor.t(h.mm),
        b: common_vendor.t(h.us || h.steel || "-"),
        c: common_vendor.t(h.yarn),
        d: common_vendor.n(h.yarn),
        e: h.mm
      };
    }),
    X: $data.activeTab === "ref",
    Y: $data.statusBarHeight + 44 + 44 + "px",
    Z: $data.parsedData.parts.length > 0
  }, $data.parsedData.parts.length > 0 ? {
    aa: common_vendor.t($data.parsedData.stats.totalParts),
    ab: common_vendor.t($data.parsedData.stats.totalRounds),
    ac: common_vendor.t($data.parsedData.stats.totalStitches),
    ad: common_vendor.t($data.parsedData.stats.estimatedWeightG)
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a5e62500"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/pattern/viewer.js.map
