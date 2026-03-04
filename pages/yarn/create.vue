<template>
  <view class="create-yarn-page" :class="{ 'scroll-hidden': isPopupOpen }">
    <!-- 固定顶部区域 -->
    <view class="fixed-header">
      <!-- 状态栏占位 -->
      <view :style="{ height: statusBarHeight + 'px', backgroundColor: '#ffffff' }"></view>
      <!-- 顶部导航 -->
      <view class="nav-bar">
        <view class="left" @click="goBack">
          <uni-icons type="back" size="24" color="#3A3A3A"></uni-icons>
        </view>
        <text class="title">{{ isEditMode ? '编辑毛线' : '添加毛线' }}</text>
        <!-- 胶囊按钮占位 -->
        <view class="right" :style="{ width: menuButtonWidth + 'px' }"></view>
      </view>
    </view>

    <view class="form-content" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <!-- 图片上传 -->
      <view class="form-item cover-upload" @click="handleUploadImage">
        <image v-if="imagePath" :src="imagePath" mode="aspectFill" class="cover-image"></image>
        <view v-else class="upload-placeholder">
          <uni-icons type="camera-filled" size="32" color="#999999"></uni-icons>
          <text class="upload-text">上传照片</text>
        </view>
      </view>

      <!-- 名称 -->
      <view class="form-item">
        <text class="label">毛线名称</text>
        <input 
          class="input" 
          v-model="formData.name" 
          placeholder="例如：美丽诺羊毛" 
          placeholder-class="input-placeholder"
        />
      </view>
      
      <!-- 颜色和重量 -->
      <view class="row-inputs">
        <view class="form-item half" @click="openColorPicker">
          <text class="label">颜色</text>
          <view class="color-display">
            <view 
              class="color-dot" 
              :style="{ backgroundColor: formData.color || '#F0F0F0' }"
              v-if="formData.color"
            ></view>
            <text :class="['value-text', { placeholder: !formData.color }]">
              {{ formData.color || '点击选择颜色' }}
            </text>
          </view>
        </view>
        <view class="form-item half">
          <text class="label">重量/规格</text>
          <input 
            class="input" 
            v-model="formData.weight" 
            placeholder="例如: 50g" 
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <!-- 数量 -->
      <view class="form-item">
        <text class="label">数量</text>
        <view class="quantity-control">
          <view class="btn minus" @click="changeQuantity(-1)">
            <uni-icons type="minus" size="18" color="#666"></uni-icons>
          </view>
          <input 
            class="qty-input" 
            type="number" 
            v-model="formData.quantity" 
          />
          <view class="btn plus" @click="changeQuantity(1)">
            <uni-icons type="plus" size="18" color="#666"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 描述 -->
      <view class="form-item">
        <text class="label">描述</text>
        <textarea 
          class="textarea" 
          v-model="formData.description" 
          placeholder="记录一下成分、购买渠道等信息..." 
          placeholder-class="input-placeholder"
        />
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="footer">
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '保存中...' : (isEditMode ? '保存修改' : '保存毛线') }}
      </button>
    </view>

    <!-- 颜色选择弹窗 -->
    <uni-popup ref="colorPopup" type="center" background-color="rgba(0,0,0,0)" @change="onPopupChange">
      <view class="color-picker-modal">
        <view class="custom-picker-content">
          <!-- 1. 饱和度/亮度面板 (SV Panel) -->
          <view 
            class="sv-panel" 
            :style="{ backgroundColor: 'hsl(' + hsv.h + ', 100%, 50%)' }"
            @touchstart="handleSvTouch"
            @touchmove.stop.prevent="handleSvTouch"
          >
            <view class="sv-gradient-white"></view>
            <view class="sv-gradient-black"></view>
            <view 
              class="sv-cursor" 
              :style="{ left: cursorX + 'px', top: cursorY + 'px', backgroundColor: previewColor }"
            ></view>
          </view>

          <!-- 2. 色相滑块 (Hue Slider) -->
          <view class="hue-slider-box">
             <slider 
                class="hue-slider" 
                :value="hsv.h" 
                :min="0" 
                :max="360" 
                :block-size="24"
                block-color="#ffffff"
                activeColor="transparent"
                backgroundColor="transparent"
                @changing="onHueChanging"
                @change="onHueChange"
             />
          </view>
          
          <!-- 3. 预览与输入 -->
          <view class="preview-row">
             <view class="preview-circle" :style="{ backgroundColor: previewColor }"></view>
             <input class="hex-input" v-model="inputHex" maxlength="7" />
          </view>

          <!-- 4. 预设颜色 -->
          <scroll-view scroll-x class="preset-scroll">
            <view class="preset-list">
              <view 
                class="preset-item" 
                v-for="(color, index) in presetColors" 
                :key="index"
                :style="{ backgroundColor: color }"
                @click="selectPreset(color)"
              ></view>
            </view>
          </scroll-view>
          
          <!-- 5. 底部按钮 -->
          <view class="picker-footer">
             <button class="picker-btn cancel" @click="closeColorPicker">取消</button>
             <button class="picker-btn confirm" @click="confirmCustomColor">确定</button>
          </view>
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
        color: '',
        weight: '',
        quantity: 1,
        image: '',
        project_id: '' // 暂留空
      },
      imagePath: '', // 本地预览路径
      submitting: false,
      statusBarHeight: 20,
      menuButtonWidth: 0,
      isEditMode: false,
      yarnId: '',
      isPopupOpen: false, // 弹窗开启状态
      // 自定义取色器状态
      hsv: { h: 210, s: 100, v: 100 },
      cursorX: 0,
      cursorY: 0,
      svPanelWidth: 0,
      svPanelHeight: 0,
      svPanelHeight: 0,
      inputHex: '#1B73CC',
      previewColor: '#1B73CC',
      isInternalUpdate: false, // Flag to prevent watcher loop
      presetColors: [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', // 彩虹
        '#FFFFFF', '#000000', '#808080', '#A52A2A', '#FFC0CB' // 基础
      ]
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
    
    // Check edit mode
    if (options.id) {
        this.yarnId = options.id;
        this.isEditMode = true;
        this.fetchYarnDetails(options.id);
    }
    
    // Programmatic watcher to ensure it works
    this.$watch('inputHex', (newVal) => {
        if (this.isInternalUpdate) {
            this.isInternalUpdate = false;
            return;
        }
        
        if (!newVal) return;
        
        let cleanVal = newVal.trim();
        const isHex = /^#?([0-9A-Fa-f]{6})$/.test(cleanVal);
        
        if (isHex) {
            let fullHex = cleanVal;
            if (!fullHex.startsWith('#')) fullHex = '#' + fullHex;
            
            // Always update preview and hsv
            this.previewColor = fullHex;
            this.topColorToHsv(fullHex);
        }
    });
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    async fetchYarnDetails(id) {
       uni.showLoading({ title: '加载中' });
       const db = uniCloud.database();
       try {
           const res = await db.collection('knitting-yarns').doc(id).get();
           if (res.result.data.length > 0) {
               const yarn = res.result.data[0];
               this.formData = {
                   name: yarn.name,
                   description: yarn.description,
                   color: yarn.color,
                   weight: yarn.weight,
                   quantity: yarn.quantity,
                   image: yarn.image,
                   project_id: yarn.project_id
               };
               
               if (yarn.image) {
                   if (yarn.image.startsWith('cloud://')) {
                       const fileRes = await uniCloud.getTempFileURL({ fileList: [yarn.image] });
                       if (fileRes.fileList && fileRes.fileList.length > 0) {
                           this.imagePath = fileRes.fileList[0].tempFileURL;
                       }
                   } else {
                       this.imagePath = yarn.image;
                   }
               }
           }
       } catch (e) {
           console.error('Fetch yarn failed', e);
           uni.showToast({ title: '加载失败', icon: 'none' });
       } finally {
           uni.hideLoading();
       }
    },
    // ... rest of existing methods
    openColorPicker() {
      this.$refs.colorPopup.open();
      // 初始化取色器状态
      const color = this.formData.color || '#1B73CC';
      this.inputHex = color;
      this.previewColor = color;
      this.topColorToHsv(color);
      
      // 等待 DOM 渲染后获取面板尺寸
      this.$nextTick(() => {
        setTimeout(() => {
           this.getSvPanelRect();
        }, 300);
      });
    },
    closeColorPicker() {
      this.$refs.colorPopup.close();
    },
    onPopupChange(e) {
      this.isPopupOpen = e.show;
    },
    confirmCustomColor() {
      this.formData.color = this.inputHex;
      this.closeColorPicker();
    },
    
    // --- 自定义取色器逻辑 ---
    getSvPanelRect() {
      const query = uni.createSelectorQuery().in(this);
      query.select('.sv-panel').boundingClientRect(data => {
        if (data) {
          this.svPanelWidth = data.width;
          this.svPanelHeight = data.height;
          // 根据当前 HSV 更新光标位置
          this.updateCursorFromHsv();
        }
      }).exec();
    },
    updateCursorFromHsv() {
      if (!this.svPanelWidth) return;
      // S: 0-100 -> x: 0-width
      // V: 0-100 -> y: height-0 (注意: V100在顶部，y=0)
      this.cursorX = (this.hsv.s / 100) * this.svPanelWidth;
      this.cursorY = (1 - this.hsv.v / 100) * this.svPanelHeight;
    },
    handleSvTouch(e) {
      if (!this.svPanelWidth) return;
       // 重新获取 rect 以防位置变动
       const query = uni.createSelectorQuery().in(this);
       query.select('.sv-panel').boundingClientRect(rect => {
         if (rect) {
            const touch = e.touches[0];
            let clientX = touch.clientX;
            let clientY = touch.clientY;
            
            let localX = clientX - rect.left;
            let localY = clientY - rect.top;
            
            // 边界限制
            localX = Math.max(0, Math.min(localX, rect.width));
            localY = Math.max(0, Math.min(localY, rect.height));
            
            this.cursorX = localX;
            this.cursorY = localY;
            
            // 计算 S, V
            // S = x / width * 100
            // V = (1 - y / height) * 100
            const s = (localX / rect.width) * 100;
            const v = (1 - localY / rect.height) * 100;
            
            this.hsv.s = Math.round(s);
            this.hsv.v = Math.round(v);
            
            this.updateColorFromHsv();
         }
       }).exec();
    },
    onHueChanging(e) {
      this.hsv.h = e.detail.value;
      this.updateColorFromHsv();
    },
    onHueChange(e) {
      this.hsv.h = e.detail.value;
      this.updateColorFromHsv();
    },
    updateColorFromHsv() {
      const { h, s, v } = this.hsv;
      const rgb = this.hsvToRgb(h, s, v);
      const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      
      this.isInternalUpdate = true;
      this.inputHex = hex;
      this.previewColor = hex;
    },
    selectPreset(color) {
      this.inputHex = color;
    },
    
    // --- 颜色算法 ---
    topColorToHsv(hex) {
      const rgb = this.hexToRgb(hex);
      if (rgb) {
        const newHsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        
        // 1. 设置单独属性
        this.hsv.h = newHsv.h;
        this.hsv.s = newHsv.s;
        this.hsv.v = newHsv.v;
        
         // 2. 整体替换
        this.hsv = { ...newHsv };
        this.$forceUpdate();

        this.$nextTick(() => {
           this.updateCursorFromHsv();
        });
      }
    },
    hexToRgb(hex) {
      if (!hex) return null;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    },
    hsvToRgb(h, s, v) {
      s = s / 100;
      v = v / 100;
      h = h / 360; // Standardize to 0-1 range
      let r, g, b;
      let i = Math.floor(h * 6);
      let f = h * 6 - i;
      let p = v * (1 - s);
      let q = v * (1 - f * s);
      let t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    },
    rgbToHsv(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let h, s, v = max;
      let d = max - min;
      s = max === 0 ? 0 : d / max;
      
      if (max === min) {
        h = 0;
      } else {
        // Use if/else instead of switch(float) to avoid potential strict equality issues
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else if (max === b) {
            h = (r - g) / d + 4;
        }
        h /= 6;
      }
      
      return { 
        h: Math.round(h * 360) || 0, // Ensure no NaN
        s: Math.round(s * 100), 
        v: Math.round(v * 100) 
      };
    },

    changeQuantity(delta) {
      let newVal = (Number(this.formData.quantity) || 0) + delta;
      if (newVal < 1) newVal = 1;
      this.formData.quantity = newVal;
    },
    handleUploadImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.imagePath = tempFilePath;
          
          uni.showLoading({ title: '上传中...' });
          uniCloud.uploadFile({
            filePath: tempFilePath,
            cloudPath: `yarn-images/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
            success: (uploadRes) => {
              this.formData.image = uploadRes.fileID;
            },
            fail: (err) => {
              console.error('上传失败', err);
              uni.showToast({ title: '上传失败', icon: 'none' });
              this.imagePath = '';
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
        return uni.showToast({ title: '请输入毛线名称', icon: 'none' });
      }

      this.submitting = true;
      const db = uniCloud.database();
      
      const dataToSave = {
          ...this.formData,
          quantity: Number(this.formData.quantity) || 1
      };
      
      let promise;
      if (this.isEditMode) {
          promise = db.collection('knitting-yarns').doc(this.yarnId).update(dataToSave);
      } else {
          promise = db.collection('knitting-yarns').add(dataToSave);
      }
      
      promise.then((res) => {
        uni.showToast({ title: this.isEditMode ? '更新成功' : '保存成功' });
        // Clear cache to force refresh list
        const cachedYarns = uni.getStorageSync('cached_yarn_list_v5');
        setTimeout(() => {
          uni.navigateBack();
          uni.$emit('refreshYarnList');
        }, 1500);
      }).catch((err) => {
        console.error('保存失败', err);
        uni.showToast({ title: '保存失败：' + err.message, icon: 'none' });
      }).finally(() => {
        this.submitting = false;
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.create-yarn-page {
  min-height: 100vh;
  background-color: #FAF9F6;
  padding-bottom: 100px;
  
  &.scroll-hidden {
    height: 100vh;
    overflow: hidden;
  }
  
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
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
      margin-bottom: 16px; 
    }
  }
  
  .color-display {
    display: flex;
    align-items: center;
    height: 24px;
    
    .color-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 8px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    
    .value-text {
      font-size: 16px;
      color: #3A3A3A;
      
      &.placeholder {
        color: #CCCCCC;
      }
    }
  }

  .quantity-control {
    display: flex;
    align-items: center;
    
    .btn {
      width: 32px;
      height: 32px;
      background-color: #F0F0F0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:active {
        opacity: 0.7;
      }
    }
    
    .qty-input {
      width: 60px;
      text-align: center;
      font-size: 16px;
      color: #3A3A3A;
    }
  }

  /* Color Picker Modal Styles */
  .color-picker-modal {
    width: 600rpx;
    background-color: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    padding: 0;
    
    .custom-picker-content {
      display: flex;
      flex-direction: column;
      padding: 20rpx;
      gap: 20rpx;
    }
    
    .sv-panel {
      width: 100%;
      height: 400rpx;
      position: relative;
      border-radius: 12rpx;
      overflow: hidden;
      
      .sv-gradient-white {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to right, #fff, rgba(255,255,255,0));
      }
      
      .sv-gradient-black {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to top, #000, rgba(0,0,0,0));
      }
      
      .sv-cursor {
        position: absolute;
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        border: 4rpx solid #fff;
        box-shadow: 0 0 4rpx rgba(0,0,0,0.5);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
    }
    
    .hue-slider-box {
      width: 100%;
      height: 40rpx;
      position: relative;
      margin-top: 10rpx;
      
      .hue-slider {
         width: 100%;
         margin: 0;
         /* Rainbow gradient background for track */
         background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
         border-radius: 20rpx;
         height: 32rpx;
      }
    }
    
    .preview-row {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      .preview-circle {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        border: 2rpx solid #eee;
        box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
      }
      
      .hex-input {
        flex: 1;
        height: 60rpx;
        background-color: #f5f5f5;
        border-radius: 8rpx;
        padding: 0 20rpx;
        font-size: 28rpx;
        color: #333;
        font-family: monospace;
      }
    }
    
    .preset-scroll {
      width: 100%;
      white-space: nowrap;
      
      .preset-list {
        display: inline-flex;
        gap: 16rpx;
        padding: 4rpx;
      }
      
      .preset-item {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        border: 2rpx solid #eee;
        flex-shrink: 0;
      }
    }
    
    .picker-footer {
      display: flex;
      gap: 20rpx;
      margin-top: 10rpx;
      
      .picker-btn {
        flex: 1;
        height: 72rpx;
        line-height: 72rpx;
        border-radius: 36rpx;
        font-size: 28rpx;
        border: none;
        
        &.cancel {
          background-color: #f5f5f5;
          color: #666;
        }
        
        &.confirm {
          background-color: #6C8EA4;
          color: #fff;
        }
      }
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
    z-index: 9;
    
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
}
</style>
