<template>
  <view class="stat-card">
    <view class="count" :style="{ color: color }">{{ count }}</view>
    <view class="label">{{ label }}</view>
  </view>
</template>

<script>
export default {
  props: {
    label: String,
    count: Number,
    color: String
  }
}
</script>

<style lang="scss" scoped>
.stat-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .count {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .label {
    font-size: 12px;
    color: #999999;
  }
}
</style>
