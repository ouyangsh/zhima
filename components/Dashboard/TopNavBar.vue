<template>
  <view class="top-nav-container">
    <!-- 状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px', backgroundColor: '#ffffff' }"></view>
    
    <!-- 导航栏内容 -->
    <view class="top-nav-bar" :style="{ height: navBarHeight + 'px', paddingRight: menuButtonWidth + 'px' }">
      <text class="title">{{ title }}</text>
      <view class="actions">
        <view class="action-btn add-btn" @click="$emit('addClick')">
          <uni-icons type="plusempty" size="20" color="#FFFFFF"></uni-icons>
        </view>
        <view class="action-btn user-btn" @click="$emit('userClick')">
          <uni-icons type="person" size="20" color="#3A3A3A"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    title: String
  },
  emits: ['addClick', 'userClick'],
  data() {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      menuButtonWidth: 0 // 胶囊按钮区域宽度
    }
  },
  mounted() {
    this.initLayout();
  },
  methods: {
    initLayout() {
      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 20;

      // #ifdef MP-WEIXIN
      // 微信小程序下，计算胶囊按钮的位置和宽度
      const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
      // 计算右侧需要预留的宽度：屏幕宽度 - 胶囊左边界 + 额外间距
      const screenWidth = systemInfo.screenWidth;
      // 胶囊左侧的间距通常也是右侧的边距，我们多留一点 buffer
      const gap = screenWidth - menuButtonInfo.right; 
      // 我们的按钮要在胶囊左边，所以 paddingRight 至少要是 (screenWidth - menuButtonInfo.left)
      // 但我们希望按钮在胶囊左侧显示，所以是占位。
      // 此时 actions 是 absolute 或者 flex 布局。
      // 简单处理：给 navbar 加 padding-right，让 standard flow 内容避开。
      
      // 修正：我们希望 actions (添加和用户按钮) 显示在胶囊的左侧。
      // 胶囊占据了右侧空间。
      // 计算 actions 容器应该有的 margin-right
      this.menuButtonWidth = (screenWidth - menuButtonInfo.left) + 10; // +10px 间距
      // #endif
    }
  }
}
</script>

<style lang="scss" scoped>
.top-nav-container {
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 999;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #E0E0E0;
  box-sizing: border-box;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #3A3A3A;
  }

  .actions {
    display: flex;
    gap: 12px;
    // 确保 actions 不会因为 padding 被挤压导致换行等问题
    flex-shrink: 0; 

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;

      &:active {
        opacity: 0.8;
      }
    }

    .add-btn {
      background-color: #6C8EA4;
    }

    .user-btn {
      background-color: #F8E5C8;
    }
  }
}
</style>
