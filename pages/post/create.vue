<template>
  <view class="create-post-page">
    <!-- 固定顶部区域 -->
    <view class="fixed-header">
      <!-- 状态栏占位 -->
      <view :style="{ height: statusBarHeight + 'px', backgroundColor: '#ffffff' }"></view>
      <!-- 顶部导航 -->
      <view class="nav-bar">
        <view class="left" @click="goBack">
          <uni-icons type="back" size="24" color="#3A3A3A"></uni-icons>
        </view>
        <text class="title">发布作品</text>
        <!-- 胶囊按钮占位 -->
        <view class="right" :style="{ width: (menuButtonWidth || 80) + 'px' }"></view>
      </view>
    </view>

    <scroll-view scroll-y class="content-area" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <view class="form-content">
        <!-- 图片上传区域 -->
        <view class="form-item">
            <view class="form-header">
                <text class="label">作品图片</text>
                <text class="count">{{ imageList.length }}/9</text>
            </view>
            <view class="image-grid">
                <view class="image-item" v-for="(img, index) in imageList" :key="index">
                    <image :src="img.tempPath" mode="aspectFill" class="preview-image" @click="previewImage(index)"></image>
                    <view class="delete-btn" @click.stop="removeImage(index)">
                        <uni-icons type="clear" size="20" color="#FF4D4F"></uni-icons>
                    </view>
                    <view class="cover-tag" v-if="index === 0">封面</view>
                </view>
                <view class="image-item add-btn" v-if="imageList.length < 9" @click="handleChooseImages">
                    <uni-icons type="plusempty" size="32" color="#CCCCCC"></uni-icons>
                    <text class="add-text">添加图片</text>
                </view>
            </view>
        </view>

        <!-- 标题 -->
        <view class="form-item">
            <view class="form-header">
                <text class="label">标题</text>
                <text class="count">{{ formData.title.length }}/20</text>
            </view>
            <input 
            class="title-input" 
            v-model="formData.title" 
            placeholder="给你的作品起个好听的名字" 
            placeholder-class="placeholder"
            maxlength="20"
            />
        </view>

        <!-- 内容 -->
        <view class="form-item content-section">
            <text class="label">心得体会</text>
            <textarea 
            class="content-input" 
            v-model="formData.content" 
            placeholder="说说你的编织心得、使用的线材和图解来源吧..." 
            placeholder-class="placeholder"
            maxlength="500"
            />
        </view>
      </view>
      
      <!-- 底部留白 -->
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer">
      <button class="submit-btn" :disabled="submitting" @click="handlePublish">
        {{ submitting ? '发布中...' : '发布作品' }}
      </button>
    </view>
  </view>
</template>

