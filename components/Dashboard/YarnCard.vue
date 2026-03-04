<template>
  <view class="yarn-card" @longpress="$emit('longpress')">
    <view class="image-wrapper">
      <image :src="imageUrl" mode="aspectFill" class="yarn-image" />
      <view class="balls-badge">{{ ballsCount }}团</view>
    </view>
    <view class="yarn-info">
      <view class="brand-row">
        <text class="brand">{{ brand }}</text>
        <view class="color-indicator" :style="{ backgroundColor: color }"></view>
      </view>
      <text class="description">{{ description || '暂无描述' }}</text>
      <view class="footer">
        <text class="weight">{{ weight }}g</text>
        <text class="projects-count" v-if="relatedProjects > 0">{{ relatedProjects }}个项目</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    color: String,
    brand: String,
    description: String,
    colorCode: String,
    weight: Number,
    ballsCount: Number,
    imageUrl: String,
    relatedProjects: Number
  }
}
</script>

<style lang="scss" scoped>
.yarn-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;

  .image-wrapper {
    position: relative;
    width: 100%;
    height: 120px;

    .yarn-image {
      width: 100%;
      height: 100%;
    }

    .balls-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0, 0, 0, 0.6);
      color: #ffffff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .yarn-info {
    padding: 10px;

    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .brand {
        font-size: 14px;
        font-weight: 600;
        color: #3A3A3A;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .color-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(0,0,0,0.1);
        flex-shrink: 0;
      }
    }

    .description {
      font-size: 12px;
      color: #666666;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
      min-height: 17px;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .weight {
        font-size: 12px;
        color: #999999;
      }

      .projects-count {
        font-size: 10px;
        color: #6C8EA4;
        background-color: rgba(108, 142, 164, 0.1);
        padding: 2px 4px;
        border-radius: 4px;
      }
    }
  }
}
</style>
