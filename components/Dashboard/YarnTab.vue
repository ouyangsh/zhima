<template>
  <view class="yarn-tab">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="input-wrapper">
        <uni-icons type="search" size="16" color="#999999" class="search-icon"></uni-icons>
        <input 
          type="text" 
          placeholder="搜索品牌、色号..." 
          class="search-input"
        />
      </view>
      <view class="filter-btn">
        <uni-icons type="tune" size="16" color="#666666"></uni-icons>
      </view>
    </view>

    <!-- 库存统计 -->
    <view class="stats-card">
      <text class="title">库存总览</text>
      <view class="stats-row">
        <view class="stat-item">
          <text class="value">{{ yarnItems.length }}</text>
          <text class="label">种类</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ totalBalls }}</text>
          <text class="label">总团数</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ totalWeight }}g</text>
          <text class="label">总重量</text>
        </view>
      </view>
    </view>

    <!-- 毛线列表 -->
    <view class="section-header">
      <text class="title">毛线库存</text>
    </view>

    <view class="yarn-grid">
      <YarnCard
        v-for="yarn in yarnItems"
        :key="yarn.id"
        :color="yarn.color"
        :brand="yarn.brand"
        :description="yarn.description"
        :colorCode="yarn.colorCode"
        :weight="yarn.weight"
        :ballsCount="yarn.ballsCount"
        :imageUrl="yarn.imageUrl"
        :relatedProjects="yarn.relatedProjects"
        @longpress="handleLongPress(yarn)"
      />
    </view>
  </view>
</template>

<script>
import YarnCard from './YarnCard.vue';

export default {
  components: {
    YarnCard
  },
  data() {
    return {
      yarnItems: [],
      loading: false
    }
  },
  mounted() {
    this.fetchYarns();
    uni.$on('refreshYarnList', () => this.fetchYarns(true));
  },
  destroyed() {
    uni.$off('refreshYarnList');
  },
  methods: {
    fetchYarns(forceRefresh = false) {
      if (!forceRefresh) {
          const cachedYarns = uni.getStorageSync('cached_yarn_list_v5');
          // const cachedYarns = null; // FORCE NULL to bypass cache for debugging
          if (cachedYarns) {
              // 检查缓存中是否包含未转换的 cloud:// 图片
              const hasRawCloudUrl = cachedYarns.some(item => item.imageUrl && item.imageUrl.startsWith('cloud://'));
              
              if (!hasRawCloudUrl) {
                  console.log('YarnTab: 使用缓存数据的毛线列表 v5');
                  this.yarnItems = cachedYarns;
                  return;
              }
              console.log('YarnTab: 缓存包含未转换图片，强制刷新');
          }
      }
      
      this.loading = true;
      const db = uniCloud.database();
      
      // 同时获取毛线列表和项目列表（为了统计关联数）
      Promise.all([
        db.collection('knitting-yarns').where('user_id == $env.uid').orderBy('created_at', 'desc').get(),
        db.collection('knitting-projects').where('user_id == $env.uid').field('yarns').get()
      ])
        .then(async ([yarnRes, projectRes]) => {
          const rawList = yarnRes.result.data;
          const projects = projectRes.result.data;
          console.log('YarnTab: 获取到的项目列表:', JSON.stringify(projects));
          
          // 计算每个毛线的引用次数
          const yarnUsageCount = {};
          if (projects && projects.length > 0) {
            projects.forEach(project => {
              if (project.yarns && Array.isArray(project.yarns)) {
                project.yarns.forEach(yarn => {
                  if (yarn.id) {
                    yarnUsageCount[yarn.id] = (yarnUsageCount[yarn.id] || 0) + 1;
                  }
                });
              }
            });
          }
          
          // 批量转换图片链接
          const fileList = rawList
            .filter(item => item.image && item.image.startsWith('cloud://'))
            .map(item => item.image);
            
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

          const list = rawList.map(item => ({
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
          console.log('YarnTab: 处理后的毛线列表:', list);
          uni.setStorageSync('cached_yarn_list_v5', list);
        })
        .catch(err => {
          console.error('获取列表失败', err);
          uni.showToast({ title: '加载失败', icon: 'none' });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handleLongPress(yarn) {
      uni.showActionSheet({
        itemList: ['编辑', '删除'],
        itemColor: '#333333',
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
      uni.navigateTo({
        url: `/pages/yarn/create?id=${id}`
      });
    },
    deleteYarn(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除吗？',
        success: (res) => {
          if (res.confirm) {
            const db = uniCloud.database();
            db.collection('knitting-yarns').doc(id).remove()
              .then(() => {
                uni.showToast({ title: '删除成功' });
                // 清除缓存并刷新
                uni.removeStorageSync('cached_yarn_list_v5');
                this.fetchYarns(true);
              })
              .catch(err => {
                console.error('删除毛线失败', err);
                uni.showToast({ title: '删除失败', icon: 'none' });
              });
          }
        }
      });
    }
  },
  computed: {
    totalWeight() {
      return this.yarnItems.reduce((sum, item) => sum + (item.weight * item.ballsCount), 0);
    },
    totalBalls() {
      return this.yarnItems.reduce((sum, item) => sum + item.ballsCount, 0);
    }
  }
}
</script>

<style lang="scss" scoped>
.yarn-tab {
  padding: 16px;
  background-color: #FAF9F6;
  min-height: 100%;

  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    .input-wrapper {
      flex: 1;
      position: relative;
      background-color: #ffffff;
      border: 1px solid #E0E0E0;
      border-radius: 20px;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 12px;

      .search-icon {
        margin-right: 8px;
      }

      .search-input {
        flex: 1;
        font-size: 14px;
        color: #3A3A3A;
      }
    }

    .filter-btn {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background-color: #ffffff;
      border: 1px solid #E0E0E0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .stats-card {
    background-color: #ffffff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;

    .title {
      font-size: 16px;
      color: #3A3A3A;
      margin-bottom: 12px;
      display: block;
      font-weight: 600;
    }

    .stats-row {
      display: flex;
      justify-content: space-between;
      
      .stat-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .value {
          font-size: 24px;
          color: #6C8EA4;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .label {
          font-size: 12px;
          color: #999999;
        }
      }
    }
  }

  .section-header {
    margin-bottom: 12px;
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #3A3A3A;
    }
  }

  .yarn-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding-bottom: 16px;
  }
}
</style>
