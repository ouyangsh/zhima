<template>
  <view class="project-detail-page">
    <!-- 顶部导航 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px', height: (statusBarHeight + 44) + 'px' }">
      <view class="left" @click="goBack">
        <uni-icons type="back" size="24" color="#6C8EA4"></uni-icons>
      </view>
      <text class="title">{{ project.name }}</text>
      <!-- 占位，保持标题居中 -->
      <view class="right" :style="{ width: menuButtonWidth + 'px' }"></view>
    </view>

    <scroll-view scroll-y class="content-area" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <!-- 项目概览 -->
      <view class="card overview-card">
        <view class="yarn-colors" v-if="project.yarns && project.yarns.length > 0">
          <view 
            class="color-dot" 
            v-for="(yarn, index) in project.yarns" 
            :key="index"
            :style="{ backgroundColor: yarn.color }"
          ></view>
        </view>
        <view class="description" v-if="project.description">{{ project.description }}</view>
        <view class="progress-info">
          <text class="label">总进度</text>
          <text class="value">{{ progress }}%</text>
        </view>
        <view class="progress-bar-bg">
          <view class="progress-bar-fill" :style="{ width: progress + '%' }"></view>
        </view>
      </view>

      <!-- 图解展示区 -->
      <view class="card pattern-card">
        <!-- Tab 切换 -->
        <view class="pattern-tabs">
          <view 
            class="tab-item" 
            :class="{ active: patternTab === 'pattern' }" 
            @click="patternTab = 'pattern'"
          >
            <uni-icons type="image" size="16" :color="patternTab === 'pattern' ? '#6C8EA4' : '#999'"></uni-icons>
            <text>编织图解</text>
          </view>
          <view 
            class="tab-item" 
            :class="{ active: patternTab === 'ai' }" 
            @click="patternTab = 'ai'"
          >
            <uni-icons type="star" size="16" :color="patternTab === 'ai' ? '#6C8EA4' : '#999'"></uni-icons>
            <text>AI图解任务</text>
          </view>
        </view>

        <!-- 编织图解模式 -->
        <view v-if="patternTab === 'pattern'">
          <view class="pattern-display">
            <swiper class="pattern-swiper" circular indicator-dots v-if="patternImageUrlList.length > 0">
              <swiper-item v-for="(url, index) in patternImageUrlList" :key="index" @click="previewPattern(url)">
                 <image :src="url" mode="aspectFill" class="pattern-img"></image>
              </swiper-item>
            </swiper>

            <view v-else class="empty-pattern" @click="previewPattern('')">
              <uni-icons type="image" size="40" color="#E0E0E0"></uni-icons>
              <text>暂无图解</text>
            </view>
            
            <!-- 进度标记叠加层 -->
            <view class="overlay">
               <view class="progress-badge">
                 <text class="current">{{ project.current_row || 0 }}</text>
                 <text class="divider">/</text>
                 <text class="total">{{ project.total_rows || 0 }} 行</text>
               </view>
            </view>
          </view>
          <button class="import-btn" @click="handleUploadPattern">
            <uni-icons type="cloud-upload" size="20" color="#6C8EA4"></uni-icons>
            <text>导入图解（图片）</text>
          </button>
        </view>

        <!-- AI 图解任务模式 -->
        <view v-else class="ai-analysis-section">
          <!-- 上传区域 -->
          <view class="ai-upload-area" :class="{ analyzing: isAiAnalyzing }">
            <!-- 分析中遮罩 -->
            <view class="ai-loading-overlay" v-if="isAiAnalyzing">
              <view class="spinner"></view>
              <text class="loading-text">AI 正在努力识别中...</text>
            </view>

            <view class="ai-upload-content">
              <!-- 已有预览图 -->
              <view v-if="aiPreviewUrl" class="ai-preview-wrapper" @click="handleAiUpload">
                <image :src="aiPreviewUrl" mode="aspectFill" class="ai-preview-img"></image>
                <view class="ai-preview-overlay">
                  <text>更换图片</text>
                </view>
              </view>
              <!-- 无预览图 -->
              <view v-else class="ai-upload-placeholder">
                <view class="ai-icon-wrapper">
                  <uni-icons type="image" size="32" color="#6C8EA4"></uni-icons>
                </view>
                <text class="ai-upload-title">上传图解照片</text>
                <text class="ai-upload-desc">AI 将自动为你生成可勾选的钩织清单</text>
                <view class="ai-upload-btn" @click="handleAiUpload">
                  <uni-icons type="cloud-upload" size="18" color="#FFFFFF"></uni-icons>
                  <text>选择文件</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 错误提示 -->
          <view class="ai-error" v-if="aiError">
            <uni-icons type="info" size="18" color="#FF8C82"></uni-icons>
            <text>{{ aiError }}</text>
          </view>

          <!-- 钩织清单列表 -->
          <view class="ai-list-card">
            <view class="ai-list-header">
              <view class="ai-list-title">
                <text class="title">钩织列表</text>
                <text class="badge">{{ aiSections.length > 0 ? '已就绪' : '等待上传' }}</text>
              </view>
              <view class="ai-list-actions">
                <view class="action-btn" @click="clearAiData">
                  <uni-icons type="refresh" size="18" color="#999"></uni-icons>
                </view>
                <view class="action-btn" @click="handleAiCopy">
                  <uni-icons type="copy" size="16" color="#999"></uni-icons>
                  <text>复制</text>
                </view>
              </view>
            </view>

            <view class="ai-list-content">
              <view v-if="aiSections.length === 0" class="ai-empty">
                <text>暂无内容，请上传图解</text>
              </view>
              <view v-else>
                <view 
                  class="ai-section" 
                  v-for="(section, sIdx) in aiSections" 
                  :key="sIdx"
                >
                  <text class="section-title">{{ section.title }}</text>
                  <view class="section-rows">
                    <view 
                      class="row-item" 
                      :class="{ checked: aiCheckedRows[sIdx + '-' + row.id + '-' + rIdx] }"
                      v-for="(row, rIdx) in section.rows" 
                      :key="rIdx"
                      @click="toggleAiRow(sIdx + '-' + row.id + '-' + rIdx)"
                    >
                      <view class="row-left">
                        <text class="row-id">{{ row.id }}</text>
                        <view 
                          class="row-dot" 
                          :class="{ active: aiCheckedRows[sIdx + '-' + row.id + '-' + rIdx] }"
                        ></view>
                        <view class="row-info">
                          <text 
                            class="row-count" 
                            :class="{ done: aiCheckedRows[sIdx + '-' + row.id + '-' + rIdx] }"
                          >{{ row.count }} 针</text>
                          <text class="row-detail">{{ row.detail }}</text>
                        </view>
                      </view>
                      <view 
                        class="row-check" 
                        :class="{ checked: aiCheckedRows[sIdx + '-' + row.id + '-' + rIdx] }"
                      >
                        <uni-icons 
                          v-if="aiCheckedRows[sIdx + '-' + row.id + '-' + rIdx]" 
                          type="checkmarkempty" 
                          size="16" 
                          color="#FFFFFF"
                        ></uni-icons>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 进度条 -->
            <view class="ai-progress-footer" v-if="aiSections.length > 0">
              <view class="ai-progress-info">
                <text>当前进度 ({{ aiCompletedRows }}/{{ aiTotalRows }})</text>
                <text>{{ aiProgress }}%</text>
              </view>
              <view class="ai-progress-bar-bg">
                <view class="ai-progress-bar-fill" :style="{ width: aiProgress + '%' }"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 行数计数器 -->
      <view class="card row-counter-card">
        <view class="header-row">
          <text class="label">当前行数</text>
          <view class="row-target-edit">
            <text class="sub-label">目标</text>
            <input class="mini-input target" type="number" v-model.number="project.total_rows" @blur="onTargetRowChange" />
            <text class="sub-label">行</text>
          </view>
        </view>
        <view class="counter-controls">
          <view class="btn minus" @click="updateRow(-1)">
            <uni-icons type="minus" size="24" color="#6C8EA4"></uni-icons>
          </view>
          <view class="display">
            <input class="row-counter-input" type="number" v-model.number="project.current_row" @blur="onCurrentRowChange" />
            <text class="unit">行</text>
          </view>
          <view class="btn plus" @click="updateRow(1)">
            <uni-icons type="plusempty" size="24" color="#FFFFFF"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 辅助工具 (针数 & 计时) -->
      <view class="card tools-card">
        <text class="card-title">辅助工具</text>
        <view class="tools-grid">
          <!-- 针数计数 -->
          <view class="tool-item stitch-counter">
             <text class="tool-label">针数计数</text>
             <view class="control-row">
               <view class="mini-btn" @click="updateStitch(-1)">
                 <uni-icons type="minus" size="16" color="#666"></uni-icons>
               </view>
               <input class="stitch-counter-input" type="number" v-model.number="project.stitch_count" @blur="onStitchCountChange" />
               <view class="mini-btn primary" @click="updateStitch(1)">
                 <uni-icons type="plusempty" size="16" color="#FFF"></uni-icons>
               </view>
             </view>
             <view class="reset-btn" @click="resetStitch">
               <uni-icons type="refresh" size="12" color="#999"></uni-icons>
               <text>重置</text>
             </view>
          </view>

          <!-- 计时器 -->
          <view class="tool-item timer">
            <text class="tool-label">编织计时</text>
            <text class="time-display">{{ formattedTime }}</text>
            <view class="timer-controls">
              <view 
                class="control-btn" 
                :class="isTimerRunning ? 'pause' : 'start'"
                @click="toggleTimer"
              >
                <uni-icons :type="isTimerRunning ? 'control-pause' : 'control-play-filled'" size="16" color="#FFF"></uni-icons>
                <text>{{ isTimerRunning ? '暂停' : '开始' }}</text>
              </view>
              <view class="reset-icon-btn" @click="resetTimer">
                <uni-icons type="refresh" size="16" color="#999"></uni-icons>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 笔记区域 -->
      <view class="card notes-card">
        <view class="card-header">
           <view class="title-row">
             <uni-icons type="compose" size="20" color="#6C8EA4"></uni-icons>
             <text class="title">项目笔记</text>
             <view class="badge" v-if="project.notes && project.notes.length > 0">
               {{ project.notes.length }}
             </view>
           </view>
        </view>

        <view class="input-area">
          <textarea 
            class="note-textarea" 
            v-model="noteInput" 
            placeholder="记录编织心得、花样调整..." 
            :maxlength="500"
          />
          <view 
            class="send-btn" 
            :class="{ disabled: !noteInput.trim() }"
            @click="addNote"
          >
            <uni-icons type="paperplane-filled" size="20" color="#FFFFFF"></uni-icons>
          </view>
        </view>
        
        <view class="notes-list" v-if="project.notes && project.notes.length > 0">
           <view class="note-item" v-for="(note, index) in project.notes" :key="note.id">
             <view class="note-header">
               <text class="time">{{ note.created_at }}</text>
               <view class="delete" @click="deleteNote(index)">
                 <uni-icons type="trash" size="14" color="#FF8C82"></uni-icons>
                 <text>删除</text>
               </view>
             </view>
             <text class="content">{{ note.content }}</text>
           </view>
        </view>
        <view class="empty-notes" v-else>
           <uni-icons type="compose" size="40" color="#E0E0E0"></uni-icons>
           <text>还没有笔记，开始记录吧</text>
        </view>
      </view>
      
      <!-- 底部安全区 -->
      <view style="height: 40px;"></view>
    </scroll-view>
  </view>
