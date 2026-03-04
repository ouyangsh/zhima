<template>
  <view class="profile-tab">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info-row" @click="handleUserInfoClick">
        <!-- 头像 -->
        <image 
          v-if="finalAvatarUrl" 
          :src="finalAvatarUrl" 
          class="avatar-image"
          mode="aspectFill"
        ></image>
        <image 
          v-else
          src="/static/logo.png"
          class="avatar-image"
          mode="aspectFill"
        ></image>

        <view class="info-text">
          <text class="username">{{ userName }}</text>
          <text class="userid" v-if="hasLogin">ID: {{ userId }}</text>
          <text class="userid" v-else>登录后同步数据</text>
        </view>
        
        <!-- 登录/退出按钮 -->
        <view class="action-btn-group">
           <view class="auth-btn" :class="{ 'login-style': !hasLogin, 'logout-style': hasLogin }" @click.stop="handleAuthAction">
             <text class="btn-text">{{ hasLogin ? '退出' : '去登录' }}</text>
           </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-row">
        <view class="stat-item" v-for="(stat, index) in stats" :key="index">
          <text class="count" :style="{ color: stat.color }">{{ stat.count }}</text>
          <text class="label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <!-- 个人偏好 -->
    <view class="section-container">
      <text class="section-title">个人偏好</text>
      <view class="settings-list">
        <view 
          class="setting-item"
          v-for="(item, index) in settingsItems" 
          :key="index"
          @click="handleSettingClick(item)"
        >
          <view class="icon-circle" :style="{ backgroundColor: item.color + '20' }">
            <uni-icons :type="item.icon" size="20" :style="{ color: item.color }"></uni-icons>
          </view>
          <view class="item-content">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-desc">{{ item.description }}</text>
          </view>
          <uni-icons type="forward" size="20" color="#999999"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 帮助与支持 -->
    <view class="section-container">
      <text class="section-title">帮助与支持</text>
      <view class="help-list">
        <view 
          class="help-item"
          v-for="(item, index) in helpItems" 
          :key="index"
          :class="{ 'border-bottom': index !== helpItems.length - 1 }"
        >
          <uni-icons :type="item.icon" size="20" color="#6C8EA4" class="help-icon"></uni-icons>
          <view class="item-content">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-desc">{{ item.description }}</text>
          </view>
          <uni-icons type="forward" size="20" color="#999999"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 关于应用 -->
    <view class="about-card">
      <view class="row mb-1">
        <text class="label">当前版本</text>
        <text class="value">v1.0.0</text>
      </view>
      <view class="row">
        <text class="label">检查更新</text>
        <text class="action">立即检查</text>
      </view>
    </view>
  </view>
</template>

