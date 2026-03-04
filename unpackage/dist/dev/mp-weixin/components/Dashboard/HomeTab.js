"use strict";
const common_vendor = require("../../common/vendor.js");
const StatCard = () => "./StatCard.js";
const ProjectCard = () => "./ProjectCard.js";
const _sfc_main = {
  components: {
    StatCard,
    ProjectCard
  },
  emits: ["newProject"],
  data() {
    return {
      stats: [
        { label: "计划中", count: 0, color: "#F0A500", key: "planning" },
        { label: "进行中", count: 0, color: "#6C8EA4", key: "in_progress" },
        { label: "已完成", count: 0, color: "#5BB98A", key: "completed" }
      ],
      projects: []
    };
  },
  mounted() {
    this.fetchData();
    common_vendor.index.$on("refreshProjectList", () => this.fetchProjects(true));
  },
  beforeUnmount() {
    common_vendor.index.$off("refreshProjectList", this.fetchData);
  },
  methods: {
    fetchData() {
      this.fetchProjects();
    },
    async fetchProjects(forceRefresh = false) {
      if (!forceRefresh) {
        const cachedProjects = common_vendor.index.getStorageSync("cached_project_list_v5");
        if (cachedProjects) {
          const hasRawCloudUrl = cachedProjects.some((item) => item.imageUrl && item.imageUrl.startsWith("cloud://"));
          if (!hasRawCloudUrl) {
            common_vendor.index.__f__("log", "at components/Dashboard/HomeTab.vue:81", "HomeTab: 使用缓存的项目列表 v5");
            this.projects = cachedProjects;
            this.calculateStats(cachedProjects);
            return;
          }
          common_vendor.index.__f__("log", "at components/Dashboard/HomeTab.vue:86", "HomeTab: 缓存包含未转换图片，强制刷新");
        }
      }
      const db = common_vendor.tr.database();
      try {
        const res = await db.collection("knitting-projects").where("user_id == $env.uid").orderBy("updated_at", "desc").get();
        let projectsData = res.result.data;
        common_vendor.index.__f__("log", "at components/Dashboard/HomeTab.vue:98", "HomeTab: 原始项目数据:", JSON.stringify(projectsData));
        const fileList = projectsData.filter((item) => item.cover && item.cover.startsWith("cloud://")).map((item) => item.cover);
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
            common_vendor.index.__f__("error", "at components/Dashboard/HomeTab.vue:115", "转换图片链接失败", err);
          }
        }
        this.projects = projectsData.map((item) => {
          let progress = 0;
          if (item.total_rows > 0) {
            progress = Math.round(item.current_row / item.total_rows * 100);
          } else if (item.status === "completed") {
            progress = 100;
          }
          let status = item.status;
          if (item.current_row === 0) {
            status = "planning";
          } else if (item.total_rows > 0 && item.current_row >= item.total_rows) {
            status = "completed";
          } else if (item.current_row > 0) {
            status = "in_progress";
          }
          return {
            id: item._id,
            title: item.name,
            description: item.description,
            progress,
            // 如果有转换后的链接则使用，否则保持原样
            imageUrl: fileMap[item.cover] || item.cover,
            lastUpdate: this.formatDate(item.updated_at),
            yarnColors: item.yarns ? item.yarns.map((y) => y.color) : [],
            status,
            // Use dynamically calculated status
            cover: item.cover,
            // Keep original cover for cache reference if needed
            total_rows: item.total_rows,
            current_row: item.current_row,
            updated_at: item.updated_at
          };
        });
        common_vendor.index.__f__("log", "at components/Dashboard/HomeTab.vue:155", "HomeTab: 处理后的项目列表:", this.projects);
        common_vendor.index.setStorageSync("cached_project_list_v5", this.projects);
        this.calculateStats(this.projects);
      } catch (e) {
        common_vendor.index.__f__("error", "at components/Dashboard/HomeTab.vue:159", "获取项目失败", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      }
    },
    calculateStats(data) {
      const counts = {
        planning: 0,
        in_progress: 0,
        completed: 0
      };
      data.forEach((item) => {
        if (counts[item.status] !== void 0) {
          counts[item.status]++;
        }
      });
      this.stats = [
        { label: "计划中", count: counts.planning, color: "#F0A500", key: "planning" },
        { label: "进行中", count: counts.in_progress, color: "#6C8EA4", key: "in_progress" },
        { label: "已完成", count: counts.completed, color: "#5BB98A", key: "completed" }
      ];
    },
    formatDate(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      if (diff < 864e5) {
        const hours = Math.floor(diff / 36e5);
        if (hours < 1)
          return "刚刚";
        return `${hours}小时前`;
      }
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    goToDetail(id) {
      common_vendor.index.navigateTo({
        url: `/pages/project/detail?id=${id}`
      });
    },
    handleLongPress(project) {
      common_vendor.index.showActionSheet({
        itemList: ["编辑", "删除"],
        itemColor: "#333333",
        success: (res) => {
          if (res.tapIndex === 0) {
            this.editProject(project.id);
          } else if (res.tapIndex === 1) {
            this.deleteProject(project.id);
          }
        }
      });
    },
    editProject(id) {
      common_vendor.index.navigateTo({
        url: `/pages/project/create?id=${id}`
      });
    },
    deleteProject(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后无法恢复，确定要删除吗？",
        success: (res) => {
          if (res.confirm) {
            const db = common_vendor.tr.database();
            db.collection("knitting-projects").doc(id).remove().then(() => {
              common_vendor.index.showToast({ title: "删除成功" });
              this.fetchData();
            }).catch((err) => {
              common_vendor.index.__f__("error", "at components/Dashboard/HomeTab.vue:234", "删除项目失败", err);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            });
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_StatCard = common_vendor.resolveComponent("StatCard");
  const _component_ProjectCard = common_vendor.resolveComponent("ProjectCard");
  (_component_StatCard + _component_ProjectCard)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.stats, (stat, index, i0) => {
      return {
        a: index,
        b: "9b7a296d-0-" + i0,
        c: common_vendor.p({
          label: stat.label,
          count: stat.count,
          color: stat.color
        })
      };
    }),
    b: common_vendor.f($data.projects, (project, k0, i0) => {
      return {
        a: project.id,
        b: common_vendor.o(($event) => $options.goToDetail(project.id), project.id),
        c: common_vendor.o(($event) => $options.handleLongPress(project), project.id),
        d: "9b7a296d-1-" + i0,
        e: common_vendor.p({
          title: project.title,
          description: project.description,
          progress: project.progress,
          imageUrl: project.imageUrl,
          lastUpdate: project.lastUpdate,
          yarnColors: project.yarnColors
        })
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-9b7a296d"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/Dashboard/HomeTab.js.map