<script>
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      formData: {
        title: '',
        content: ''
      },
      imageList: [], // { tempPath, cloudPath, uploading, uploaded }
      submitting: false
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
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    handleChooseImages() {
      const remaining = 9 - this.imageList.length;
      if (remaining <= 0) {
        return uni.showToast({ title: '最多上传9张图片', icon: 'none' });
      }
      
      uni.chooseImage({
        count: remaining,
        success: (res) => {
          const newImages = res.tempFilePaths.map(path => ({
            tempPath: path,
            cloudPath: '',
            uploading: true,
            uploaded: false
          }));
          
          this.imageList = [...this.imageList, ...newImages];
          
          // Upload each image
          newImages.forEach((img, idx) => {
            const listIndex = this.imageList.length - newImages.length + idx;
            this.uploadImage(listIndex, img.tempPath);
          });
        }
      });
    },
    async uploadImage(index, filePath) {
      try {
        const uploadRes = await uniCloud.uploadFile({
          filePath: filePath,
          cloudPath: `post-images/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`
        });
        
        if (this.imageList[index]) {
          this.imageList[index].cloudPath = uploadRes.fileID;
          this.imageList[index].uploading = false;
          this.imageList[index].uploaded = true;
        }
      } catch (err) {
        console.error('Upload failed', err);
        uni.showToast({ title: '图片上传失败', icon: 'none' });
        if (this.imageList[index]) {
          this.imageList[index].uploading = false;
        }
      }
    },
    removeImage(index) {
      this.imageList.splice(index, 1);
    },
    previewImage(index) {
      const urls = this.imageList.map(img => img.tempPath);
      uni.previewImage({
        urls: urls,
        current: urls[index]
      });
    },
    async handlePublish() {
      if (!this.formData.title.trim()) {
          return uni.showToast({ title: '请输入标题', icon: 'none' });
      }
      if (this.imageList.length === 0) {
          return uni.showToast({ title: '请至少上传一张图片', icon: 'none' });
      }
      
      // Check if all images uploaded
      const uploading = this.imageList.filter(img => img.uploading);
      if (uploading.length > 0) {
          return uni.showToast({ title: '图片还在上传中，请稍候', icon: 'none' });
      }
      
      const failedImages = this.imageList.filter(img => !img.uploaded);
      if (failedImages.length > 0) {
          return uni.showToast({ title: '部分图片上传失败，请删除后重试', icon: 'none' });
      }
      
      this.submitting = true;
      uni.showLoading({ title: '发布中...' });
      
      const db = uniCloud.database();
      
      let userInfo = store.userInfo;
      if (!userInfo.nickname) {
           try {
              await mutations.updateUserInfo();
              userInfo = store.userInfo;
           } catch(e) {
               console.error('Update user info failed', e);
           }
      }
      
      const images = this.imageList.map(img => img.cloudPath);
      
      const postData = {
          title: this.formData.title.trim(),
          content: this.formData.content.trim(),
          images: images,
          cover: images[0], // 第一张图作为封面
          user_name: userInfo.nickname || '织友',
          user_avatar: userInfo.avatar_file?.url || '/static/logo.png',
          likes: 0,
          views: 0
      };
      
      db.collection('knitting-posts').add(postData).then(() => {
          uni.showToast({ title: '发布成功' });
          uni.$emit('refreshDiscover');
          setTimeout(() => {
              uni.navigateBack();
          }, 1500);
      }).catch(err => {
          console.error('Publish failed', err);
          uni.showToast({ title: '发布失败', icon: 'none' });
      }).finally(() => {
          this.submitting = false;
          uni.hideLoading();
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.create-post-page {
  min-height: 100vh;
  background-color: #FAF9F6;
  display: flex;
  flex-direction: column;
  
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
  
  .content-area {
      flex: 1;
      width: 100%;
      box-sizing: border-box;
  }

  .form-content {
      padding: 20px;
  }
  
  .form-item {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;

      .label {
          font-size: 14px;
          color: #666666;
          margin-bottom: 12px;
          display: block;
          font-weight: 500;
      }

      .placeholder {
          color: #CCCCCC;
      }
  }
  
  .image-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .image-item {
          width: calc(33.33% - 6px);
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          
          .preview-image {
              width: 100%;
              height: 100%;
          }
          
          .delete-btn {
              position: absolute;
              top: 4px;
              right: 4px;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: rgba(255,255,255,0.9);
              border-radius: 50%;
          }
          
          .cover-tag {
              position: absolute;
              bottom: 0;
              left: 0;
              background-color: rgba(108, 142, 164, 0.85);
              color: #fff;
              font-size: 10px;
              padding: 2px 8px;
              border-top-right-radius: 6px;
          }
          
          &.add-btn {
              background-color: #F8F8F8;
              border: 1px dashed #DDDDDD;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              
              .add-text {
                  font-size: 11px;
                  color: #CCCCCC;
              }
          }
      }
  }

  .form-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;

      .label { margin-bottom: 0; }
      .count { font-size: 12px; color: #999; }
  }
  
  .title-input {
      font-size: 16px;
      color: #3A3A3A;
      height: 24px;
      width: 100%;
  }

  .content-input {
      font-size: 16px;
      color: #3A3A3A;
      width: 100%;
      min-height: 120px;
      line-height: 1.6;
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    padding-bottom: calc(16px + constant(safe-area-inset-bottom));
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    background-color: #ffffff;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 10;
    
    .submit-btn {
      background-color: #6C8EA4;
      color: #ffffff;
      border-radius: 24px;
      height: 48px;
      line-height: 48px;
      font-size: 16px;
      border: none;
      
      &[disabled] {
        opacity: 0.7;
        background-color: #6C8EA4;
      }
      
      &:active {
        opacity: 0.9;
      }

      &::after { border: none; }
    }
  }
}
</style>
