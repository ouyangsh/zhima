<template>
  <view class="bottom-nav-bar">
    <view 
      v-for="item in navItems" 
      :key="item.id"
      class="nav-item"
      @click="$emit('tabChange', item.id)"
    >
      <uni-icons 
        :type="item.icon" 
        size="24" 
        :color="activeTab === item.id ? '#6C8EA4' : '#999999'"
      ></uni-icons>
      <text 
        class="label"
        :class="{ active: activeTab === item.id }"
      >{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    activeTab: String
  },
  emits: ['tabChange'],
  data() {
    return {
      navItems: [
        { id: 'home', label: '首页', icon: 'home' },
        { id: 'yarn', label: '毛线库', icon: 'shop' },
        { id: 'discover', label: '发现', icon: 'navigate' },
        { id: 'profile', label: '我的', icon: 'person' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.bottom-nav-bar {
  height: 80px;
  border-top: 1px solid #E0E0E0;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: 20px;
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;

    .label {
      font-size: 10px;
      color: #999999;
      
      &.active {
        color: #6C8EA4;
      }
    }
  }
}
</style>
