<template>
  <view class="home-tab">
    <!-- 统计卡片 -->
    <view class="stats-grid">
      <StatCard
        v-for="(stat, index) in stats"
        :key="index"
        :label="stat.label"
        :count="stat.count"
        :color="stat.color"
      />
    </view>

    <!-- 项目列表 -->
    <view class="section-header">
      <text class="title">我的项目</text>
      <text class="action">查看全部</text>
    </view>

    <view class="project-list">
      <ProjectCard 
        v-for="project in projects" 
        :key="project.id" 
        :title="project.title"
        :description="project.description"
        :progress="project.progress"
        :imageUrl="project.imageUrl"
        :lastUpdate="project.lastUpdate"
        :yarnColors="project.yarnColors"
        @click="goToDetail(project.id)"
        @longpress="handleLongPress(project)"
      />
    </view>

    <!-- 浮动添加按钮 -->
    <!-- <view class="fab" @click="$emit('newProject')">
      <uni-icons type="plusempty" size="24" color="#FFFFFF"></uni-icons>
    </view> -->
  </view>
</template>

<script>
import StatCard from './StatCard.vue';
import ProjectCard from './ProjectCard.vue';

export default {
  components: {
    StatCard,
    ProjectCard
  },
  emits: ['newProject'],
  data() {
    return {
      stats: [
        { label: "计划中", count: 0, color: "#F0A500", key: 'planning' },
        { label: "进行中", count: 0, color: "#6C8EA4", key: 'in_progress' },
        { label: "已完成", count: 0, color: "#5BB98A", key: 'completed' },
      ],
      projects: []
    }
  },
  mounted() {
    this.fetchData();
    uni.$on('refreshProjectList', () => this.fetchProjects(true));
  },
  beforeUnmount() {
    uni.$off('refreshProjectList', this.fetchData);
  },
  methods: {
    fetchData() {
      this.fetchProjects();
    },
    async fetchProjects(forceRefresh = false) {
      if (!forceRefresh) {
        const cachedProjects = uni.getStorageSync('cached_project_list_v5');
        // const cachedProjects = null; // FORCE NULL to bypass cache for debugging
        if (cachedProjects) {
          const hasRawCloudUrl = cachedProjects.some(item => item.imageUrl && item.imageUrl.startsWith('cloud://'));
          
          if (!hasRawCloudUrl) {
            console.log('HomeTab: 使用缓存的项目列表 v5');
            this.projects = cachedProjects;
            this.calculateStats(cachedProjects); // Ensure stats are updated from cache
            return;
          }
           console.log('HomeTab: 缓存包含未转换图片，强制刷新');
        }
      }

      const db = uniCloud.database();
      try {
        const res = await db.collection('knitting-projects')
          .where("user_id == $env.uid")
          .orderBy('updated_at', 'desc')
          .get();
          
        let projectsData = res.result.data;
        console.log('HomeTab: 原始项目数据:', JSON.stringify(projectsData));
        
        // 收集所有需要转换的图片ID
        const fileList = projectsData
          .filter(item => item.cover && item.cover.startsWith('cloud://'))
          .map(item => item.cover);
          
        let fileMap = {};
        if (fileList.length > 0) {
          try {
            const tempFilesRes = await uniCloud.getTempFileURL({
              fileList: fileList
            });
            tempFilesRes.fileList.forEach(file => {
              fileMap[file.fileID] = file.tempFileURL;
            });
          } catch (err) {
            console.error('转换图片链接失败', err);
          }
        }

        this.projects = projectsData.map(item => {
          // 计算进度
          let progress = 0;
          if (item.total_rows > 0) {
            progress = Math.round((item.current_row / item.total_rows) * 100);
          } else if (item.status === 'completed') {
            progress = 100;
          }
          
          // 动态计算状态，确保与新逻辑一致
          let status = item.status;
          if (item.current_row === 0) {
              status = 'planning';
          } else if (item.total_rows > 0 && item.current_row >= item.total_rows) {
              status = 'completed';
          } else if (item.current_row > 0) {
              status = 'in_progress';
          }

          return {
            id: item._id,
            title: item.name,
            description: item.description,
            progress: progress,
            // 如果有转换后的链接则使用，否则保持原样
            imageUrl: fileMap[item.cover] || item.cover, 
            lastUpdate: this.formatDate(item.updated_at),
            yarnColors: item.yarns ? item.yarns.map(y => y.color) : [],
            status: status, // Use dynamically calculated status
            cover: item.cover, // Keep original cover for cache reference if needed
            total_rows: item.total_rows,
            current_row: item.current_row,
            updated_at: item.updated_at
          };
        });
        
        console.log('HomeTab: 处理后的项目列表:', this.projects);
        uni.setStorageSync('cached_project_list_v5', this.projects);
        this.calculateStats(this.projects);
      } catch (e) {
        console.error('获取项目失败', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },
    calculateStats(data) {
      const counts = {
        planning: 0,
        in_progress: 0,
        completed: 0
      };
      
      data.forEach(item => {
        if (counts[item.status] !== undefined) {
          counts[item.status]++;
        }
      });
      
      this.stats = [
        { label: "计划中", count: counts.planning, color: "#F0A500", key: 'planning' },
        { label: "进行中", count: counts.in_progress, color: "#6C8EA4", key: 'in_progress' },
        { label: "已完成", count: counts.completed, color: "#5BB98A", key: 'completed' },
      ];
    },
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // 小于24小时显示xx小时前
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return '刚刚';
        return `${hours}小时前`;
      }
      
      // 大于24小时显示日期
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/project/detail?id=${id}`
      });
    },
    handleLongPress(project) {
      uni.showActionSheet({
        itemList: ['编辑', '删除'],
        itemColor: '#333333',
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
      uni.navigateTo({
        url: `/pages/project/create?id=${id}`
      });
    },
    deleteProject(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除吗？',
        success: (res) => {
          if (res.confirm) {
            const db = uniCloud.database();
            db.collection('knitting-projects').doc(id).remove()
              .then(() => {
                uni.showToast({ title: '删除成功' });
                this.fetchData(); // 刷新列表
              })
              .catch(err => {
                console.error('删除项目失败', err);
                uni.showToast({ title: '删除失败', icon: 'none' });
              });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.home-tab {
  padding: 16px;
  background-color: #FAF9F6;
  min-height: 100%;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #3A3A3A;
    }

    .action {
      font-size: 14px;
      color: #6C8EA4;
    }
  }

  .project-list {
    padding-bottom: 80px; /* Space for FAB */
  }

  .fab {
    position: fixed;
    right: 24px;
    bottom: 100px; /* adjust based on bottom nav height */
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #6C8EA4;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }
}
</style>
