<template>
  <view class="discover-tab">
    <!-- 个人作品墙 -->
    <view class="section-container">
      <view class="section-header">
        <text class="title">作品展示墙</text>
        <text class="action" @click="handleSeeAllWorks">查看全部</text>
      </view>
      
      <view class="works-grid" v-if="finishedWorks.length > 0">
        <view 
          v-for="work in finishedWorks" 
          :key="work._id"
          class="work-item"
          @click="handleWorkClick(work)"
        >
          <image :src="work.imageUrl" mode="aspectFill" class="work-image" />
          <view class="overlay">
            <text class="work-title">{{ work.title }}</text>
            <view class="work-stats">
              <uni-icons type="heart-filled" size="12" color="#fff"></uni-icons>
              <text class="stats-text">{{ work.likes || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-text">暂无作品展示，快去发布吧~</text>
      </view>
    </view>

    <!-- 动态消息 -->
    <view class="section-container">
      <text class="title mb-4">最近动态</text>
      
      <view class="activity-card" v-if="activities.length > 0">
        <view 
          v-for="activity in activities" 
          :key="activity._id"
          class="activity-item"
        >
          <image 
            v-if="activity.from_user_avatar" 
            :src="activity.from_user_avatar" 
            class="avatar-img"
            mode="aspectFill"
          />
          <view v-else class="avatar default-avatar">
            {{ activity.from_user_name ? activity.from_user_name[0].toUpperCase() : 'U' }}
          </view>
          
          <view class="content">
            <view class="text">
              <text class="name">{{ activity.from_user_name }}</text> 
              <text v-if="activity.type === 'like'"> 赞了你的作品 </text>
              <text v-else-if="activity.type === 'comment'"> 评论了你的作品 </text>
              <text v-else> {{ activity.content }} </text>
              <text class="highlight" v-if="activity.target_title">「{{ activity.target_title }}」</text>
            </view>
            <text class="time">{{ formatTime(activity.created_at) }}</text>
          </view>
        </view>
      </view>
      <view class="empty-state card" v-else>
         <text class="empty-text">暂无最新动态</text>
      </view>
    </view>

    <!-- 工具与设置 -->
    <view class="section-container">
      <text class="title mb-4">工具与设置</text>
      <view class="tools-list">
        <view 
          v-for="(tool, index) in tools" 
          :key="index"
          class="tool-item"
          @click="handleToolClick(tool)"
        >
          <view class="icon-circle" :style="{ backgroundColor: tool.color + '20' }">
            <uni-icons :type="tool.icon" size="24" :color="tool.color"></uni-icons>
          </view>
          <view class="tool-info">
            <text class="tool-title">{{ tool.title }}</text>
            <text class="tool-desc">{{ tool.description }}</text>
          </view>
          <uni-icons type="right" size="16" color="#CCCCCC"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';
import { seedDiscoverData } from '@/utils/seed-data.js';

export default {
  data() {
    return {
      finishedWorks: [],
      activities: [],
      isLoading: false,
      tools: [
        {
          icon: 'image',
          title: "花样图解",
          description: "输入花样简写，生成圆形图解",
          color: "#6C8EA4",
          action: 'pattern'
        },
        {
          icon: 'list',
          title: "术语翻译",
          description: "中英日术语对照",
          color: "#5BB98A",
          action: 'dict'
        },
        {
          icon: 'gear',
          title: "设置",
          description: "个性化设置与偏好",
          color: "#F0A500",
          action: 'settings'
        },
        {
          icon: 'help',
          title: "帮助中心",
          description: "使用指南与常见问题",
          color: "#FF8C82",
          action: 'help'
        }
      ]
    }
  },
  async created() {
    this.isLoading = true;
    await this.fetchData(); // Try fetching first
    
    // Auto-seed if empty
    if (this.finishedWorks.length === 0 && this.activities.length === 0) {
        const seeded = await seedDiscoverData();
        if (seeded) {
            await this.fetchData(); // Refresh if seeded
        }
    }
    this.isLoading = false;
    
    // Listen for refresh event
    uni.$on('refreshDiscover', () => {
        this.fetchData();
    });
  },
  beforeDestroy() {
      uni.$off('refreshDiscover');
  },
  methods: {
    fetchData() {
      this.fetchWorks();
      this.fetchActivities();
    },
    async fetchWorks() {
      const db = uniCloud.database();
      try {
        const userInfo = uniCloud.getCurrentUserInfo();
        let query = db.collection('knitting-posts');
        if (userInfo.uid) {
            query = query.where({ user_id: userInfo.uid });
        }
        const res = await query
          .orderBy('created_at', 'desc')
          .limit(4)
          .get();
        
        const rawList = res.result.data;
        
        // 批量转换图片链接
        const fileList = rawList
          .filter(item => item.cover && item.cover.startsWith('cloud://'))
          .map(item => item.cover);
          
        let fileMap = {};
        if (fileList.length > 0) {
           try {
             const tempFilesRes = await uniCloud.getTempFileURL({ fileList });
             tempFilesRes.fileList.forEach(file => {
               fileMap[file.fileID] = file.tempFileURL;
             });
           } catch (e) {
             console.error('Discover items image convert failed', e);
           }
        }

        this.finishedWorks = rawList.map(item => ({
            ...item,
            imageUrl: fileMap[item.cover] || item.cover || '/static/default-cover.png'
        }));
      } catch (e) {
        console.error('获取作品展示失败', e);
        // Fallback to mock data if empty for demo purposes (optional, removing for now to be real)
      }
    },
    async fetchActivities() {
      const db = uniCloud.database();
      try {
        const res = await db.collection('knitting-activities')
          .where("user_id == $env.uid")
          .orderBy('created_at', 'desc')
          .limit(5)
          .get();
          
        let activities = res.result.data;
        
        // Batch convert avatars
        const fileList = activities
            .filter(item => item.from_user_avatar && item.from_user_avatar.startsWith('cloud://'))
            .map(item => item.from_user_avatar);
            
        if (fileList.length > 0) {
            try {
                const tempFilesRes = await uniCloud.getTempFileURL({ fileList });
                const fileMap = {};
                tempFilesRes.fileList.forEach(file => {
                    fileMap[file.fileID] = file.tempFileURL;
                });
                
                activities = activities.map(item => ({
                    ...item,
                    from_user_avatar: fileMap[item.from_user_avatar] || item.from_user_avatar
                }));
            } catch(e) {
                console.error('Convert activity avatars failed', e);
            }
        }
          
        this.activities = activities;
      } catch (e) {
        console.error('获取动态失败', e);
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      
      if (diff < minute) return '刚刚';
      if (diff < hour) return Math.floor(diff / minute) + '分钟前';
      if (diff < day) return Math.floor(diff / hour) + '小时前';
      if (diff < day * 7) return Math.floor(diff / day) + '天前';
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    handleSeeAllWorks() {
      uni.navigateTo({ url: '/pages/post/list' });
    },
    handleWorkClick(work) {
      uni.navigateTo({
          url: '/pages/post/detail?id=' + work._id
      });
    },
    handleToolClick(tool) {
      if (tool.action === 'pattern') {
        uni.navigateTo({ url: '/pages/pattern/viewer' });
      } else if (tool.action === 'settings') {
        uni.showToast({ title: '设置功能开发中', icon: 'none' });
      } else {
        uni.showToast({ title: tool.title + ' 开发中', icon: 'none' });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.discover-tab {
  padding: 16px;
  background-color: #FAF9F6;
  min-height: 100%;

  .section-container {
    margin-bottom: 24px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #3A3A3A;
      display: block;
      
      &.mb-4 {
        margin-bottom: 16px;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .title {
        margin-bottom: 0;
      }

      .action {
        font-size: 14px;
        color: #6C8EA4;
      }
    }
  }
  
  .empty-state {
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f9f9f9;
      border-radius: 8px;
      
      &.card {
          background-color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      
      .empty-text {
          color: #999;
          font-size: 14px;
      }
  }

  .works-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .work-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .work-image {
        width: 100%;
        height: 100%;
        background-color: #eee;
      }

      .overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .work-title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          flex: 1;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .work-stats {
            display: flex;
            align-items: center;
            gap: 4px;
            
            .stats-text {
                color: #fff;
                font-size: 12px;
            }
        }
      }
    }
  }

  .activity-card {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f5f5f5;

      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;
        
        &.default-avatar {
             background-color: #F0F0F0;
             color: #999;
        }
      }
      
      .avatar-img {
         width: 40px;
         height: 40px;
         border-radius: 50%;
         flex-shrink: 0;
      }

      .content {
        flex: 1;

        .text {
          font-size: 14px;
          color: #666666;
          line-height: 1.5;

          .name {
            color: #3A3A3A;
            font-weight: 600;
          }

          .highlight {
            color: #3A3A3A;
            font-weight: 500;
          }
        }

        .time {
          font-size: 12px;
          color: #999999;
          margin-top: 4px;
          display: block;
        }
      }
    }
  }

  .tools-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .tool-item {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.1s;
      
      &:active {
          transform: scale(0.99);
      }

      .icon-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .tool-info {
        flex: 1;

        .tool-title {
          font-size: 14px;
          color: #3A3A3A;
          margin-bottom: 4px;
          display: block;
          font-weight: 500;
        }

        .tool-desc {
          font-size: 12px;
          color: #999999;
        }
      }
    }
  }
}
</style>
