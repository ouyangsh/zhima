<template>
  <view class="project-card" @click="$emit('click')" @longpress="$emit('longpress')">
    <image :src="imageUrl" mode="aspectFill" class="project-image" />
    <view class="project-info">
      <view class="header">
        <text class="title">{{ title }}</text>
        <text class="time">{{ lastUpdate }}</text>
      </view>
      <text class="description">{{ description }}</text>
      
      <view class="progress-section">
        <view class="progress-bar-bg">
          <view class="progress-bar-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress }}%</text>
      </view>

      <view class="yarn-colors">
        <view 
          v-for="(color, index) in yarnColors" 
          :key="index"
          class="color-dot"
          :style="{ backgroundColor: color }"
        ></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  mounted() {
    // console.log('ProjectCard mounted:', this.title, 'Colors:', this.yarnColors);
  },
  props: {
    title: String,
    description: String,
    progress: Number,
    imageUrl: String,
    lastUpdate: String,
    yarnColors: Array
  }
}
</script>

<style lang="scss" scoped>
.project-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  margin-bottom: 16px;

  .project-image {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
  }

  .project-info {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;

      .title {
        font-size: 16px;
        font-weight: 600;
        color: #3A3A3A;
      }

      .time {
        font-size: 12px;
        color: #999999;
      }
    }

    .description {
      font-size: 12px;
      color: #666666;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      overflow: hidden;
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .progress-bar-bg {
        flex: 1;
        height: 6px;
        background-color: #F0F0F0;
        border-radius: 3px;
        overflow: hidden;

        .progress-bar-fill {
          height: 100%;
          background-color: #6C8EA4;
          border-radius: 3px;
        }
      }

      .progress-text {
        font-size: 12px;
        color: #6C8EA4;
        font-weight: 500;
      }
    }

    .yarn-colors {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(0,0,0,0.1);
      }
    }
  }
}
</style>
