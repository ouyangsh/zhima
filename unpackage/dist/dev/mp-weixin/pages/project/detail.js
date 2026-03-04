"use strict";
const common_vendor = require("../../common/vendor.js");
const debounce = (fn, delay) => {
  let timer = null;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
};
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      projectId: "",
      project: {
        _id: "",
        name: "加载中...",
        description: "",
        yarns: [],
        total_rows: 0,
        current_row: 0,
        stitch_count: 0,
        timer_seconds: 0,
        pattern_image: "",
        pattern_images: [],
        notes: []
      },
      patternImageUrlList: [],
      // 用于显示的图片地址列表
      noteInput: "",
      // 计时器状态
      isTimerRunning: false,
      timerInterval: null,
      currentSessionSeconds: 0,
      saveQueue: {},
      // 用于合并更新请求
      // AI 图解任务
      patternTab: "pattern",
      // 'pattern' | 'ai'
      aiSections: [],
      aiCheckedRows: {},
      isAiAnalyzing: false,
      aiError: null,
      aiPreviewUrl: null
    };
  },
  computed: {
    progress() {
      if (!this.project.total_rows)
        return 0;
      return Math.min(100, Math.round(this.project.current_row / this.project.total_rows * 100));
    },
    formattedTime() {
      const totalSeconds = (this.project.timer_seconds || 0) + this.currentSessionSeconds;
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor(totalSeconds % 3600 / 60);
      const secs = totalSeconds % 60;
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    },
    aiTotalRows() {
      return this.aiSections.reduce((acc, s) => acc + (s.rows ? s.rows.length : 0), 0);
    },
    aiCompletedRows() {
      return Object.values(this.aiCheckedRows).filter(Boolean).length;
    },
    aiProgress() {
      if (this.aiTotalRows === 0)
        return 0;
      return Math.round(this.aiCompletedRows / this.aiTotalRows * 100);
    }
  },
  onLoad(options) {
    if (options.id) {
      this.projectId = options.id;
      this.fetchProjectDetail();
    }
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    const menuButtonInfo = common_vendor.index.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = screenWidth - menuButtonInfo.left + 10;
  },
  onUnload() {
    this.stopTimer();
    this.saveProjectData();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    fetchProjectDetail() {
      const db = common_vendor.tr.database();
      db.collection("knitting-projects").doc(this.projectId).get().then(async (res) => {
        if (res.result.data && res.result.data.length > 0) {
          const data = res.result.data[0];
          this.project = {
            ...data,
            current_row: data.current_row || 0,
            total_rows: data.total_rows || 0,
            stitch_count: data.stitch_count || 0,
            timer_seconds: data.timer_seconds || 0,
            notes: data.notes || [],
            yarns: data.yarns || [],
            pattern_images: data.pattern_images || (data.pattern_image ? [data.pattern_image] : [])
            // 兼容旧数据
          };
          if (data.ai_sections && data.ai_sections.length > 0) {
            this.aiSections = data.ai_sections;
            this.aiCheckedRows = data.ai_checked_rows || {};
            this.aiPreviewUrl = "saved";
            if (data.ai_pattern_image) {
              try {
                const aiImgRes = await common_vendor.tr.getTempFileURL({ fileList: [data.ai_pattern_image] });
                if (aiImgRes.fileList && aiImgRes.fileList[0] && aiImgRes.fileList[0].tempFileURL) {
                  this.aiPreviewUrl = aiImgRes.fileList[0].tempFileURL;
                }
              } catch (e) {
                common_vendor.index.__f__("error", "at pages/project/detail.vue:450", "恢复AI图片失败", e);
              }
            }
          }
          const patterns = this.project.pattern_images;
          if (patterns && patterns.length > 0) {
            common_vendor.index.__f__("log", "at pages/project/detail.vue:459", "ProjectDetail: Detail has patterns", patterns);
            const cloudIds = patterns.filter((p) => p.startsWith("cloud://"));
            let fileMap = {};
            if (cloudIds.length > 0) {
              try {
                const fileRes = await common_vendor.tr.getTempFileURL({
                  fileList: cloudIds
                });
                common_vendor.index.__f__("log", "at pages/project/detail.vue:469", "ProjectDetail: Converted cloud URLs", fileRes);
                if (fileRes.fileList) {
                  fileRes.fileList.forEach((item) => {
                    if (item.code === "SUCCESS" || item.status === 0 || item.tempFileURL && item.tempFileURL.length > 0) {
                      fileMap[item.fileID] = item.tempFileURL;
                    } else {
                      common_vendor.index.__f__("error", "at pages/project/detail.vue:477", "ProjectDetail: Failed to convert", item);
                      fileMap[item.fileID] = item.fileID;
                    }
                  });
                }
              } catch (e) {
                common_vendor.index.__f__("error", "at pages/project/detail.vue:483", "ProjectDetail: 转换图片链接失败", e);
              }
            }
            this.patternImageUrlList = patterns.map((p) => {
              if (p.startsWith("cloud://")) {
                return fileMap[p] || "";
              }
              return p;
            }).filter((url) => !!url);
            common_vendor.index.__f__("log", "at pages/project/detail.vue:496", "ProjectDetail: Final image list", this.patternImageUrlList);
          } else {
            this.patternImageUrlList = [];
          }
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/project/detail.vue:502", "获取详情失败", err);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      });
    },
    updateRow(delta) {
      const newVal = (this.project.current_row || 0) + delta;
      if (newVal < 0)
        return;
      if (this.project.total_rows > 0 && newVal > this.project.total_rows)
        return;
      this.project.current_row = newVal;
      this.queueSave("current_row", newVal);
      this.checkStatusUpdate();
    },
    onTargetRowChange() {
      let val = parseInt(this.project.total_rows);
      if (isNaN(val) || val < 0)
        val = 0;
      this.project.total_rows = val;
      this.queueSave("total_rows", val);
      this.checkStatusUpdate();
    },
    onCurrentRowChange() {
      let val = parseInt(this.project.current_row);
      if (isNaN(val) || val < 0)
        val = 0;
      this.project.current_row = val;
      this.queueSave("current_row", val);
      this.checkStatusUpdate();
    },
    onStitchCountChange() {
      let val = parseInt(this.project.stitch_count);
      if (isNaN(val) || val < 0)
        val = 0;
      this.project.stitch_count = val;
      this.queueSave("stitch_count", val);
    },
    updateStitch(delta) {
      const newVal = (this.project.stitch_count || 0) + delta;
      if (newVal < 0)
        return;
      this.project.stitch_count = newVal;
      this.queueSave("stitch_count", newVal);
    },
    resetStitch() {
      common_vendor.index.showModal({
        title: "重置针数",
        content: "确定要将针数计数归零吗？",
        success: (res) => {
          if (res.confirm) {
            this.project.stitch_count = 0;
            this.queueSave("stitch_count", 0);
          }
        }
      });
    },
    // 计时器逻辑
    toggleTimer() {
      if (this.isTimerRunning) {
        this.stopTimer();
      } else {
        this.startTimer();
      }
    },
    startTimer() {
      this.isTimerRunning = true;
      this.timerInterval = setInterval(() => {
        this.currentSessionSeconds++;
      }, 1e3);
    },
    stopTimer() {
      if (this.isTimerRunning) {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
        this.project.timer_seconds = (this.project.timer_seconds || 0) + this.currentSessionSeconds;
        this.currentSessionSeconds = 0;
        this.queueSave("timer_seconds", this.project.timer_seconds);
      }
    },
    resetTimer() {
      common_vendor.index.showModal({
        title: "重置计时",
        content: "确定要将计时归零吗？",
        success: (res) => {
          if (res.confirm) {
            this.stopTimer();
            this.project.timer_seconds = 0;
            this.currentSessionSeconds = 0;
            this.queueSave("timer_seconds", 0);
          }
        }
      });
    },
    // 笔记逻辑
    addNote() {
      if (!this.noteInput.trim())
        return;
      const now = /* @__PURE__ */ new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const newNote = {
        id: Date.now().toString(),
        content: this.noteInput.trim(),
        created_at: timeStr
      };
      if (!this.project.notes)
        this.project.notes = [];
      this.project.notes.unshift(newNote);
      this.queueSave("notes", this.project.notes);
      this.noteInput = "";
    },
    deleteNote(index) {
      common_vendor.index.showModal({
        title: "删除笔记",
        content: "确定删除这条笔记吗？",
        success: (res) => {
          if (res.confirm) {
            this.project.notes.splice(index, 1);
            this.queueSave("notes", this.project.notes);
          }
        }
      });
    },
    // 图解逻辑
    handleUploadPattern() {
      common_vendor.index.chooseImage({
        count: 9,
        // 允许选择多张
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths;
          common_vendor.index.showLoading({ title: "上传中" });
          if (!this.project.pattern_images)
            this.project.pattern_images = [];
          this.patternImageUrlList = [...this.patternImageUrlList, ...tempFilePaths];
          const uploadPromises = tempFilePaths.map((filePath) => {
            return new Promise((resolve, reject) => {
              common_vendor.tr.uploadFile({
                filePath,
                cloudPath: `project-patterns/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
                success: (uploadRes) => {
                  resolve(uploadRes.fileID);
                },
                fail: (err) => {
                  reject(err);
                }
              });
            });
          });
          try {
            const fileIDs = await Promise.all(uploadPromises);
            this.project.pattern_images = [...this.project.pattern_images, ...fileIDs];
            this.queueSave("pattern_images", this.project.pattern_images);
            common_vendor.index.showToast({ title: "上传成功" });
          } catch (err) {
            common_vendor.index.__f__("error", "at pages/project/detail.vue:661", err);
            common_vendor.index.showToast({ title: "部分上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    },
    previewPattern(currentUrl) {
      if (this.patternImageUrlList && this.patternImageUrlList.length > 0) {
        common_vendor.index.previewImage({
          current: currentUrl,
          urls: this.patternImageUrlList
        });
      }
    },
    // 数据保存队列 (简单的防抖保存)
    queueSave(field, value) {
      this.saveQueue[field] = value;
      this.debouncedSave();
    },
    debouncedSave: debounce(function() {
      this.saveProjectData();
    }, 1e3),
    saveProjectData() {
      if (Object.keys(this.saveQueue).length === 0)
        return;
      const updates = { ...this.saveQueue };
      this.saveQueue = {};
      const db = common_vendor.tr.database();
      db.collection("knitting-projects").doc(this.projectId).update(updates).then(() => {
        common_vendor.index.__f__("log", "at pages/project/detail.vue:696", "自动保存成功", updates);
        common_vendor.index.$emit("refreshProjectList");
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/project/detail.vue:706", "保存失败", err);
        common_vendor.index.showToast({ title: "保存失败: " + err.message, icon: "none" });
      });
    },
    checkStatusUpdate() {
      let newStatus = this.project.status;
      const current = this.project.current_row || 0;
      const total = this.project.total_rows || 0;
      if (current === 0) {
        newStatus = "planning";
      } else if (total > 0 && current >= total) {
        newStatus = "completed";
      } else {
        newStatus = "in_progress";
      }
      if (newStatus !== this.project.status) {
        this.project.status = newStatus;
        this.queueSave("status", newStatus);
      }
    },
    // ========== AI 图解任务 ==========
    handleAiUpload() {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          this.aiPreviewUrl = filePath;
          common_vendor.tr.uploadFile({
            filePath,
            cloudPath: `ai-patterns/${this.projectId}-${Date.now()}.jpg`,
            success: (uploadRes) => {
              this.queueSave("ai_pattern_image", uploadRes.fileID);
              common_vendor.index.__f__("log", "at pages/project/detail.vue:742", "AI图解图片已保存:", uploadRes.fileID);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/project/detail.vue:745", "AI图解图片上传失败", err);
            }
          });
          const fs = common_vendor.index.getFileSystemManager();
          fs.readFile({
            filePath,
            encoding: "base64",
            success: (readRes) => {
              const base64 = "data:image/png;base64," + readRes.data;
              this.analyzeImage(base64);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/project/detail.vue:767", "读取文件失败", err);
              this.aiError = "读取文件失败，请重试。";
            }
          });
        }
      });
    },
    async analyzeImage(base64Data) {
      this.isAiAnalyzing = true;
      this.aiError = null;
      try {
        const res = await new Promise((resolve, reject) => {
          common_vendor.index.request({
            url: "https://longx.aiwsh.dpdns.org/api/ai-pattern/analyze/",
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: { base64Data, uid: this.projectId || "anonymous" },
            success: (result) => {
              if (result.statusCode === 200) {
                resolve(result.data);
              } else {
                reject(new Error(`HTTP ${result.statusCode}`));
              }
            },
            fail: (err) => reject(err)
          });
        });
        common_vendor.index.__f__("log", "at pages/project/detail.vue:797", "后端返回:", res);
        if (res.errCode === 0 && res.data) {
          const parsed = res.data;
          if (parsed.sections) {
            this.aiSections = parsed.sections;
            this.aiCheckedRows = {};
            let totalRows = 0;
            parsed.sections.forEach((section) => {
              if (section.rows) {
                totalRows += section.rows.length;
              }
            });
            this.project.total_rows = totalRows;
            this.project.current_row = 0;
            this.queueSave("ai_sections", parsed.sections);
            this.queueSave("ai_checked_rows", {});
            this.queueSave("total_rows", totalRows);
            this.queueSave("current_row", 0);
          }
        } else {
          this.aiError = res.errMsg || "AI 解析失败，请重试。";
        }
      } catch (err) {
        this.aiError = "AI 解析失败，请重试或上传更清晰的图片。";
        common_vendor.index.__f__("error", "at pages/project/detail.vue:828", "AI分析失败", err);
      } finally {
        this.isAiAnalyzing = false;
      }
    },
    toggleAiRow(key) {
      const isChecked = !this.aiCheckedRows[key];
      this.$set(this.aiCheckedRows, key, isChecked);
      if (typeof this.project.current_row === "number") {
        if (isChecked) {
          this.project.current_row++;
        } else if (this.project.current_row > 0) {
          this.project.current_row--;
        }
        this.queueSave("current_row", this.project.current_row);
      }
      this.queueSave("ai_checked_rows", { ...this.aiCheckedRows });
    },
    handleAiCopy() {
      const text = this.aiSections.map(
        (s) => `${s.title}:
` + s.rows.map((r) => `${r.id}: ${r.count}针 (${r.detail})`).join("\n")
      ).join("\n\n");
      common_vendor.index.setClipboardData({
        data: text,
        success: () => {
          common_vendor.index.showToast({ title: "已复制", icon: "success" });
        }
      });
    },
    clearAiData() {
      this.aiSections = [];
      this.aiPreviewUrl = null;
      this.aiCheckedRows = {};
      this.aiError = null;
      this.queueSave("ai_sections", []);
      this.queueSave("ai_checked_rows", {});
      this.queueSave("ai_pattern_image", "");
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
    a: common_vendor.p({
      type: "back",
      size: "24",
      color: "#6C8EA4"
    }),
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.project.name),
    d: $data.menuButtonWidth + "px",
    e: $data.statusBarHeight + "px",
    f: $data.statusBarHeight + 44 + "px",
    g: $data.project.yarns && $data.project.yarns.length > 0
  }, $data.project.yarns && $data.project.yarns.length > 0 ? {
    h: common_vendor.f($data.project.yarns, (yarn, index, i0) => {
      return {
        a: index,
        b: yarn.color
      };
    })
  } : {}, {
    i: $data.project.description
  }, $data.project.description ? {
    j: common_vendor.t($data.project.description)
  } : {}, {
    k: common_vendor.t($options.progress),
    l: $options.progress + "%",
    m: common_vendor.p({
      type: "image",
      size: "16",
      color: $data.patternTab === "pattern" ? "#6C8EA4" : "#999"
    }),
    n: $data.patternTab === "pattern" ? 1 : "",
    o: common_vendor.o(($event) => $data.patternTab = "pattern"),
    p: common_vendor.p({
      type: "star",
      size: "16",
      color: $data.patternTab === "ai" ? "#6C8EA4" : "#999"
    }),
    q: $data.patternTab === "ai" ? 1 : "",
    r: common_vendor.o(($event) => $data.patternTab = "ai"),
    s: $data.patternTab === "pattern"
  }, $data.patternTab === "pattern" ? common_vendor.e({
    t: $data.patternImageUrlList.length > 0
  }, $data.patternImageUrlList.length > 0 ? {
    v: common_vendor.f($data.patternImageUrlList, (url, index, i0) => {
      return {
        a: url,
        b: index,
        c: common_vendor.o(($event) => $options.previewPattern(url), index)
      };
    })
  } : {
    w: common_vendor.p({
      type: "image",
      size: "40",
      color: "#E0E0E0"
    }),
    x: common_vendor.o(($event) => $options.previewPattern(""))
  }, {
    y: common_vendor.t($data.project.current_row || 0),
    z: common_vendor.t($data.project.total_rows || 0),
    A: common_vendor.p({
      type: "cloud-upload",
      size: "20",
      color: "#6C8EA4"
    }),
    B: common_vendor.o((...args) => $options.handleUploadPattern && $options.handleUploadPattern(...args))
  }) : common_vendor.e({
    C: $data.isAiAnalyzing
  }, $data.isAiAnalyzing ? {} : {}, {
    D: $data.aiPreviewUrl
  }, $data.aiPreviewUrl ? {
    E: $data.aiPreviewUrl,
    F: common_vendor.o((...args) => $options.handleAiUpload && $options.handleAiUpload(...args))
  } : {
    G: common_vendor.p({
      type: "image",
      size: "32",
      color: "#6C8EA4"
    }),
    H: common_vendor.p({
      type: "cloud-upload",
      size: "18",
      color: "#FFFFFF"
    }),
    I: common_vendor.o((...args) => $options.handleAiUpload && $options.handleAiUpload(...args))
  }, {
    J: $data.isAiAnalyzing ? 1 : "",
    K: $data.aiError
  }, $data.aiError ? {
    L: common_vendor.p({
      type: "info",
      size: "18",
      color: "#FF8C82"
    }),
    M: common_vendor.t($data.aiError)
  } : {}, {
    N: common_vendor.t($data.aiSections.length > 0 ? "已就绪" : "等待上传"),
    O: common_vendor.p({
      type: "refresh",
      size: "18",
      color: "#999"
    }),
    P: common_vendor.o((...args) => $options.clearAiData && $options.clearAiData(...args)),
    Q: common_vendor.p({
      type: "copy",
      size: "16",
      color: "#999"
    }),
    R: common_vendor.o((...args) => $options.handleAiCopy && $options.handleAiCopy(...args)),
    S: $data.aiSections.length === 0
  }, $data.aiSections.length === 0 ? {} : {
    T: common_vendor.f($data.aiSections, (section, sIdx, i0) => {
      return {
        a: common_vendor.t(section.title),
        b: common_vendor.f(section.rows, (row, rIdx, i1) => {
          return common_vendor.e({
            a: common_vendor.t(row.id),
            b: $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx] ? 1 : "",
            c: common_vendor.t(row.count),
            d: $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx] ? 1 : "",
            e: common_vendor.t(row.detail),
            f: $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx]
          }, $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx] ? {
            g: "a3b467e0-10-" + i0 + "-" + i1,
            h: common_vendor.p({
              type: "checkmarkempty",
              size: "16",
              color: "#FFFFFF"
            })
          } : {}, {
            i: $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx] ? 1 : "",
            j: $data.aiCheckedRows[sIdx + "-" + row.id + "-" + rIdx] ? 1 : "",
            k: rIdx,
            l: common_vendor.o(($event) => $options.toggleAiRow(sIdx + "-" + row.id + "-" + rIdx), rIdx)
          });
        }),
        c: sIdx
      };
    })
  }, {
    U: $data.aiSections.length > 0
  }, $data.aiSections.length > 0 ? {
    V: common_vendor.t($options.aiCompletedRows),
    W: common_vendor.t($options.aiTotalRows),
    X: common_vendor.t($options.aiProgress),
    Y: $options.aiProgress + "%"
  } : {}), {
    Z: common_vendor.o((...args) => $options.onTargetRowChange && $options.onTargetRowChange(...args)),
    aa: $data.project.total_rows,
    ab: common_vendor.o(common_vendor.m(($event) => $data.project.total_rows = $event.detail.value, {
      number: true
    })),
    ac: common_vendor.p({
      type: "minus",
      size: "24",
      color: "#6C8EA4"
    }),
    ad: common_vendor.o(($event) => $options.updateRow(-1)),
    ae: common_vendor.o((...args) => $options.onCurrentRowChange && $options.onCurrentRowChange(...args)),
    af: $data.project.current_row,
    ag: common_vendor.o(common_vendor.m(($event) => $data.project.current_row = $event.detail.value, {
      number: true
    })),
    ah: common_vendor.p({
      type: "plusempty",
      size: "24",
      color: "#FFFFFF"
    }),
    ai: common_vendor.o(($event) => $options.updateRow(1)),
    aj: common_vendor.p({
      type: "minus",
      size: "16",
      color: "#666"
    }),
    ak: common_vendor.o(($event) => $options.updateStitch(-1)),
    al: common_vendor.o((...args) => $options.onStitchCountChange && $options.onStitchCountChange(...args)),
    am: $data.project.stitch_count,
    an: common_vendor.o(common_vendor.m(($event) => $data.project.stitch_count = $event.detail.value, {
      number: true
    })),
    ao: common_vendor.p({
      type: "plusempty",
      size: "16",
      color: "#FFF"
    }),
    ap: common_vendor.o(($event) => $options.updateStitch(1)),
    aq: common_vendor.p({
      type: "refresh",
      size: "12",
      color: "#999"
    }),
    ar: common_vendor.o((...args) => $options.resetStitch && $options.resetStitch(...args)),
    as: common_vendor.t($options.formattedTime),
    at: common_vendor.p({
      type: $data.isTimerRunning ? "control-pause" : "control-play-filled",
      size: "16",
      color: "#FFF"
    }),
    av: common_vendor.t($data.isTimerRunning ? "暂停" : "开始"),
    aw: common_vendor.n($data.isTimerRunning ? "pause" : "start"),
    ax: common_vendor.o((...args) => $options.toggleTimer && $options.toggleTimer(...args)),
    ay: common_vendor.p({
      type: "refresh",
      size: "16",
      color: "#999"
    }),
    az: common_vendor.o((...args) => $options.resetTimer && $options.resetTimer(...args)),
    aA: common_vendor.p({
      type: "compose",
      size: "20",
      color: "#6C8EA4"
    }),
    aB: $data.project.notes && $data.project.notes.length > 0
  }, $data.project.notes && $data.project.notes.length > 0 ? {
    aC: common_vendor.t($data.project.notes.length)
  } : {}, {
    aD: $data.noteInput,
    aE: common_vendor.o(($event) => $data.noteInput = $event.detail.value),
    aF: common_vendor.p({
      type: "paperplane-filled",
      size: "20",
      color: "#FFFFFF"
    }),
    aG: !$data.noteInput.trim() ? 1 : "",
    aH: common_vendor.o((...args) => $options.addNote && $options.addNote(...args)),
    aI: $data.project.notes && $data.project.notes.length > 0
  }, $data.project.notes && $data.project.notes.length > 0 ? {
    aJ: common_vendor.f($data.project.notes, (note, index, i0) => {
      return {
        a: common_vendor.t(note.created_at),
        b: "a3b467e0-20-" + i0,
        c: common_vendor.o(($event) => $options.deleteNote(index), note.id),
        d: common_vendor.t(note.content),
        e: note.id
      };
    }),
    aK: common_vendor.p({
      type: "trash",
      size: "14",
      color: "#FF8C82"
    })
  } : {
    aL: common_vendor.p({
      type: "compose",
      size: "40",
      color: "#E0E0E0"
    })
  }, {
    aM: $data.statusBarHeight + 44 + "px"
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a3b467e0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/project/detail.js.map
