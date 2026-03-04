<template>
  <view class="dashboard-page">
    <!-- 顶部导航 (自带状态栏占位) -->
    <TopNavBar 
      :title="pageTitle" 
      @addClick="handleNewProject"
      @userClick="handleUserClick"
    />
    
    <!-- 内容区域 -->
    <scroll-view 
      scroll-y 
      class="content-area"
    >
      <!-- Tab 内容 -->
      <view class="tab-content">
        <HomeTab v-show="activeTab === 'home'" @newProject="handleNewProject" />
        <YarnTab v-show="activeTab === 'yarn'" />
        <DiscoverTab v-show="activeTab === 'discover'" />
        <ProfileTab v-show="activeTab === 'profile'" />
      </view>
    </scroll-view>

    <!-- 底部导航 -->
    <BottomNavBar 
      class="bottom-nav"
      :activeTab="activeTab" 
      @tabChange="handleTabChange" 
    />
  </view>
</template>

<script>
import TopNavBar from '@/components/Dashboard/TopNavBar.vue';
import BottomNavBar from '@/components/Dashboard/BottomNavBar.vue';
import HomeTab from '@/components/Dashboard/HomeTab.vue';
import YarnTab from '@/components/Dashboard/YarnTab.vue';
import DiscoverTab from '@/components/Dashboard/DiscoverTab.vue';
import ProfileTab from '@/components/Dashboard/ProfileTab.vue';
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
  components: {
    TopNavBar,
    BottomNavBar,
    HomeTab,
    YarnTab,
    DiscoverTab,
    ProfileTab
  },
  data() {
    return {
      activeTab: 'home'
    }
  },
  onLoad(options) {

    // 确保用户信息已更新
    if (uni.getStorageSync('uni_id_token')) {
        mutations.updateUserInfo();
    }
    if (options.tab) {
        this.activeTab = options.tab;
    }
  },
  onShow() {
      // 每次显示页面时尝试更新用户信息，确保从编辑页返回时数据最新
      if (uni.getStorageSync('uni_id_token')) {
          mutations.updateUserInfo();
      }
      uni.$emit('refreshYarnList'); // 顺便刷新一下其他列表

      const targetTab = uni.getStorageSync('dashboard_active_tab');
      if (targetTab) {
          this.activeTab = targetTab;
          uni.removeStorageSync('dashboard_active_tab');
      }
  },
  computed: {
    pageTitle() {
      switch (this.activeTab) {
        case 'home': return '我的项目';
        case 'yarn': return '我的毛线库';
        case 'discover': return '发现';
        case 'profile': return '个人中心';
        default: return '我的项目';
      }
    }
  },
  methods: {
    handleTabChange(tabId) {
      this.activeTab = tabId;
    },
    handleNewProject() {
      if (this.activeTab === 'yarn') {
        uni.navigateTo({
          url: '/pages/yarn/create'
        });
      } else if (this.activeTab === 'discover') {
        uni.navigateTo({
          url: '/pages/post/create'
        });
      } else {
        uni.navigateTo({
          url: '/pages/project/create'
        });
      }
    },
    handleUserClick() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #FAF9F6;

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .bottom-nav {
    flex-shrink: 0;
    width: 100%;
    // position: fixed is handled by layout structure but existing style uses fixed.
    // Let's keep it fixed if it was working, or let flex handle it.
    // If flex works, we don't need fixed. But current BottomNavBar implementation might expect to be at flow bottom.
  }
}
</style>
