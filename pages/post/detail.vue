<template>
  <view class="post-detail-page">
    <!-- 顶部导航 (透明背景 -> 白色) -->
    <view class="nav-bar-container" :style="{ backgroundColor: navBackgroundColor }">
      <!-- 状态栏占位 -->
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航内容区 (固定高度44px) -->
      <view class="nav-content">
        <view class="left" @click="goBack">
          <view class="back-btn" :class="{ 'scrolled': isScrolled }">
            <uni-icons type="back" size="20" :color="isScrolled ? '#333' : '#fff'"></uni-icons>
          </view>
        </view>
        <text class="title" :style="{ opacity: navTitleOpacity }">作品详情</text>
        <!-- 胶囊按钮占位 -->
        <view class="right" :style="{ width: (menuButtonWidth || 80) + 'px' }"></view>
      </view>
    </view>

    <scroll-view scroll-y class="content-area" @scroll="onScroll">
      <!-- 图片轮播 -->
      <view class="swiper-container">
        <swiper class="image-swiper" :indicator-dots="displayImages.length > 1" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#ffffff" :autoplay="false" :circular="true" @change="onSwiperChange">
          <swiper-item v-for="(img, index) in displayImages" :key="index" @click="previewImage(index)">
            <image :src="img" mode="aspectFill" class="hero-image"></image>
          </swiper-item>
        </swiper>
        <view class="image-counter" v-if="displayImages.length > 1">
          <text>{{ currentImageIndex + 1 }}/{{ displayImages.length }}</text>
        </view>
      </view>

      <view class="main-content">
        <!-- 标题 -->
        <text class="post-title">{{ post.title }}</text>
        
        <!-- 作者信息 -->
        <view class="author-info">
            <image :src="post.user_avatar || '/static/logo.png'" mode="aspectFill" class="avatar"></image>
            <view class="info-text">
                <text class="nickname">{{ post.user_name || '织友' }}</text>
                <text class="time">{{ formatTime(post.created_at) }}</text>
            </view>
            <button class="follow-btn">关注</button>
        </view>

        <!-- 正文内容 -->
        <text class="post-text">{{ post.content }}</text>
        
        <!-- 底部数据 -->
        <view class="stats-bar">
            <view class="stat-item">
                <uni-icons type="eye" size="16" color="#999"></uni-icons>
                <text>{{ post.views || 0 }}</text>
            </view>
            <view class="stat-item">
                <uni-icons type="heart" size="16" color="#999"></uni-icons>
                <text>{{ post.likes || 0 }}</text>
            </view>
        </view>

        <!-- 评论区 -->
        <view class="comments-section">
            <text class="section-title">全部评论 ({{ comments.length }})</text>
            <view class="comment-list" v-if="comments.length > 0">
                <view class="comment-item" v-for="item in comments" :key="item._id">
                    <image :src="item.user_avatar || '/static/logo.png'" mode="aspectFill" class="c-avatar"></image>
                    <view class="c-content">
                        <view class="c-header">
                            <text class="c-name">{{ item.user_name }}</text>
                            <text class="c-time">{{ formatTime(item.created_at) }}</text>
                        </view>
                        <text class="c-text">{{ item.content }}</text>
                    </view>
                </view>
            </view>
            <view class="empty-comments" v-else>
                <text>快来发表第一条评论吧~</text>
            </view>
        </view>
      </view>
      
      <!-- 底部留白 -->
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer-action">
        <view class="action-input" @click="toggleCommentInput">
            <uni-icons type="chat" size="20" color="#666"></uni-icons>
            <text class="placeholder">说点什么...</text>
        </view>
        <view class="action-icons">
            <view class="icon-btn" @click="handleToggleLike">
                <uni-icons :type="isLiked ? 'heart-filled' : 'heart'" size="24" :color="isLiked ? '#FF6B6B' : '#333'"></uni-icons>
                <text :style="{ color: isLiked ? '#FF6B6B' : '#333' }">{{ post.likes || 0 }}</text>
            </view>
        </view>
    </view>
    
    <!-- 评论输入弹窗 -->
    <uni-popup ref="commentPopup" type="bottom" background-color="#fff">
        <view class="comment-popup">
            <view class="popup-header">
                <text class="title">发表评论</text>
                <uni-icons type="closeempty" size="24" color="#999" @click="closeCommentPopup"></uni-icons>
            </view>
            <textarea 
                class="comment-textarea" 
                v-model="commentContent" 
                placeholder="友善的评论是交流的开始..." 
                :focus="commentFocus"
                cursor-spacing="20"
            />
            <button class="send-btn" :disabled="!commentContent.trim() || sending" @click="handleSendComment">
                {{ sending ? '发送中...' : '发送' }}
            </button>
        </view>
    </uni-popup>
  </view>