<script>
// 引入 uni-id-pages 的 store
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      finalAvatarUrl: '', // 最终显示的头像 URL (转换 cloud:// 后的)
      stats: [
        { label: "发布作品", count: 0, color: "#5BB98A" },
        { label: "全部项目", count: 0, color: "#6C8EA4" },
        { label: "毛线库存", count: 0, color: "#F0A500" },
      ],
      settingsItems: [
        {
          icon: 'notification',
          title: "通知设置",
          description: "管理推送通知偏好",
          color: "#6C8EA4",
        },
        {
          icon: 'heart',
          title: "我的收藏",
          description: "查看收藏的图解和教程",
          color: "#FF8C82",
        },
        {
          icon: 'star',
          title: "我的点赞",
          description: "浏览点赞的作品",
          color: "#F0A500",
        },
        {
          icon: 'gear',
          title: "账户设置",
          description: "个人信息与偏好设置",
          color: "#6C8EA4",
          action: 'editProfile'
        },
      ],
      helpItems: [
        {
          icon: 'help',
          title: "帮助中心",
          description: "常见问题与使用指南",
        },
        {
          icon: 'wallet',
          title: "使用条款",
          description: "服务条款与隐私政策",
        },
        {
          icon: 'locked',
          title: "隐私安全",
          description: "数据安全与隐私保护",
        },
      ]
    }
  },
  computed: {
    userInfo() {
      return store.userInfo;
    },
    hasLogin() {
      return store.hasLogin;
    },
    // 原始头像数据
    rawAvatar() {
      if (!this.hasLogin) return null;
      if (this.userInfo.avatar_file && this.userInfo.avatar_file.url) {
        return this.userInfo.avatar_file.url;
      }
      if (this.userInfo.avatar && typeof this.userInfo.avatar === 'string') {
        return this.userInfo.avatar;
      }
      return '/static/logo.png';
    },
    userName() {
      if (!this.hasLogin) return '未登录用户';
      return this.userInfo.nickname || this.userInfo.username || '编织爱好者';
    },
    userId() {
        return this.userInfo.username || this.userInfo._id || '';
    }
  },
  watch: {
    // 监听原始头像变化，进行转换
    rawAvatar: {
      immediate: true,
      handler(newVal) {
        this.processAvatar(newVal);
      }
    },
    hasLogin: {
      immediate: true,
      handler(val) {
        if (val) {
          this.$nextTick(() => {
            this.fetchStats();
          });
        }
      }
    }
  },
  mounted() {
    console.log('[ProfileTab] mounted, hasLogin:', store.hasLogin, 'uid:', store.userInfo && store.userInfo._id);
    // 页面加载时尝试更新一次用户信息
    if (!store.hasLogin && uni.getStorageSync('uni_id_token')) {
       mutations.updateUserInfo();
    }
    if (store.hasLogin) {
      this.fetchStats();
    }
    // 延迟兜底：如果 watcher 没触发，1秒后再检查一次
    setTimeout(() => {
      if (store.hasLogin && this.stats[0].count === 0 && this.stats[1].count === 0 && this.stats[2].count === 0) {
        console.log('[ProfileTab] 延迟兜底调用 fetchStats');
        this.fetchStats();
      }
    }, 1500);

    // 监听数据更新事件
    uni.$on('refreshYarnList', this.fetchStats);
    uni.$on('refreshProjectList', this.fetchStats);
    uni.$on('refreshPostList', this.fetchStats);
  },
  beforeUnmount() {
    uni.$off('refreshYarnList', this.fetchStats);
    uni.$off('refreshProjectList', this.fetchStats);
    uni.$off('refreshPostList', this.fetchStats);
  },
  methods: {
    async processAvatar(url) {
      if (!url) {
        this.finalAvatarUrl = '';
        return;
      }
      
      // 如果是 cloud:// 开头的云存储 ID，需要转换为 http 链接
      if (url.startsWith('cloud://')) {
        try {
          const result = await uniCloud.getTempFileURL({
            fileList: [url]
          });
          if (result.fileList && result.fileList.length > 0) {
            this.finalAvatarUrl = result.fileList[0].tempFileURL;
          } else {
            // 转换失败，尝试直接使用
            this.finalAvatarUrl = url;
          }
        } catch (e) {
          console.error('头像地址转换失败', e);
          this.finalAvatarUrl = url;
        }
      } else {
        // http 或 https 开头，或者是本地路径，直接使用
        this.finalAvatarUrl = url;
      }
    },
    async fetchStats() {
      try {
        const uid = store.userInfo && store.userInfo._id;
        if (!uid) {
          console.warn('[ProfileTab] 未获取到 uid');
          return;
        }
        const co = uniCloud.importObject('knitting-co');
        const res = await co.getMyStats(uid);
        console.log('[ProfileTab] getMyStats result:', JSON.stringify(res));
        if (res.errCode === 0 && res.stats) {
          this.stats[0].count = res.stats.posts;
          this.stats[1].count = res.stats.projects;
          this.stats[2].count = res.stats.yarns;
        }
      } catch(e) {
        console.error('Fetch stats failed', e);
      }
    },
    handleAuthAction() {
        if (this.hasLogin) {
            this.handleLogout();
        } else {
            this.handleLogin();
        }
    },
    handleLogin() {
        uni.navigateTo({
            url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
        });
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            mutations.logout();
            uni.reLaunch({
              url: '/pages/dashboard/main'
            });
          }
        }
      });
    },
    handleSettingClick(item) {
        if (item.action === 'editProfile') {
            uni.navigateTo({
                url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
            });
        }
    },
    handleUserInfoClick() {
        if (this.hasLogin) {
            uni.navigateTo({
                url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
            });
        } else {
            this.handleLogin();
        }
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-tab {
  padding: 16px;
  background-color: #FAF9F6;
  min-height: 100%;
  padding-bottom: 40px;

  .user-card {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;

    .user-info-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      .avatar-gradient, .avatar-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      
      .avatar-gradient {
        background: linear-gradient(135deg, #F8E5C8, #6C8EA4);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .info-text {
        flex: 1;
        overflow: hidden;

        .username {
          font-size: 18px;
          font-weight: 600;
          color: #3A3A3A;
          margin-bottom: 4px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .userid {
          font-size: 12px;
          color: #999999;
          word-break: break-all;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .action-btn-group {
          flex-shrink: 0;
          margin-left: 8px;
      }

      .auth-btn {
        padding: 0 16px;
        height: 32px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        
        .btn-text {
            font-size: 14px;
        }

        &.login-style {
            background-color: #6C8EA4;
            .btn-text {
                color: #FFFFFF;
            }
        }

        &.logout-style {
            border: 1px solid #C45C5C;
            background-color: #fff;
            .btn-text {
                color: #C45C5C;
            }
        }

        &:active {
          opacity: 0.8;
        }
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding-top: 16px;
      border-top: 1px solid #E0E0E0;

      .stat-item {
        text-align: center;

        .count {
          font-size: 24px;
          margin-bottom: 4px;
          display: block;
        }

        .label {
          font-size: 12px;
          color: #999999;
        }
      }
    }
  }

  .section-container {
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      color: #3A3A3A;
      margin-bottom: 12px;
      display: block;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-item {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .icon-circle {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
    }

    .help-list {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;

      .help-item {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;

        &.border-bottom {
          border-bottom: 1px solid #E0E0E0;
        }
      }
    }

    .item-content {
      flex: 1;

      .item-title {
        font-size: 14px;
        color: #3A3A3A;
        margin-bottom: 4px;
        display: block;
        font-weight: 500;
      }

      .item-desc {
        font-size: 12px;
        color: #999999;
      }
    }
  }

  .about-card {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.mb-1 {
        margin-bottom: 4px;
      }

      .label {
        font-size: 14px;
        color: #666666;
      }

      .value {
        font-size: 14px;
        color: #999999;
      }

      .action {
        font-size: 14px;
        color: #6C8EA4;
      }
    }
  }
}
</style>