</template>

<script>
// 简单的防抖/节流工具
const debounce = (fn, delay) => {
  let timer = null;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
};

export default {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      projectId: '',
      project: {
        _id: '',
        name: '加载中...',
        description: '',
        yarns: [],
        total_rows: 0,
        current_row: 0,
        stitch_count: 0,
        timer_seconds: 0,
        pattern_image: '',
        pattern_images: [], 
        notes: []
      },
      patternImageUrlList: [], // 用于显示的图片地址列表
      noteInput: '',
      // 计时器状态
      isTimerRunning: false,
      timerInterval: null,
      currentSessionSeconds: 0,
      
      saveQueue: {}, // 用于合并更新请求
      
      // AI 图解任务
      patternTab: 'pattern', // 'pattern' | 'ai'
      aiSections: [],
      aiCheckedRows: {},
      isAiAnalyzing: false,
      aiError: null,
      aiPreviewUrl: null
    };
  },
  computed: {
    progress() {
      if (!this.project.total_rows) return 0;
      return Math.min(100, Math.round((this.project.current_row / this.project.total_rows) * 100));
    },
    formattedTime() {
      const totalSeconds = (this.project.timer_seconds || 0) + this.currentSessionSeconds;
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    aiTotalRows() {
      return this.aiSections.reduce((acc, s) => acc + (s.rows ? s.rows.length : 0), 0);
    },
    aiCompletedRows() {
      return Object.values(this.aiCheckedRows).filter(Boolean).length;
    },
    aiProgress() {
      if (this.aiTotalRows === 0) return 0;
      return Math.round((this.aiCompletedRows / this.aiTotalRows) * 100);
    }
  },
  onLoad(options) {
    if (options.id) {
      this.projectId = options.id;
      this.fetchProjectDetail();
    }
    
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    const screenWidth = systemInfo.screenWidth;
    this.menuButtonWidth = (screenWidth - menuButtonInfo.left) + 10;
    // #endif
  },
  onUnload() {
    this.stopTimer();
    this.saveProjectData(); // 离开时确保保存
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    fetchProjectDetail() {
      const db = uniCloud.database();
      db.collection('knitting-projects').doc(this.projectId).get().then(async res => {
        if (res.result.data && res.result.data.length > 0) {
          const data = res.result.data[0];
          this.project = {
             ...data,
             current_row: data.current_row || 0,
             total_rows: data.total_rows || 0,
             stitch_count: data.stitch_count || 0,
             timer_seconds: data.timer_seconds || 0,
             notes: data.notes || [],
             yarns: data.yarns || [],
             pattern_images: data.pattern_images || (data.pattern_image ? [data.pattern_image] : []) // 兼容旧数据
           };
           
           // 恢复 AI 图解数据
           if (data.ai_sections && data.ai_sections.length > 0) {
             this.aiSections = data.ai_sections;
             this.aiCheckedRows = data.ai_checked_rows || {};
             this.aiPreviewUrl = 'saved'; // 标记已有数据
             // 恢复 AI 图解图片
             if (data.ai_pattern_image) {
               try {
                 const aiImgRes = await uniCloud.getTempFileURL({ fileList: [data.ai_pattern_image] });
                 if (aiImgRes.fileList && aiImgRes.fileList[0] && aiImgRes.fileList[0].tempFileURL) {
                   this.aiPreviewUrl = aiImgRes.fileList[0].tempFileURL;
                 }
               } catch (e) {
                 console.error('恢复AI图片失败', e);
               }
             }
          };
          
          // 处理图片链接
          // 处理图片链接
          const patterns = this.project.pattern_images;
          if (patterns && patterns.length > 0) {
            console.log('ProjectDetail: Detail has patterns', patterns);
            
            const cloudIds = patterns.filter(p => p.startsWith('cloud://'));
            let fileMap = {};

            if (cloudIds.length > 0) {
              try {
                const fileRes = await uniCloud.getTempFileURL({
                  fileList: cloudIds
                });
                console.log('ProjectDetail: Converted cloud URLs', fileRes);
                
                if (fileRes.fileList) {
                  fileRes.fileList.forEach(item => {
                    // 只要有 tempFileURL 且不为空，或者 code/status 正常
                    if ((item.code === 'SUCCESS' || item.status === 0) || (item.tempFileURL && item.tempFileURL.length > 0)) {
                        fileMap[item.fileID] = item.tempFileURL;
                    } else {
                        console.error('ProjectDetail: Failed to convert', item);
                        fileMap[item.fileID] = item.fileID; 
                    }
                  });
                }
              } catch (e) {
                console.error('ProjectDetail: 转换图片链接失败', e);
              }
            }
            
            // 映射最终列表，如果转换失败则保留原链接（虽然无法显示但能占位/调试）
            // 或者过滤掉也可以，但至少日志能看到
            this.patternImageUrlList = patterns.map(p => {
                if (p.startsWith('cloud://')) {
                    return fileMap[p] || '';
                }
                return p;
            }).filter(url => !!url);
            
            console.log('ProjectDetail: Final image list', this.patternImageUrlList);
          } else {
             this.patternImageUrlList = [];
          }
        }
      }).catch(err => {
        console.error('获取详情失败', err);
        uni.showToast({ title: '加载失败', icon: 'none' });
      });
    },
    updateRow(delta) {
      const newVal = (this.project.current_row || 0) + delta;
      if (newVal < 0) return;
      if (this.project.total_rows > 0 && newVal > this.project.total_rows) return;
      
      this.project.current_row = newVal;
      this.queueSave('current_row', newVal);
      this.checkStatusUpdate();
    },
    onTargetRowChange() {
      let val = parseInt(this.project.total_rows);
      if (isNaN(val) || val < 0) val = 0;
      this.project.total_rows = val;
      this.queueSave('total_rows', val);
      this.checkStatusUpdate();
    },
    onCurrentRowChange() {
      let val = parseInt(this.project.current_row);
      if (isNaN(val) || val < 0) val = 0;
      this.project.current_row = val;
      this.queueSave('current_row', val);
      this.checkStatusUpdate();
    },
    onStitchCountChange() {
      let val = parseInt(this.project.stitch_count);
      if (isNaN(val) || val < 0) val = 0;
      this.project.stitch_count = val;
      this.queueSave('stitch_count', val);
    },
    updateStitch(delta) {
       const newVal = (this.project.stitch_count || 0) + delta;
       if (newVal < 0) return;
       this.project.stitch_count = newVal;
       this.queueSave('stitch_count', newVal);
    },
    resetStitch() {
      uni.showModal({
        title: '重置针数',
        content: '确定要将针数计数归零吗？',
        success: (res) => {
          if (res.confirm) {
            this.project.stitch_count = 0;
            this.queueSave('stitch_count', 0);
          }
        }
      });
    },
    // 计时器逻辑
    toggleTimer() {
      if (this.isTimerRunning) {
        this.stopTimer();
      } else {
        this.startTimer();
      }
    },
    startTimer() {
      this.isTimerRunning = true;
      this.timerInterval = setInterval(() => {
        this.currentSessionSeconds++;
      }, 1000);
    },
    stopTimer() {
      if (this.isTimerRunning) {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
        // 累加到总时间并保存
        this.project.timer_seconds = (this.project.timer_seconds || 0) + this.currentSessionSeconds;
        this.currentSessionSeconds = 0;
        this.queueSave('timer_seconds', this.project.timer_seconds);
      }
    },
    resetTimer() {
       uni.showModal({
        title: '重置计时',
        content: '确定要将计时归零吗？',
        success: (res) => {
          if (res.confirm) {
            this.stopTimer();
            this.project.timer_seconds = 0;
            this.currentSessionSeconds = 0;
            this.queueSave('timer_seconds', 0);
          }
        }
      });
    },
    // 笔记逻辑
    addNote() {
      if (!this.noteInput.trim()) return;
      
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      const newNote = {
        id: Date.now().toString(),
        content: this.noteInput.trim(),
        created_at: timeStr
      };
      
      // 更新本地
      if (!this.project.notes) this.project.notes = [];
      this.project.notes.unshift(newNote);
      
      // 保存数据库
      this.queueSave('notes', this.project.notes);
      
      this.noteInput = '';
    },
    deleteNote(index) {
       uni.showModal({
        title: '删除笔记',
        content: '确定删除这条笔记吗？',
        success: (res) => {
          if (res.confirm) {
            this.project.notes.splice(index, 1);
            this.queueSave('notes', this.project.notes);
          }
        }
      });
    },
    // 图解逻辑
    handleUploadPattern() {
      uni.chooseImage({
        count: 9, // 允许选择多张
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths;
          uni.showLoading({ title: '上传中' });
          
          if (!this.project.pattern_images) this.project.pattern_images = [];
          
          // 立即显示选中的图片（追加到现有列表）
          this.patternImageUrlList = [...this.patternImageUrlList, ...tempFilePaths];
          
          const uploadPromises = tempFilePaths.map(filePath => {
            return new Promise((resolve, reject) => {
               uniCloud.uploadFile({
                filePath: filePath,
                cloudPath: `project-patterns/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
                success: (uploadRes) => {
                   resolve(uploadRes.fileID);
                },
                fail: (err) => {
                   reject(err);
                }
              }); 
            });
          });

          try {
             const fileIDs = await Promise.all(uploadPromises);
             // 将新上传的 ID 追加到数组
             this.project.pattern_images = [...this.project.pattern_images, ...fileIDs];
             this.queueSave('pattern_images', this.project.pattern_images);
             
             uni.showToast({ title: '上传成功' });
          } catch (err) {
             console.error(err);
             uni.showToast({ title: '部分上传失败', icon: 'none' });
          } finally {
             uni.hideLoading();
          }
        }
      });
    },
    previewPattern(currentUrl) {
      if (this.patternImageUrlList && this.patternImageUrlList.length > 0) {
        uni.previewImage({
          current: currentUrl,
          urls: this.patternImageUrlList
        });
      }
    },
    // 数据保存队列 (简单的防抖保存)
    queueSave(field, value) {
      this.saveQueue[field] = value;
      this.debouncedSave();
    },
    debouncedSave: debounce(function() {
       this.saveProjectData();
    }, 1000),
    
    saveProjectData() {
       if (Object.keys(this.saveQueue).length === 0) return;
       
       const updates = { ...this.saveQueue };
       // 清空队列
       this.saveQueue = {}; 
       
       const db = uniCloud.database();
       db.collection('knitting-projects').doc(this.projectId).update(updates)
         .then(() => {
           console.log('自动保存成功', updates);
           // 通知列表刷新
           uni.$emit('refreshProjectList');
           
           // 可选：如果是上传图片等关键操作，显示成功提示
// if (updates.pattern_images) {
            //    uni.showToast({ title: '图解已保存', icon: 'success' });
            // }
         })
         .catch(err => {
           console.error('保存失败', err);
           uni.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
         });
    },
    checkStatusUpdate() {
        let newStatus = this.project.status;
        const current = this.project.current_row || 0;
        const total = this.project.total_rows || 0;
        
        if (current === 0) {
            newStatus = 'planning';
        } else if (total > 0 && current >= total) {
            newStatus = 'completed';
        } else {
            newStatus = 'in_progress';
        }
        
        if (newStatus !== this.project.status) {
            this.project.status = newStatus;
            this.queueSave('status', newStatus);
        }
    },
    // ========== AI 图解任务 ==========
    handleAiUpload() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          this.aiPreviewUrl = filePath;

          // 上传图片到云存储
          uniCloud.uploadFile({
            filePath: filePath,
            cloudPath: `ai-patterns/${this.projectId}-${Date.now()}.jpg`,
            success: (uploadRes) => {
              this.queueSave('ai_pattern_image', uploadRes.fileID);
              console.log('AI图解图片已保存:', uploadRes.fileID);
            },
            fail: (err) => {
              console.error('AI图解图片上传失败', err);
            }
          });

          // 读取为 base64 发送给云函数分析
          // #ifdef H5
          const reader = new FileReader();
          reader.onloadend = () => {
            this.analyzeImage(reader.result);
          };
          reader.readAsDataURL(res.tempFiles[0]);
          // #endif
          // #ifndef H5
          const fs = uni.getFileSystemManager();
          fs.readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (readRes) => {
              const base64 = 'data:image/png;base64,' + readRes.data;
              this.analyzeImage(base64);
            },
            fail: (err) => {
              console.error('读取文件失败', err);
              this.aiError = '读取文件失败，请重试。';
            }
          });
          // #endif
        }
      });
    },
    async analyzeImage(base64Data) {
      this.isAiAnalyzing = true;
      this.aiError = null;

      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'https://longx.aiwsh.dpdns.org/api/ai-pattern/analyze/',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { base64Data: base64Data, uid: this.projectId || 'anonymous' },
            success: (result) => {
              if (result.statusCode === 200) {
                resolve(result.data);
              } else {
                reject(new Error(`HTTP ${result.statusCode}`));
              }
            },
            fail: (err) => reject(err)
          });
        });

        console.log('后端返回:', res);

        if (res.errCode === 0 && res.data) {
          const parsed = res.data;
          if (parsed.sections) {
            this.aiSections = parsed.sections;
            this.aiCheckedRows = {};
            
            // 计算总行数
            let totalRows = 0;
            parsed.sections.forEach(section => {
              if (section.rows) {
                totalRows += section.rows.length;
              }
            });
            
            // 更新项目数据
            this.project.total_rows = totalRows;
            this.project.current_row = 0;
            
            // 保存到数据库
            this.queueSave('ai_sections', parsed.sections);
            this.queueSave('ai_checked_rows', {});
            this.queueSave('total_rows', totalRows);
            this.queueSave('current_row', 0);
          }
        } else {
          this.aiError = res.errMsg || 'AI 解析失败，请重试。';
        }
      } catch (err) {
        this.aiError = 'AI 解析失败，请重试或上传更清晰的图片。';
        console.error('AI分析失败', err);
      } finally {
        this.isAiAnalyzing = false;
      }
    },
    toggleAiRow(key) {
      const isChecked = !this.aiCheckedRows[key];
      this.$set(this.aiCheckedRows, key, isChecked);
      
      // 更新当前行数
      if (typeof this.project.current_row === 'number') {
        if (isChecked) {
          this.project.current_row++;
        } else if (this.project.current_row > 0) {
          this.project.current_row--;
        }
        this.queueSave('current_row', this.project.current_row);
      }
      
      // 保存勾选进度到数据库
      this.queueSave('ai_checked_rows', { ...this.aiCheckedRows });
    },
    handleAiCopy() {
      const text = this.aiSections.map(s =>
        `${s.title}:\n` + s.rows.map(r => `${r.id}: ${r.count}针 (${r.detail})`).join('\n')
      ).join('\n\n');
      
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'success' });
        }
      });
    },
    clearAiData() {
      this.aiSections = [];
      this.aiPreviewUrl = null;
      this.aiCheckedRows = {};
      this.aiError = null;
      // 同步清除数据库
      this.queueSave('ai_sections', []);
      this.queueSave('ai_checked_rows', {});
      this.queueSave('ai_pattern_image', '');
    }
  }
}
</script>

<style lang="scss" scoped>
.project-detail-page {
  min-height: 100vh;
  background-color: #FAF9F6;
  padding-bottom: 40px;

  /* Global box-sizing for this component */
  view, scroll-view, text, image, textarea, button {
    box-sizing: border-box;
  }

  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 100;
    border-bottom: 1px solid #E0E0E0;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #3A3A3A;
      max-width: 60%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .left, .right {
      width: 40px; 
      display: flex; 
      align-items: center;
    }
  }

  .content-area {
    padding: 16px; 
  }

  .card {
     background-color: #fff;
     border-radius: 12px;
     padding: 16px;
     margin-bottom: 12px;
     box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }

  // 概览卡片
  .overview-card {
     .yarn-colors {
       display: flex;
       gap: 8px;
       margin-bottom: 12px;
       
       .color-dot {
         width: 24px; 
         height: 24px; 
         border-radius: 50%; 
         border: 2px solid #E0E0E0;
       }
     }
     
     .description {
       font-size: 14px; 
       color: #666; 
       margin-bottom: 16px; 
       line-height: 1.5;
     }
     
     .progress-info {
       display: flex; 
       justify-content: space-between; 
       margin-bottom: 8px; 
       font-size: 14px;
       
       .label { color: #666; }
       .value { color: #6C8EA4; font-weight: 500; }
     }
     
     .progress-bar-bg {
       height: 8px; 
       background-color: #FAF9F6; 
       border-radius: 4px; 
       overflow: hidden; 
       
       .progress-bar-fill {
         height: 100%; 
         background-color: #5BB98A; 
         transition: width 0.3s;
       }
     }
  }

  // 图解卡片
  .pattern-card {
     // Tab 切换
     .pattern-tabs {
       display: flex;
       background-color: #F5F3EF;
       border-radius: 10px;
       padding: 3px;
       margin-bottom: 14px;

       .tab-item {
         flex: 1;
         display: flex;
         align-items: center;
         justify-content: center;
         gap: 4px;
         padding: 8px 0;
         border-radius: 8px;
         font-size: 13px;
         color: #999;
         transition: all 0.25s;

         &.active {
           background-color: #fff;
           color: #6C8EA4;
           font-weight: 600;
           box-shadow: 0 1px 4px rgba(0,0,0,0.06);
         }
       }
     }

     .pattern-display {
       position: relative; 
       width: 100%; 
       height: 200px; 
       background-color: #FAF9F6; 
       border-radius: 12px; 
       overflow: hidden; 
       margin-bottom: 12px; 
       border: 2px dashed #E0E0E0;
       
       .pattern-img { width: 100%; height: 100%; }

       .pattern-swiper {
          width: 100%; height: 100%;
       }
       
       .empty-pattern {
         height: 100%; 
         display: flex; 
         flex-direction: column; 
         align-items: center; 
         justify-content: center; 
         gap: 8px; 
         
         text { font-size: 12px; color: #999; }
       }
       
       .overlay {
         position: absolute; 
         bottom: 16px; 
         left: 0; 
         right: 0; 
         display: flex; 
         justify-content: center; 
         
         .progress-badge {
           background-color: rgba(255,255,255,0.9);
           backdrop-filter: blur(4px);
           border-radius: 20px; 
           padding: 6px 16px; 
           display: flex; 
           align-items: baseline; 
           box-shadow: 0 4px 12px rgba(0,0,0,0.1);
           
           .current { font-size: 18px; color: #6C8EA4; font-weight: 600; }
           .divider { margin: 0 4px; color: #999; font-size: 14px; }
           .total { font-size: 14px; color: #666; }
         }
       }
     }
     
     .import-btn {
       width: 100%; 
       height: 48px; 
       border: 2px dashed #6C8EA4; 
       border-radius: 12px; 
       display: flex; 
       align-items: center; 
       justify-content: center; 
       gap: 8px; 
       background-color: transparent; 
       color: #6C8EA4; 
       font-size: 14px; 
       
       &:active { background-color: rgba(108, 142, 164, 0.05); }
       
       // remove default button styles
       &::after { border: none; }
     }

     // ========== AI 图解任务样式 ==========
     .ai-analysis-section {
       display: flex;
       flex-direction: column;
       gap: 12px;
     }

     .ai-upload-area {
       position: relative;
       background-color: #FAF9F6;
       border: 2px dashed #E0E0E0;
       border-radius: 12px;
       overflow: hidden;

       &.analyzing {
         border-color: #6C8EA4;
       }
     }

     .ai-loading-overlay {
       position: absolute;
       top: 0; left: 0; right: 0; bottom: 0;
       background-color: rgba(255,255,255,0.85);
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       z-index: 10;

       .spinner {
         width: 32px; height: 32px;
         border: 3px solid #E0E0E0;
         border-top-color: #6C8EA4;
         border-radius: 50%;
         animation: ai-spin 0.8s linear infinite;
         margin-bottom: 8px;
       }

       .loading-text {
         font-size: 13px;
         color: #666;
         font-weight: 500;
       }
     }

     @keyframes ai-spin {
       to { transform: rotate(360deg); }
     }

     .ai-upload-content {
       display: flex;
       flex-direction: column;
       align-items: center;
       padding: 24px 16px;
     }

     .ai-preview-wrapper {
       position: relative;
       width: 100%;
       height: 128px;
       border-radius: 10px;
       overflow: hidden;

       .ai-preview-img {
         width: 100%; height: 100%;
       }

       .ai-preview-overlay {
         position: absolute;
         top: 0; left: 0; right: 0; bottom: 0;
         background-color: rgba(0,0,0,0.35);
         display: flex;
         align-items: center;
         justify-content: center;
         opacity: 0;
         transition: opacity 0.2s;

         text { color: #fff; font-size: 13px; }
       }

       &:active .ai-preview-overlay {
         opacity: 1;
       }
     }

     .ai-upload-placeholder {
       display: flex;
       flex-direction: column;
       align-items: center;
       text-align: center;

       .ai-icon-wrapper {
         width: 56px; height: 56px;
         border-radius: 28px;
         background-color: rgba(108, 142, 164, 0.1);
         display: flex;
         align-items: center;
         justify-content: center;
         margin-bottom: 12px;
       }

       .ai-upload-title {
         font-size: 16px;
         font-weight: 600;
         color: #3A3A3A;
         margin-bottom: 4px;
       }

       .ai-upload-desc {
         font-size: 13px;
         color: #999;
         margin-bottom: 16px;
       }

       .ai-upload-btn {
         display: flex;
         align-items: center;
         gap: 6px;
         background-color: #6C8EA4;
         color: #fff;
         padding: 10px 24px;
         border-radius: 20px;
         font-size: 14px;
         font-weight: 500;

         &:active { opacity: 0.85; }
       }
     }

     .ai-error {
       display: flex;
       align-items: flex-start;
       gap: 8px;
       background-color: #FFF5F5;
       padding: 12px;
       border-radius: 10px;

       text { font-size: 13px; color: #FF8C82; flex: 1; }
     }

     .ai-list-card {
       background-color: #FAF9F6;
       border: 1px solid #E0E0E0;
       border-radius: 12px;
       overflow: hidden;
     }

     .ai-list-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 12px 14px;
       border-bottom: 1px solid #E0E0E0;

       .ai-list-title {
         display: flex;
         align-items: center;
         gap: 8px;

         .title {
           font-size: 15px;
           font-weight: 600;
           color: #3A3A3A;
         }

         .badge {
           font-size: 10px;
           color: #999;
           background-color: #EEEAE5;
           padding: 2px 8px;
           border-radius: 10px;
         }
       }

       .ai-list-actions {
         display: flex;
         align-items: center;
         gap: 4px;

         .action-btn {
           display: flex;
           align-items: center;
           gap: 2px;
           padding: 4px 8px;
           color: #999;
           font-size: 12px;
         }
       }
     }

     .ai-list-content {
       padding: 10px;
       max-height: 45vh;
       overflow-y: auto;
     }

     .ai-empty {
       padding: 40px 0;
       text-align: center;

       text {
         font-size: 13px;
         color: #CCC;
         font-style: italic;
       }
     }

     .ai-section {
       margin-bottom: 16px;

       .section-title {
         font-size: 11px;
         font-weight: 700;
         color: #999;
         text-transform: uppercase;
         letter-spacing: 1px;
         padding: 0 6px;
         margin-bottom: 6px;
         display: block;
       }
     }

     .section-rows {
       display: flex;
       flex-direction: column;
       gap: 4px;
     }

     .row-item {
       display: flex;
       align-items: center;
       justify-content: space-between;
       padding: 10px 12px;
       border-radius: 12px;
       transition: background-color 0.2s;

       &.checked {
         background-color: rgba(91, 185, 138, 0.06);
       }

       .row-left {
         display: flex;
         align-items: center;
         gap: 10px;
       }

       .row-id {
         font-size: 13px;
         font-weight: 500;
         color: #3A3A3A;
         width: 36px;
       }

       .row-dot {
         width: 6px; height: 6px;
         border-radius: 3px;
         background-color: #DDD;

         &.active {
           background-color: #5BB98A;
         }
       }

       .row-info {
         display: flex;
         flex-direction: column;
       }

       .row-count {
         font-size: 13px;
         font-weight: 600;
         color: #6C8EA4;

         &.done {
           text-decoration: line-through;
           opacity: 0.5;
         }
       }

       .row-detail {
         font-size: 10px;
         color: #999;
         font-family: monospace;
         font-style: italic;
       }

       .row-check {
         width: 24px; height: 24px;
         border-radius: 6px;
         display: flex;
         align-items: center;
         justify-content: center;
         background-color: #F0EDEA;
         border: 1px solid #E0E0E0;
         transition: all 0.2s;

         &.checked {
           background-color: #5BB98A;
           border-color: #5BB98A;
           box-shadow: 0 2px 6px rgba(91, 185, 138, 0.3);
         }
       }
     }

     .ai-progress-footer {
       padding: 12px 14px;
       background-color: #F0EDEA;
       border-top: 1px solid #E0E0E0;

       .ai-progress-info {
         display: flex;
         justify-content: space-between;
         font-size: 11px;
         color: #999;
         margin-bottom: 6px;
         font-weight: 500;
       }

       .ai-progress-bar-bg {
         width: 100%;
         height: 6px;
         background-color: #E0E0E0;
         border-radius: 3px;
         overflow: hidden;
       }

       .ai-progress-bar-fill {
         height: 100%;
         background-color: #5BB98A;
         transition: width 0.5s;
         border-radius: 3px;
       }
     }
  }

  // 行数计数器
  .row-counter-card {
     .header-row {
       display: flex; 
       justify-content: space-between; 
       margin-bottom: 12px; 
       
       .label { color: #666; font-size: 14px; }
       .sub-label { color: #999; font-size: 12px; }
     }
     
     .counter-controls {
       display: flex; 
       align-items: center; 
       justify-content: space-between; 
       gap: 16px; 
       
       .btn {
         width: 64px; 
         height: 64px; 
         border-radius: 50%; 
         display: flex; 
         align-items: center; 
         justify-content: center; 
         transition: transform 0.1s; 
         
         &:active { transform: scale(0.95); }
         
         &.minus { background-color: #FAF9F6; border: 2px solid #E0E0E0; }
         &.plus { background-color: #6C8EA4; box-shadow: 0 4px 10px rgba(108, 142, 164, 0.3); }
       }
       
       .display {
         flex: 1; 
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         
         .value { font-size: 48px; font-weight: 500; color: #6C8EA4; line-height: 1; }
         .unit { font-size: 12px; color: #999; margin-top: 4px; }
       }
     }
  }

  // 辅助工具
  .tools-card {
     .card-title {
       font-size: 16px; 
       font-weight: 500; 
       color: #3A3A3A; 
       margin-bottom: 12px; 
       display: block;
     }
     
     .tools-grid {
       display: grid; 
       grid-template-columns: 1fr 1fr; 
       gap: 12px; 
       
       .tool-item {
         background-color: #FAF9F6; 
         border: 1px solid #E0E0E0; 
         border-radius: 12px; 
         padding: 12px; 
         display: flex; 
         flex-direction: column; 
         align-items: center; 
         
         .tool-label { font-size: 12px; color: #999; margin-bottom: 8px; }
       }
     }
     
     // 针数计数 UI
     .stitch-counter {
        .control-row {
          display: flex; 
          align-items: center; 
          gap: 8px; 
          margin-bottom: 8px; 
          
          .mini-btn {
            width: 32px; height: 32px; border-radius: 16px; 
            background: #fff; border: 1px solid #E0E0E0; 
            display: flex; align-items: center; justify-content: center; 
            
            &.primary { background: #6C8EA4; border-color: #6C8EA4; }
            &:active { transform: scale(0.95); }
          }
          
          .value { font-size: 20px; font-weight: 500; color: #6C8EA4; min-width: 30px; text-align: center; }
        }
        
        .reset-btn {
          display: flex; align-items: center; gap: 4px; 
          font-size: 12px; color: #999; 
          padding: 4px 8px;
        }
     }
     
     // 计时器 UI
     .timer {
       .time-display { font-size: 18px; font-weight: 500; color: #6C8EA4; font-family: monospace; margin-bottom: 8px; }
       
       .timer-controls {
         display: flex; gap: 8px; width: 100%;
         
         .control-btn {
           flex: 1; height: 32px; border-radius: 8px; 
           display: flex; align-items: center; justify-content: center; gap: 4px; 
           color: #fff; font-size: 12px; 
           
           &.start { background-color: #5BB98A; }
           &.pause { background-color: #FF8C82; }
         }
         
         .reset-icon-btn {
           width: 32px; height: 32px; border-radius: 8px; 
           background: #fff; border: 1px solid #E0E0E0; 
           display: flex; align-items: center; justify-content: center;
         }
       }
     }
  }

  // 笔记卡片
  .notes-card {
     .card-header { margin-bottom: 12px; }
     
     .title-row {
       display: flex; align-items: center; gap: 8px; 
       .title { font-size: 16px; font-weight: 500; color: #3A3A3A; }
       .badge { background: #6C8EA4; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; }
     }
     
     .input-area {
       position: relative; margin-bottom: 16px; 
       
       .note-textarea {
         width: 100%; height: 80px; box-sizing: border-box; 
         border: 1px solid #E0E0E0; border-radius: 12px; 
         padding: 12px; padding-right: 48px; 
         font-size: 14px; color: #3A3A3A; 
       }
       
       .send-btn {
         position: absolute; right: 8px; bottom: 8px; 
         width: 36px; height: 36px; border-radius: 50%; 
         background-color: #6C8EA4; 
         display: flex; align-items: center; justify-content: center; 
         box-shadow: 0 2px 6px rgba(108, 142, 164, 0.3);
         transition: all 0.2s;
         
         &.disabled { background-color: #E0E0E0; box-shadow: none; pointer-events: none; }
       }
     }
     
     .notes-list {
       .note-item {
         background-color: #FAF9F6; border-radius: 12px; padding: 12px; 
         margin-bottom: 8px; border: 1px solid #E0E0E0; 
         
         .note-header {
           display: flex; justify-content: space-between; margin-bottom: 6px; 
           .time { font-size: 12px; color: #999; }
           .delete { 
             display: flex; align-items: center; gap: 4px; 
             font-size: 12px; color: #FF8C82; 
           }
         }
         
         .content { font-size: 14px; color: #3A3A3A; line-height: 1.4; }
       }
     }
     
     .empty-notes {
       padding: 24px 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; 
       text { color: #E0E0E0; font-size: 14px; }
     }
  }
   // New input styles
   .row-target-edit { display: flex; align-items: center; gap: 4px; }
   .mini-input {
     width: 40px; height: 20px; text-align: center; display: inline-block; min-height: 20px;
     font-size: 12px; color: #666; background: #F5F5F5;
     border-radius: 4px; border: 1px solid #E0E0E0;
   }
   
   .row-counter-input {
     font-size: 48px; font-weight: 500; color: #6C8EA4; line-height: 1;
     height: 56px; width: 120px; text-align: center;
     background: transparent; border: none;
   }
   
   .stitch-counter-input {
      font-size: 20px; font-weight: 500; color: #6C8EA4; min-width: 40px; text-align: center;
      background: transparent; border-bottom: 1px dashed #E0E0E0; height: 24px;
   }
}
</style>
