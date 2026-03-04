<template>
  <view class="create-project-page">
    <!-- 固定顶部区域 -->
    <view class="fixed-header">
      <!-- 状态栏占位 -->
      <view :style="{ height: statusBarHeight + 'px', backgroundColor: '#ffffff' }"></view>
      <!-- 顶部导航 -->
      <view class="nav-bar">
        <view class="left" @click="goBack">
          <uni-icons type="back" size="24" color="#3A3A3A"></uni-icons>
        </view>
        <text class="title">{{ isEditMode ? '编辑项目' : '新建项目' }}</text>
        <!-- 胶囊按钮占位 -->
        <view class="right" :style="{ width: menuButtonWidth + 'px' }"></view>
      </view>
    </view>

    <view class="form-content" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <!-- 封面图上传 -->
      <view class="form-item cover-upload" @click="handleUploadCover">
        <image v-if="coverPath" :src="coverPath" mode="aspectFill" class="cover-image"></image>
        <view v-else class="upload-placeholder">
          <uni-icons type="camera-filled" size="32" color="#999999"></uni-icons>
          <text class="upload-text">上传封面图</text>
        </view>
      </view>

      <!-- 项目名称 -->
      <view class="form-item">
        <text class="label">项目名称</text>
        <input 
          class="input" 
          v-model="formData.name" 
          placeholder="给你的作品起个名字" 
          placeholder-class="input-placeholder"
        />
      </view>

      <!-- 项目简介 -->
      <view class="form-item">
        <text class="label">简介</text>
        <textarea 
          class="textarea" 
          v-model="formData.description" 
          placeholder="记录一下设计思路或灵感来源..." 
          placeholder-class="input-placeholder"
        />
      </view>

      <!-- 关联毛线 -->
      <view class="form-item">
        <view class="label-row">
          <text class="label">关联毛线</text>
          <view class="add-btn" @click="openYarnSelector">
            <uni-icons type="plusempty" size="14" color="#6C8EA4"></uni-icons>
            <text>添加</text>
          </view>
        </view>
        
        <view class="selected-yarns" v-if="selectedYarns.length > 0">
          <view class="yarn-tag" v-for="(yarn, index) in selectedYarns" :key="yarn.id">
            <view class="color-dot" :style="{ backgroundColor: yarn.color }"></view>
            <text class="yarn-name">{{ yarn.brand }} {{ yarn.colorCode }}</text>
            <view class="remove-btn" @click.stop="removeYarn(index)">
              <uni-icons type="closeempty" size="12" color="#999999"></uni-icons>
            </view>
          </view>
        </view>
        <view class="empty-yarns" v-else @click="openYarnSelector">
          <text>点击选择本项目使用的毛线</text>
        </view>
      </view>

      <!-- 行数进度 -->
      <view class="row-inputs">
        <view class="form-item half">
          <text class="label">总行数</text>
          <input 
            class="input" 
            type="number" 
            v-model="formData.total_rows" 
            placeholder="0" 
            placeholder-class="input-placeholder"
          />
        </view>
        <view class="form-item half">
          <text class="label">当前行数</text>
          <input 
            class="input" 
            type="number" 
            v-model="formData.current_row" 
            placeholder="0" 
            placeholder-class="input-placeholder"
          />
        </view>
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="footer">
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '保存中...' : (isEditMode ? '保存修改' : '创建项目') }}
      </button>
    </view>

    <!-- 毛线选择弹窗 -->
    <uni-popup ref="yarnPopup" type="bottom" background-color="#fff">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">选择毛线</text>
          <view class="close-btn" @click="closeYarnSelector">
            <uni-icons type="closeempty" size="20" color="#999"></uni-icons>
          </view>
        </view>
        <scroll-view scroll-y class="yarn-list-scroll">
            <view class="yarn-list">
                <view 
                    class="yarn-item" 
                    v-for="yarn in availableYarns" 
                    :key="yarn.id"
                    @click="toggleYarn(yarn)"
                    :class="{ 'selected': isYarnSelected(yarn.id) }"
                >
                    <image :src="yarn.imageUrl" mode="aspectFill" class="yarn-img"></image>
                    <view class="yarn-info">
                        <text class="yarn-brand">{{ yarn.brand }}</text>
                        <view class="yarn-detail">
                            <view class="color-dot" :style="{ backgroundColor: yarn.color }"></view>
                            <text class="yarn-code">{{ yarn.colorCode }}</text>
                            <text class="yarn-qty">库存: {{ yarn.ballsCount }}</text>
                        </view>
                    </view>
                    <view class="checkbox">
                        <uni-icons v-if="isYarnSelected(yarn.id)" type="checkmarkempty" size="16" color="#fff"></uni-icons>
                    </view>
                </view>
                
                <view v-if="availableYarns.length === 0" class="empty-state">
                    <text>暂无库存毛线，快去添加吧~</text>
                </view>
            </view>
        </scroll-view>
        <view class="popup-footer">
            <button class="confirm-btn" @click="closeYarnSelector">确定</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        description: '',
        total_rows: '', 
        current_row: '',
        cover: ''
      },
      selectedYarns: [], // 已选中的毛线
      availableYarns: [], // 可选的毛线列表
      coverPath: '', // 用于显示的本地或临时链接
      submitting: false,
      statusBarHeight: 20,
      menuButtonWidth: 0,
      isEditMode: false,
      projectId: ''
    }
  },
    onLoad(options) {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = (screenWidth - menuButtonInfo.left) + 10;
    // #endif
    
    this.fetchAvailableYarns();
    
    // Check if edit mode
    if (options.id) {
      this.projectId = options.id;
      this.isEditMode = true;
      this.fetchProjectDetails(options.id);
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    async fetchProjectDetails(id) {
      uni.showLoading({ title: '加载中' });
      const db = uniCloud.database();
      try {
        const res = await db.collection('knitting-projects').doc(id).get();
        if (res.result.data.length > 0) {
          const project = res.result.data[0];
          this.formData = {
            name: project.name,
            description: project.description,
            total_rows: project.total_rows,
            current_row: project.current_row,
            cover: project.cover
          };
          
          // Handle cover image display
          if (project.cover) {
             if (project.cover.startsWith('cloud://')) {
                 const fileRes = await uniCloud.getTempFileURL({ fileList: [project.cover] });
                 if (fileRes.fileList && fileRes.fileList.length > 0) {
                     this.coverPath = fileRes.fileList[0].tempFileURL;
                 }
             } else {
                 this.coverPath = project.cover;
             }
          }
          
          // Handle selected yarns
          if (project.yarns) {
              this.selectedYarns = project.yarns.map(y => ({
                  id: y.id,
                  brand: y.name,
                  color: y.color,
                  colorCode: '' // Assuming color code isn't stored in simple view
              }));
          }
        }
      } catch (e) {
        console.error('Fetch project failed', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    // ... existing fetchAvailableYarns ...
    fetchAvailableYarns() {
        // 尝试从 YarnTab 的缓存中读取，实现数据共享
        const cachedYarns = uni.getStorageSync('cached_yarn_list_v5');
        if (cachedYarns) {
            console.log('ProjectCreate: 使用 YarnTab 缓存列表 v5');
            this.availableYarns = cachedYarns;
            return;
        }

        const db = uniCloud.database();
        db.collection('knitting-yarns')
          .where('user_id == $env.uid')
          .orderBy('created_at', 'desc')
          .get()
          .then(res => {
            const list = res.result.data.map(item => ({
              id: item._id,
              color: item.color,
              brand: item.name,
              colorCode: item.color, 
              ballsCount: item.quantity,
              imageUrl: item.image
            }));
            this.availableYarns = list;
            // 注意：这里不写入 cached_yarn_list_v5，因为该缓存由 YarnTab 管理（包含图片链接转换逻辑）
            // 避免这里写入未转换的数据污染缓存
          })
          .catch(err => {
            console.error('获取毛线列表失败', err);
          });
    },
    openYarnSelector() {
        this.$refs.yarnPopup.open();
    },
    closeYarnSelector() {
        this.$refs.yarnPopup.close();
    },
    toggleYarn(yarn) {
        const index = this.selectedYarns.findIndex(y => y.id === yarn.id);
        if (index > -1) {
            this.selectedYarns.splice(index, 1);
        } else {
            this.selectedYarns.push(yarn);
        }
    },
    isYarnSelected(id) {
        return this.selectedYarns.some(y => y.id === id);
    },
    removeYarn(index) {
        this.selectedYarns.splice(index, 1);
    },
    handleUploadCover() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          // 立即显示本地图片，提升体验并避免 cloud:// 协议在部分环境显示异常
          this.coverPath = tempFilePath;
          
          // 上传到云存储
          uni.showLoading({ title: '上传中...' });
          uniCloud.uploadFile({
            filePath: tempFilePath,
            cloudPath: `project-covers/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
            success: (uploadRes) => {
              // 存储 fileID 到表单数据
              this.formData.cover = uploadRes.fileID;
              console.log('上传成功，fileID:', uploadRes.fileID);
            },
            fail: (err) => {
              console.error('上传失败', err);
              uni.showToast({ title: '上传失败', icon: 'none' });
              // 上传失败时清除显示
              this.coverPath = '';
            },
            complete: () => {
              uni.hideLoading();
            }
          });
        }
      });
    },
    handleSubmit() {
      if (!this.formData.name.trim()) {
        return uni.showToast({ title: '请输入项目名称', icon: 'none' });
      }

      this.submitting = true;
      const db = uniCloud.database();
      
      // 构建 yarn 数据 (精简保存，只存必要字段)
      const yarnsToSave = this.selectedYarns.map(y => ({
          id: y.id,
          name: y.brand,
          color: y.color
      }));
      
      const current = Number(this.formData.current_row) || 0;
      const total = Number(this.formData.total_rows) || 0;
      
      // 自动计算状态
      let status = 'planning';
      if (current > 0) {
          status = 'in_progress';
      }
      if (total > 0 && current >= total) {
          status = 'completed';
      }
      
      const dataToSave = {
        ...this.formData,
        total_rows: total,
        current_row: current,
        status: status,
        yarns: yarnsToSave
        // updated_at: Date.now() // Removed: handled by schema forceDefaultValue
      };

      let promise;
      if (this.isEditMode) {
          promise = db.collection('knitting-projects').doc(this.projectId).update(dataToSave);
      } else {
          // dataToSave.created_at = Date.now(); // Removed: handled by schema forceDefaultValue
          promise = db.collection('knitting-projects').add(dataToSave);
      }

      promise.then((res) => {
        uni.showToast({ title: this.isEditMode ? '更新成功' : '创建成功' });
        uni.removeStorageSync('cached_project_list_v5');
        setTimeout(() => {
          uni.navigateBack();
          // 可以触发一个事件通知列表刷新 (keeping for safety)
          uni.$emit('refreshProjectList');
        }, 1500);
      }).catch((err) => {
        console.error('操作失败', err);
        uni.showToast({ title: '操作失败：' + err.message, icon: 'none' });
      }).finally(() => {
        this.submitting = false;
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.create-project-page {
  min-height: 100vh;
  background-color: #FAF9F6;
  padding-bottom: 100px;
  
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
      width: 24px;
      display: flex;
      align-items: center;
    }
  }

  .form-content {
    padding: 20px;
  }

  // ... (中间样式保持不变，略)

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
    
    .input {
      font-size: 16px;
      color: #3A3A3A;
      height: 24px;
    }
    
    .textarea {
      font-size: 16px;
      color: #3A3A3A;
      height: 100px;
      width: 100%;
    }
    
    .input-placeholder {
      color: #CCCCCC;
    }
  }

  .row-inputs {
    display: flex;
    justify-content: space-between;
    gap: 16px;

    .form-item.half {
      flex: 1;
      margin-bottom: 0; // Remove bottom margin inside flex container if needed, or keep it consistent
    }
  }

  .cover-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 180px;
    padding: 0;
    overflow: hidden;
    position: relative;
    
    .cover-image {
      width: 100%;
      height: 100%;
    }
    
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .upload-text {
        font-size: 12px;
        color: #999999;
      }
    }
  }

  .status-options {
    display: flex;
    gap: 12px;
    
    .status-pill {
      padding: 6px 16px;
      border-radius: 16px;
      background-color: #F0F0F0;
      color: #999999;
      font-size: 14px;
      transition: all 0.2s;
      
      &.active {
        background-color: #6C8EA4;
        color: #FFFFFF;
        box-shadow: 0 2px 8px rgba(108, 142, 164, 0.2);
      }
    }
  }
  
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    padding-bottom: calc(16px + constant(safe-area-inset-bottom)); /* 兼容 iOS < 11.2 */
    padding-bottom: calc(16px + env(safe-area-inset-bottom)); /* 兼容 iOS >= 11.2 */
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
      }
      
      &:active {
        opacity: 0.9;
      }
    }
  }
  
  // Yarn Association Styles
  .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .label {
          margin-bottom: 0;
      }
      
      .add-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6C8EA4;
      }
  }
  
  .selected-yarns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
  }
  
  .yarn-tag {
      display: flex;
      align-items: center;
      background-color: #F5F7FA;
      border-radius: 16px;
      padding: 4px 8px 4px 4px;
      
      .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 6px;
          border: 1px solid rgba(0,0,0,0.05);
      }
      
      .yarn-name {
          font-size: 12px;
          color: #3A3A3A;
          margin-right: 6px;
      }
      
      .remove-btn {
          display: flex;
      }
  }
  
  .empty-yarns {
      padding: 12px;
      border: 1px dashed #E0E0E0;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      
      text {
          font-size: 12px;
          color: #999;
      }
  }
  
  // Popup Styles
  .popup-content {
      background-color: #fff;
      border-radius: 16px 16px 0 0;
      padding-bottom: constant(safe-area-inset-bottom);
      padding-bottom: env(safe-area-inset-bottom);
      height: 60vh;
      display: flex;
      flex-direction: column;
      
      .popup-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          
          .popup-title {
              font-size: 16px;
              font-weight: 600;
              color: #333;
          }
      }
      
      .yarn-list-scroll {
          flex: 1;
          height: 0; // Important for scrolling in flex container
      }
      
      .yarn-list {
          padding: 16px;
      }
      
      .yarn-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background-color: #f9f9f9;
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid transparent;
          transition: all 0.2s;
          
          &.selected {
              background-color: #F0F7FF;
              border-color: #6C8EA4;
          }
          
          .yarn-img {
              width: 48px;
              height: 48px;
              border-radius: 8px;
              margin-right: 12px;
              background-color: #eee;
          }
          
          .yarn-info {
              flex: 1;
              
              .yarn-brand {
                  font-size: 14px;
                  color: #333;
                  font-weight: 500;
                  margin-bottom: 4px;
                  display: block;
              }
              
              .yarn-detail {
                  display: flex;
                  align-items: center;
                  
                  .color-dot {
                      width: 10px;
                      height: 10px;
                      border-radius: 50%;
                      margin-right: 6px;
                      border: 1px solid rgba(0,0,0,0.1);
                  }
                  
                  .yarn-code {
                      font-size: 12px;
                      color: #666;
                      margin-right: 12px;
                  }
                  
                  .yarn-qty {
                      font-size: 12px;
                      color: #999;
                  }
              }
          }
          
          .checkbox {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              
              .selected & {
                  background-color: #6C8EA4;
                  border-color: #6C8EA4;
              }
          }
      }
      
      .empty-state {
          padding: 40px;
          text-align: center;
          color: #999;
          font-size: 14px;
      }
      
      .popup-footer {
          padding: 16px;
          border-top: 1px solid #eee;
          
          .confirm-btn {
              background-color: #6C8EA4;
              color: #fff;
              border-radius: 22px;
              font-size: 15px;
              height: 44px;
              line-height: 44px;
          }
      }
  }
}
</style>
