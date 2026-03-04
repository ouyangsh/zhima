<template>
  <view class="post-list-page">
    <!-- 顶部导航 -->
    <view class="fixed-header">
      <view :style="{ height: statusBarHeight + 'px', backgroundColor: '#ffffff' }"></view>
      <view class="nav-bar">
        <view class="left" @click="goBack">
          <uni-icons type="back" size="24" color="#3A3A3A"></uni-icons>
        </view>
        <text class="title">全部作品</text>
        <view class="right" :style="{ width: (menuButtonWidth || 80) + 'px' }"></view>
      </view>
      <!-- 分区Tab -->
      <view class="sub-tabs">
        <view class="sub-tab" :class="{ active: currentSubTab === 'mine' }" @click="switchSubTab('mine')">
          <text>我发布的</text>
        </view>
        <view class="sub-tab" :class="{ active: currentSubTab === 'all' }" @click="switchSubTab('all')">
          <text>全部织友</text>
        </view>
      </view>
    </view>

    <scroll-view 
      scroll-y 
      class="content-area" 
      :style="{ marginTop: (statusBarHeight + 44 + 44) + 'px' }"
      @scrolltolower="loadMore"
    >
      <!-- 作品瀑布流 -->
      <view class="works-grid">
        <view 
          v-for="work in works" 
          :key="work._id" 
          class="work-card"
          @click="handleWorkClick(work)"
          @longpress="handleLongPress(work)"
        >
          <image :src="work.imageUrl" mode="widthFix" class="work-image"></image>
          <view class="work-info">
            <text class="work-title">{{ work.title }}</text>
            <view class="work-meta">
              <view class="author">
                <image :src="work.user_avatar || '/static/logo.png'" mode="aspectFill" class="author-avatar"></image>
                <text class="author-name">{{ work.user_name || '织友' }}</text>
              </view>
              <view class="stats">
                <uni-icons type="heart-filled" size="14" color="#FF6B6B"></uni-icons>
                <text class="stat-num">{{ work.likes || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>
      <view class="loading-more" v-else-if="noMore && works.length > 0">
        <text>没有更多了~</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!isLoading && works.length === 0">
        <uni-icons type="images" size="48" color="#CCCCCC"></uni-icons>
        <text>{{ currentSubTab === 'mine' ? '你还没有发布作品哦~' : '暂无作品~' }}</text>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      currentSubTab: 'mine',
      works: [],
      page: 0,
      pageSize: 10,
      isLoading: false,
      noMore: false,
      currentUid: ''
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;

    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = (screenWidth - menuButtonInfo.left) + 10;
    // #endif

    // 不再需要在客户端获取 uid，改用 JQL 的 $env.uid 在服务端过滤
    
    this.loadData();
  },
  methods: {
    goBack() {
      // 通知发现页刷新数据
      uni.$emit('refreshDiscover');
      uni.navigateBack();
    },
    switchSubTab(tab) {
      if (this.currentSubTab === tab) return;
      this.currentSubTab = tab;
      this.works = [];
      this.page = 0;
      this.noMore = false;
      this.loadData();
    },
    async loadData() {
      if (this.isLoading || this.noMore) return;
      this.isLoading = true;

      try {
        let rawList = [];
        
        if (this.currentSubTab === 'mine') {
          // 通过云函数在服务端过滤
          const uid = store.userInfo && store.userInfo._id;
          console.log('[list] 当前用户 uid:', uid);
          if (!uid) {
            console.warn('[list] 未获取到 uid，无法查询我发布的');
            return;
          }
          const co = uniCloud.importObject('knitting-co');
          const res = await co.getMyPosts(uid, this.page, this.pageSize);
          console.log('[list] getMyPosts result:', JSON.stringify(res));
          if (res.errCode !== 0) {
            console.error('[list] getMyPosts error:', res.errMsg);
            return;
          }
          rawList = res.data || [];
        } else {
          // 全部织友：直接查询全部
          const db = uniCloud.database();
          const res = await db.collection('knitting-posts')
            .orderBy('created_at', 'desc')
            .skip(this.page * this.pageSize)
            .limit(this.pageSize)
            .get();
          rawList = res.result.data;
        }

        if (rawList.length < this.pageSize) {
          this.noMore = true;
        }

        // 批量转换 cloud:// 图片
        const coverFiles = rawList
          .filter(item => item.cover && item.cover.startsWith('cloud://'))
          .map(item => item.cover);
        const avatarFiles = rawList
          .filter(item => item.user_avatar && item.user_avatar.startsWith('cloud://'))
          .map(item => item.user_avatar);
        const allFiles = [...new Set([...coverFiles, ...avatarFiles])];

        let fileMap = {};
        if (allFiles.length > 0) {
          try {
            const tempFilesRes = await uniCloud.getTempFileURL({ fileList: allFiles });
            tempFilesRes.fileList.forEach(file => {
              fileMap[file.fileID] = file.tempFileURL;
            });
          } catch (e) {
            console.error('Image convert failed', e);
          }
        }

        const newWorks = rawList.map(item => ({
          ...item,
          imageUrl: fileMap[item.cover] || item.cover || '/static/default-cover.png',
          user_avatar: fileMap[item.user_avatar] || item.user_avatar
        }));

        this.works = [...this.works, ...newWorks];
        this.page++;
      } catch (e) {
        console.error('获取作品列表失败', e);
      } finally {
        this.isLoading = false;
      }
    },
    loadMore() {
      this.loadData();
    },
    handleWorkClick(work) {
      uni.navigateTo({
        url: '/pages/post/detail?id=' + work._id
      });
    },
    handleLongPress(work) {
      // 仅在"我发布的"tab下可以操作
      if (this.currentSubTab !== 'mine') return;
      
      uni.showActionSheet({
        itemList: ['编辑作品', '删除作品'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.handleEdit(work);
          } else if (res.tapIndex === 1) {
            this.handleDelete(work);
          }
        }
      });
    },
    handleEdit(work) {
      uni.navigateTo({
        url: '/pages/post/create?id=' + work._id
      });
    },
    handleDelete(work) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个作品吗？删除后不可恢复。',
        confirmColor: '#FF4D4F',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' });
            try {
              const db = uniCloud.database();
              await db.collection('knitting-posts').doc(work._id).remove();
              // 从列表中移除
              this.works = this.works.filter(w => w._id !== work._id);
              uni.showToast({ title: '已删除' });
              uni.$emit('refreshDiscover');
            } catch (e) {
              console.error('Delete failed', e);
              uni.showToast({ title: '删除失败', icon: 'none' });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.post-list-page {
  min-height: 100vh;
  background-color: #FAF9F6;

  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .nav-bar {
    height: 44px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #ffffff;
    position: relative;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #3A3A3A;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .left, .right {
      min-width: 24px;
      display: flex;
      align-items: center;
    }
  }

  .sub-tabs {
    display: flex;
    height: 44px;
    border-top: 1px solid #F0F0F0;
    background-color: #ffffff;

    .sub-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #999;
      position: relative;
      transition: all 0.2s;

      &.active {
        color: #6C8EA4;
        font-weight: 600;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background-color: #6C8EA4;
          border-radius: 2px;
        }
      }
    }
  }

  .content-area {
    flex: 1;
    width: 100%;
    height: calc(100vh - 44px);
    box-sizing: border-box;
  }

  .works-grid {
    display: flex;
    flex-wrap: wrap;
    padding: 12px;
    gap: 12px;

    .work-card {
      width: calc(50% - 6px);
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);

      .work-image {
        width: 100%;
        min-height: 120px;
        max-height: 240px;
        background-color: #f5f5f5;
      }

      .work-info {
        padding: 10px 12px;

        .work-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .work-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .author {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            overflow: hidden;

            .author-avatar {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: #eee;
              flex-shrink: 0;
            }

            .author-name {
              font-size: 11px;
              color: #999;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .stats {
            display: flex;
            align-items: center;
            gap: 3px;
            flex-shrink: 0;

            .stat-num {
              font-size: 11px;
              color: #999;
            }
          }
        }
      }
    }
  }

  .loading-more {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 13px;
  }

  .empty-state {
    padding: 80px 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
}
</style>