</template>

<script>
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      postId: '',
      post: {
        title: '',
        content: '',
        cover: '',
        images: [],
        user_name: '',
        user_avatar: '',
        created_at: null,
        views: 0,
        likes: 0
      },
      displayImages: [],
      currentImageIndex: 0,
      comments: [],
      scrollTop: 0,
      commentContent: '',
      commentFocus: false,
      sending: false,
      isLiked: false,
      likeLoading: false
    }
  },
  computed: {
    navBackgroundColor() {
        return `rgba(255, 255, 255, ${Math.min(this.scrollTop / 100, 1)})`;
    },
    navTitleOpacity() {
        return Math.min(this.scrollTop / 100, 1);
    },
    isScrolled() {
        return this.scrollTop > 50;
    }
  },
  onLoad(options) {
    if (options.id) {
        this.postId = options.id;
        this.fetchPostDetail();
        this.fetchComments();
        this.checkLikeStatus();
    }
    
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
    async fetchPostDetail() {
        uni.showLoading({ title: '加载中...' });
        const db = uniCloud.database();
        try {
            const res = await db.collection('knitting-posts').doc(this.postId).get();
            if (res.result.data.length > 0) {
                let postData = res.result.data[0];
                
                // 收集所有需要转换的云存储URL
                let cloudFiles = [];
                const imageList = postData.images || (postData.cover ? [postData.cover] : []);
                
                imageList.forEach(url => {
                    if (url && url.startsWith('cloud://')) cloudFiles.push(url);
                });
                if (postData.user_avatar && postData.user_avatar.startsWith('cloud://')) {
                    cloudFiles.push(postData.user_avatar);
                }
                
                // 批量转换
                let fileMap = {};
                if (cloudFiles.length > 0) {
                    try {
                        const tempRes = await uniCloud.getTempFileURL({ fileList: [...new Set(cloudFiles)] });
                        tempRes.fileList.forEach(file => {
                            fileMap[file.fileID] = file.tempFileURL;
                        });
                    } catch(e) {
                        console.error('Convert images failed', e);
                    }
                }
                
                // 处理图片列表
                this.displayImages = imageList.map(url => fileMap[url] || url);
                postData.cover = this.displayImages[0] || '';
                postData.user_avatar = fileMap[postData.user_avatar] || postData.user_avatar;
                
                const knittingCo = uniCloud.importObject('knitting-co');
                knittingCo.addViewCount(this.postId).catch(e => {
                    console.error('Update view count failed', e);
                });
                
                this.post = postData;
            } else {
                uni.showToast({ title: '作品不存在', icon: 'none' });
            }
        } catch (e) {
            console.error('Fetch post detail failed', e);
        } finally {
            uni.hideLoading();
        }
    },
    async fetchComments() {
        const db = uniCloud.database();
        try {
            const res = await db.collection('knitting-comments')
                .where({ post_id: this.postId })
                .orderBy('created_at', 'desc')
                .get();
            
            let comments = res.result.data;
            
            // Batch process avatars
            const fileList = comments
                .filter(item => item.user_avatar && item.user_avatar.startsWith('cloud://'))
                .map(item => item.user_avatar);
                
            if (fileList.length > 0) {
                try {
                    const tempFilesRes = await uniCloud.getTempFileURL({ fileList });
                    const fileMap = {};
                    tempFilesRes.fileList.forEach(file => {
                        fileMap[file.fileID] = file.tempFileURL;
                    });
                    
                    comments = comments.map(item => ({
                        ...item,
                        user_avatar: fileMap[item.user_avatar] || item.user_avatar
                    }));
                } catch(e) {
                    console.error('Convert comment avatars failed', e);
                }
            }
            
            this.comments = comments;
        } catch (e) {
            console.error('Fetch comments failed', e);
        }
    },
    toggleCommentInput() {
        this.$refs.commentPopup.open();
        setTimeout(() => {
            this.commentFocus = true;
        }, 100);
    },
    closeCommentPopup() {
        this.$refs.commentPopup.close();
        this.commentFocus = false;
    },
    async handleSendComment() {
        if (!this.commentContent.trim()) return;
        
        this.sending = true;
        const db = uniCloud.database();
        const userInfo = uniCloud.getCurrentUserInfo();
        
        let userDetail = store.userInfo;
        if (!userDetail.nickname) {
             try {
                await mutations.updateUserInfo();
                userDetail = store.userInfo;
             } catch(e) {}
        }

        const commentData = {
            post_id: this.postId,
            user_id: userInfo.uid,
            user_name: userDetail.nickname || '织友',
            user_avatar: userDetail.avatar_file?.url || '',
            content: this.commentContent.trim()
        };
        
        try {
            // 1. Add comment
            await db.collection('knitting-comments').add(commentData);
            
            // 2. Add activity record
            const activityData = {
                user_id: userInfo.uid,
                type: 'comment',
                content: this.commentContent.trim(),
                target_id: this.postId,
                target_title: this.post.title,
                from_user_name: userDetail.nickname || '织友',
                from_user_avatar: userDetail.avatar_file?.url || ''
            };
            await db.collection('knitting-activities').add(activityData);
            
            // 3. Notify DiscoverTab to refresh activities
            uni.$emit('refreshDiscover');
            
            uni.showToast({ title: '评论成功' });
            this.commentContent = '';
            this.closeCommentPopup();
            this.fetchComments();
            
        } catch (e) {
            console.error('Send comment failed', e);
            uni.showToast({ title: '评论失败', icon: 'none' });
        } finally {
            this.sending = false;
        }
    },
    onScroll(e) {
        this.scrollTop = e.detail.scrollTop;
    },
    onSwiperChange(e) {
        this.currentImageIndex = e.detail.current;
    },
    previewImage(index) {
        if (this.displayImages.length > 0) {
            uni.previewImage({
                urls: this.displayImages,
                current: this.displayImages[index || 0]
            });
        }
    },
    async checkLikeStatus() {
        try {
            const userInfo = uniCloud.getCurrentUserInfo();
            if (!userInfo.uid) return;
            const knittingCo = uniCloud.importObject('knitting-co');
            const res = await knittingCo.checkLiked(this.postId, userInfo.uid);
            if (res.errCode === 0) {
                this.isLiked = res.liked;
            }
        } catch(e) {
            console.error('Check like status failed', e);
        }
    },
    async handleToggleLike() {
        if (this.likeLoading) return;
        
        const userInfo = uniCloud.getCurrentUserInfo();
        if (!userInfo.uid) {
            uni.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        
        this.likeLoading = true;
        
        try {
            const knittingCo = uniCloud.importObject('knitting-co');
            const res = await knittingCo.toggleLike(this.postId, userInfo.uid);
            
            if (res.errCode === 0) {
                this.isLiked = res.liked;
                this.post.likes = (this.post.likes || 0) + (res.liked ? 1 : -1);
                if (this.post.likes < 0) this.post.likes = 0;
            } else {
                uni.showToast({ title: res.errMsg || '操作失败', icon: 'none' });
            }
        } catch(e) {
            console.error('Toggle like failed', e);
            uni.showToast({ title: '操作失败', icon: 'none' });
        } finally {
            this.likeLoading = false;
        }
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  }
}
</script>

<style lang="scss" scoped>
.post-detail-page {
  height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  
  .nav-bar-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    transition: background-color 0.3s;
    
    .nav-content {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        position: relative;
        
        .title {
            font-size: 17px;
            font-weight: 600;
            color: #333;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            transition: opacity 0.3s;
        }
        
        .back-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s;
            
            &.scrolled {
                background-color: transparent;
            }
        }
        
        .right { flex-shrink: 0; }
    }
  }
  
  .content-area {
      flex: 1;
      height: 100%;
  }
  
  .swiper-container {
      position: relative;
      
      .image-swiper {
          width: 100%;
          height: 375px;
      }
      
      .image-counter {
          position: absolute;
          bottom: 30px;
          right: 16px;
          background-color: rgba(0,0,0,0.5);
          color: #ffffff;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 12px;
          z-index: 10;
      }
  }
  
  .hero-image {
      width: 100%;
      height: 375px; 
      background-color: #f0f0f0;
  }
  
  .main-content {
      padding: 24px 20px;
      position: relative;
      margin-top: -20px;
      background-color: #fff;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      min-height: 500px;
      padding-bottom: 0; /* Override */
      
      .post-title {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin-bottom: 20px;
          display: block;
      }
      
      .author-info {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          
          .avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: #eee;
              margin-right: 12px;
          }
          
          .info-text {
              flex: 1;
              
              .nickname {
                  font-size: 14px;
                  color: #333;
                  font-weight: 600;
                  display: block;
              }
              
              .time {
                  font-size: 12px;
                  color: #999;
              }
          }
          
          .follow-btn {
              padding: 0 16px;
              height: 28px;
              line-height: 28px;
              font-size: 12px;
              color: #6C8EA4;
              border: 1px solid #6C8EA4;
              background-color: #fff;
              border-radius: 14px;
              &::after { border: none; }
          }
      }
      
      .post-text {
          font-size: 16px;
          color: #444;
          line-height: 1.8;
          display: block;
          margin-bottom: 30px;
          white-space: pre-wrap;
      }
      
      .stats-bar {
          display: flex;
          gap: 20px;
          padding-top: 20px;
          padding-bottom: 20px;
          border-top: 1px solid #f5f5f5;
          border-bottom: 1px solid #f5f5f5;
          
          .stat-item {
              display: flex;
              align-items: center;
              gap: 6px;
              
              text {
                  font-size: 12px;
                  color: #999;
              }
          }
      }
      
      .comments-section {
          padding-top: 24px;
          
          .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #333;
              margin-bottom: 16px;
              display: block;
          }
          
          .comment-list {
              .comment-item {
                  display: flex;
                  gap: 12px;
                  margin-bottom: 20px;
                  
                  .c-avatar {
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background-color: #eee;
                      flex-shrink: 0;
                  }
                  
                  .c-content {
                      flex: 1;
                      
                      .c-header {
                          display: flex;
                          justify-content: space-between;
                          margin-bottom: 4px;
                          
                          .c-name { font-size: 13px; color: #666; font-weight: 500; }
                          .c-time { font-size: 11px; color: #ccc; }
                      }
                      
                      .c-text {
                          font-size: 14px;
                          color: #333;
                          line-height: 1.5;
                      }
                  }
              }
          }
          
          .empty-comments {
              padding: 40px 0;
              text-align: center;
              color: #999;
              font-size: 14px;
          }
      }
  }
  
  .footer-action {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #fff;
      padding: 12px 20px;
      padding-bottom: calc(12px + constant(safe-area-inset-bottom));
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 99;
      
      .action-input {
          flex: 1;
          height: 36px;
          background-color: #F8F8F8;
          border-radius: 18px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
          
          .placeholder {
              font-size: 14px;
              color: #999;
          }
      }
      
      .action-icons {
          display: flex;
          gap: 20px;
          
          .icon-btn {
              display: flex;
              align-items: center;
              gap: 4px;
              
              text {
                  font-size: 12px;
                  color: #333;
              }
          }
      }
  }
  
  .comment-popup {
      padding: 20px;
      padding-bottom: calc(20px + constant(safe-area-inset-bottom));
      padding-bottom: calc(20px + env(safe-area-inset-bottom));
      
      .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          
          .title { font-size: 16px; font-weight: 600; }
      }
      
      .comment-textarea {
          width: 100%;
          height: 120px;
          background-color: #F8F8F8;
          border-radius: 8px;
          padding: 12px;
          box-sizing: border-box;
          font-size: 15px;
          margin-bottom: 16px;
      }
      
      .send-btn {
          background-color: #6C8EA4;
          color: #fff;
          border-radius: 22px;
          font-size: 16px;
          height: 44px;
          line-height: 44px;
          
          &[disabled] {
              background-color: #E0E0E0;
              color: #999;
          }
          
          &::after { border: none; }
      }
  }
}
</style>
