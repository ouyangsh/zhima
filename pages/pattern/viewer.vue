<template>
  <view class="pattern-viewer">
    <!-- 固定顶部 -->
    <view class="fixed-header">
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-bar">
        <view class="left" @click="goBack">
          <uni-icons type="back" size="24" color="#333"></uni-icons>
        </view>
        <text class="title">花样图解</text>
        <view class="right" :style="{ width: menuButtonWidth + 'px' }">
          <uni-icons type="more-filled" size="24" color="#333" @click="showMenu"></uni-icons>
        </view>
      </view>

      <!-- Tab 栏 (恢复到顶部) -->
      <view class="tab-bar">
        <view 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content" :style="{ marginTop: (statusBarHeight + 44 + 44) + 'px' }">
      
      <!-- 图解模式 -->
      <view v-show="activeTab === 'chart'" class="chart-panel">
        <!-- 2D/3D 切换 + 部件选择 -->
        <view class="chart-toolbar">
          <view class="part-selector" v-if="parsedData.parts.length > 1">
            <view 
              v-for="part in parsedData.parts" 
              :key="part.id"
              class="part-chip"
              :class="{ active: selectedPartId === part.id || selectedPartId === -1 }"
              @click="selectPart(part.id)"
            >
              <text>Part {{ part.id }}</text>
            </view>
          </view>
          
          <view class="mode-toggle">
            <view 
              class="toggle-btn" 
              :class="{ active: !is3DMode }" 
              @click="switch3DMode(false)"
            >
              <text>2D</text>
            </view>
            <view 
              class="toggle-btn" 
              :class="{ active: is3DMode }" 
              @click="switch3DMode(true)"
            >
              <text>3D</text>
            </view>
          </view>
        </view>

        <!-- 2D 图解 (使用 v-if 彻底移除 DOM) -->
        <view class="chart-container" v-if="!is3DMode">
          <canvas 
            canvas-id="patternChart" 
            id="patternChart"
            class="chart-canvas"
            :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"
          ></canvas>
        </view>

        <!-- 3D 图解 (使用 v-if) -->
        <view class="chart-container chart-3d" v-if="is3DMode">
          <!-- Canvas 只负责显示，移除交互监听，避免吞噬滚动事件 -->
          <canvas 
            type="webgl"
            id="webgl3d"
            class="chart-canvas"
            :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"
          ></canvas>

          <!-- 透明遮罩层：专门处理触摸事件，支持滚动穿透 -->
          <view 
            class="touch-overlay"
            :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"
            @touchstart="onWebGLTouchStart"
            @touchmove="onWebGLTouchMove"
            @touchend="onWebGLTouchEnd"
          ></view>

          <view class="rotate-hint" v-if="is3DMode && show3DHint">
            <text>👆 触摸旋转 · 双指缩放</text>
          </view>
        </view>

        <!-- 图例 -->
        <view class="chart-legend" v-if="legendItems.length > 0">
          <view class="legend-item" v-for="item in legendItems" :key="item.type">
            <view class="legend-dot" :style="{ backgroundColor: item.color }"></view>
            <text class="legend-text">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 文本编辑模式 -->
      <view v-show="activeTab === 'text'" class="text-panel">
        <view class="editor-toolbar">
          <text class="toolbar-label">花样文本</text>
          <view class="toolbar-actions">
            <view class="action-btn" @click="loadSample">示例</view>
            <view class="action-btn" @click="clearText">清空</view>
          </view>
        </view>
        <textarea class="pattern-editor" v-model="patternText" placeholder="在此输入钩针符号，例如: R1: 6X" placeholder-class="editor-placeholder" @input="onTextChange" maxlength="-1"></textarea>
         <view class="syntax-help">
          <view class="help-title">支持符号</view>
          <view class="help-grid">
            <view class="help-item" v-for="item in syntaxHelp" :key="item.symbol">
              <text class="symbol">{{ item.symbol }}</text>
              <text class="meaning">{{ item.meaning }}</text>
            </view>
          </view>
        </view>
      </view>

       <view v-show="activeTab === 'detail'" class="detail-panel">
        <view v-if="parsedData.title" class="pattern-title-section">
          <text class="pattern-title">{{ parsedData.title }}</text>
          <text v-if="parsedData.author" class="pattern-author">@{{ parsedData.author }}</text>
        </view>
        <view v-for="part in parsedData.parts" :key="part.id" class="part-section">
          <view class="part-header" @click="togglePart(part.id)">
            <text class="part-name">P{{ part.id }}: {{ part.name }}</text>
            <text class="part-info">({{ part.rows.length }}行 {{ getPartStitches(part) }}针)</text>
            <uni-icons :type="expandedParts.includes(part.id) ? 'up' : 'down'" size="16" color="#999"></uni-icons>
          </view>
          <view v-show="expandedParts.includes(part.id)">
            <view v-for="row in part.rows" :key="'P' + part.id + 'R' + row.rowNumber" class="row-card" @click="toggleRow(part.id, row.rowNumber)">
              <view class="row-header">
                <text class="row-type-tag" :class="row.type">{{ row.type === 'round' ? 'R' : 'H' }}{{ row.rowNumber }}</text>
                <text class="row-stitches">
                  {{ row.isRepeat ? row.repeatTimes + ' × (' : '' }}
                  <text v-for="(st, idx) in row.stitches.slice(0, 5)" :key="idx" :class="{ highlight: ['V','A','W','M'].includes(st.type) }">{{ st.type }} </text>
                  {{ row.stitches.length > 5 ? '...' : '' }}
                  {{ row.isRepeat ? ')' : '' }}
                </text>
                <text class="row-arrow">→</text>
                <text class="row-stitches result">{{ row.endStitches }}针</text>
              </view>
              <view v-show="expandedRows.includes('P' + part.id + 'R' + row.rowNumber)" class="row-detail">
                <view class="stitch-bar">
                  <text v-if="row.color" class="color-tag">{{ row.color }}</text>
                  <text v-if="row.modifier" class="modifier-badge">{{ row.modifierName }}</text>
                  <text class="stitch-desc">{{ row.description }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="parsedData.sewings && parsedData.sewings.length > 0" class="sewing-section">
          <view class="sewing-header">
            <uni-icons type="link" size="16" color="#5BB98A"></uni-icons>
            <text class="sewing-title">缝合说明</text>
          </view>
          <view v-for="(sew, idx) in parsedData.sewings" :key="idx" class="sewing-item">
            <text class="sewing-text">{{ sew.instruction }}</text>
          </view>
        </view>
         <view v-if="parsedData.parts.length === 0" class="empty-detail">
          <uni-icons type="compose" size="48" color="#CCC"></uni-icons>
          <text class="empty-text">请先在"文本"标签页输入花样指令</text>
        </view>
      </view>

      <view v-show="activeTab === 'ref'" class="ref-panel">
        <view class="ref-section" v-for="cat in stitchRef" :key="cat.category">
          <view class="ref-cat-header">
            <text class="ref-cat-title">{{ cat.category }}</text>
          </view>
          <view class="ref-items">
            <view class="ref-item" v-for="item in cat.items" :key="item.symbol">
              <text class="ref-symbol" :style="{ color: getSymbolColor(item.symbol) }">{{ item.symbol }}</text>
              <view class="ref-info">
                <text class="ref-cn">{{ item.cn }}</text>
                <text class="ref-en">{{ item.en }}</text>
              </view>
              <text class="ref-note">{{ item.note }}</text>
            </view>
          </view>
        </view>
         <view class="ref-section">
          <view class="ref-cat-header"><text class="ref-cat-title">语法规则</text></view>
          <view class="ref-items">
            <view class="ref-item" v-for="item in symbolSyntax" :key="item.syntax">
              <text class="ref-symbol syntax">{{ item.syntax }}</text>
              <view class="ref-info"><text class="ref-cn">{{ item.meaning }}</text><text class="ref-en">{{ item.example }}</text></view>
            </view>
          </view>
        </view>
        <view class="ref-section">
          <view class="ref-cat-header"><text class="ref-cat-title">钩针规格对照</text></view>
          <view class="hook-table">
            <view class="hook-row header"><text class="hook-cell">规格(mm)</text><text class="hook-cell">美标</text><text class="hook-cell">适用线材</text></view>
            <view class="hook-row" v-for="h in hookSizes" :key="h.mm">
              <text class="hook-cell">{{ h.mm }}</text>
              <text class="hook-cell">{{ h.us || h.steel || '-' }}</text>
              <text class="hook-cell yarn" :class="h.yarn">{{ h.yarn }}</text>
            </view>
          </view>
        </view>
        <view class="ref-credit"><text>数据来源: 毛线实验室 YarnLab</text></view>
      </view>
    </view>

    <!-- 底部统计栏 (恢复为 view) -->
    <view class="stats-bar" v-if="parsedData.parts.length > 0">
      <view class="stat-item">
        <text class="stat-value">{{ parsedData.stats.totalParts }}</text>
        <text class="stat-label">部件</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ parsedData.stats.totalRounds }}</text>
        <text class="stat-label">行</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ parsedData.stats.totalStitches }}</text>
        <text class="stat-label">针</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ parsedData.stats.estimatedWeightG }}</text>
        <text class="stat-label">g</text>
      </view>
    </view>
  </view>
</template>

<script>
import { parsePattern, getSamplePattern, getStitchColor, getStitchReference, getSymbolSyntax, getHookSizes } from '@/utils/pattern-parser.js';
import { Pattern3DRenderer } from '@/utils/pattern-3d-renderer.js';

export default {
  data() {
    return {
      statusBarHeight: 20,
      menuButtonWidth: 0,
      activeTab: 'text',
      patternText: '',
      parsedData: {
        title: '', author: '',
        parts: [], sewings: [],
        stats: { totalParts: 0, totalRounds: 0, totalStitches: 0, estimatedLengthCm: 0, estimatedWeightG: 0 }
      },
      expandedParts: [],
      expandedRows: [],
      selectedPartId: 0,
      canvasSize: 300,
      is3DMode: false,
      show3DHint: true,
      tabs: [
        { key: 'chart', label: '图解' },
        { key: 'text', label: '文本' },
        { key: 'detail', label: '详情' },
        { key: 'ref', label: '参考' },
      ],
      stitchRef: [],
      symbolSyntax: [],
      hookSizes: [],
      syntaxHelp: [
        { symbol: 'Pn:', meaning: '部件定义' },
        { symbol: 'Rn:', meaning: '环形行' },
        { symbol: 'Hn:', meaning: '平织行' },
        { symbol: 'X', meaning: '短针' },
        { symbol: 'T', meaning: '中长针' },
        { symbol: 'F', meaning: '长针' },
        { symbol: 'E', meaning: '长长针' },
        { symbol: 'V', meaning: '加针(2)' },
        { symbol: 'A', meaning: '减针(2)' },
        { symbol: 'W', meaning: '加针(3)' },
        { symbol: 'M', meaning: '减针(3)' },
        { symbol: 'CH', meaning: '锁针' },
        { symbol: 'SL', meaning: '引拔针' },
        { symbol: 'K', meaning: '跳过' },
        { symbol: 'TV/FV', meaning: '复合加针' },
        { symbol: 'NF/NX', meaning: '前柱针' },
        { symbol: 'Q/G', meaning: '枣形/爆米花' },
        { symbol: 'BLO()', meaning: '后半针' },
        { symbol: '环起', meaning: '环形起针' },
        { symbol: '6(X,V)', meaning: '重复6次' },
        { symbol: '[X,F]', meaning: '同针多针' },
        { symbol: '缝合:', meaning: '缝合指令' },
      ],
      legendItems: [],
    };
  },
  created() {
    this.renderer3d = null;
    this.webgl3dReady = false;
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    this.canvasSize = systemInfo.windowWidth - 60;
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    this.menuButtonWidth = (systemInfo.screenWidth - menuButtonInfo.left) + 10;
    // #endif
    this.stitchRef = getStitchReference();
    this.symbolSyntax = getSymbolSyntax();
    this.hookSizes = getHookSizes();
    this.loadSample();
  },
  methods: {
    goBack() { uni.navigateBack(); },
    switchTab(key) {
      this.activeTab = key;
      if (key === 'chart') {
        this.$nextTick(() => {
          if (this.is3DMode) {
             // 切换 Tab 回来时也要走带延迟的初始化逻辑
             this.init3DCanvas(); 
          } else { 
             setTimeout(() => this.drawChart(), 150); 
          }
        });
      }
    },
    selectPart(partId) {
      this.selectedPartId = partId;
      if (this.is3DMode) { this.render3D(); } else { this.drawChart(); }
    },
    switch3DMode(to3D) {
      if (this.is3DMode === to3D) return;
      this.is3DMode = to3D;
      if (to3D) {
        this.selectedPartId = -1;
        // 增加延迟，确保 v-if 渲染完成
        setTimeout(() => {
          this.init3DCanvas();
        }, 100);
        setTimeout(() => { this.show3DHint = false; }, 5000);
      } else {
        if (this.renderer3d) this.renderer3d.stopAutoRotate();
        const roundPart = this.parsedData.parts.find(p => p.rows.some(r => r.type === 'round'));
        this.selectedPartId = roundPart ? roundPart.id : (this.parsedData.parts[0]?.id || 0);
        this.$nextTick(() => setTimeout(() => this.drawChart(), 150));
      }
    },
    init3DCanvas(retryCount = 0) {
      // #ifdef MP-WEIXIN
      const query = wx.createSelectorQuery().in(this);
      query.select('#webgl3d').node().exec((res) => {
          if (!res || !res[0] || !res[0].node) { 
            console.error('[3D] 无法获取 WebGL Canvas, 重试:', retryCount);
            if (retryCount < 5) {
               setTimeout(() => this.init3DCanvas(retryCount + 1), 200);
            } else {
               uni.showToast({ title: '3D组件加载超时，请重试', icon: 'none' });
            }
            return; 
          }
          const canvas = res[0].node;
          this._setup3DRenderer(canvas);
        });
      // #endif
      // #ifndef MP-WEIXIN
      uni.showToast({ title: '3D 仅在微信小程序中可用', icon: 'none' });
      this.is3DMode = false;
      // #endif
    },
    _setup3DRenderer(canvas) {
      if (this.renderer3d) { this.renderer3d.dispose(); }
      this.renderer3d = new Pattern3DRenderer();
      this.renderer3d.init(canvas, this.canvasSize, this.canvasSize);
      this.webgl3dReady = true;
      this.render3D();
      this.renderer3d.startAutoRotate();
    },
    render3D() { 
      if (!this.renderer3d || !this.webgl3dReady) return; 
      this.renderer3d.generateModel(this.parsedData, this.selectedPartId); 
    },
    onWebGLTouchStart(e) { if (this.renderer3d) this.renderer3d.handleTouchStart(e); },
    onWebGLTouchMove(e) { if (this.renderer3d) this.renderer3d.handleTouchMove(e); },
    onWebGLTouchEnd(e) { if (this.renderer3d) this.renderer3d.handleTouchEnd(e); },
    getSymbolColor(symbol) {
      const s = symbol.split('/')[0].trim().replace('(...)', '');
      return getStitchColor(s) || '#5BB98A';
    },
    loadSample() { this.patternText = getSamplePattern(); this.parseAndUpdate(); },
    clearText() { this.patternText = ''; this.parseAndUpdate(); },
    onTextChange() { if (this._parseTimer) clearTimeout(this._parseTimer); this._parseTimer = setTimeout(() => this.parseAndUpdate(), 500); },
    parseAndUpdate() {
      this.parsedData = parsePattern(this.patternText);
      this.expandedParts = this.parsedData.parts.map(p => p.id);
      this.expandedRows = [];
      for (const part of this.parsedData.parts) {
        for (const row of part.rows) { this.expandedRows.push('P' + part.id + 'R' + row.rowNumber); }
      }
      const roundPart = this.parsedData.parts.find(p => p.rows.some(r => r.type === 'round'));
      this.selectedPartId = roundPart ? roundPart.id : (this.parsedData.parts[0]?.id || 0);
      this.updateLegend();
      if (this.activeTab === 'chart') {
        this.$nextTick(() => { 
           if (this.is3DMode) { 
              // 解析更新时也需要重新渲染 3D
              this.render3D(); 
           } else { 
              setTimeout(() => this.drawChart(), 150); 
           } 
        });
      }
    },
    togglePart(partId) { const idx = this.expandedParts.indexOf(partId); if (idx > -1) { this.expandedParts.splice(idx, 1); } else { this.expandedParts.push(partId); } },
    toggleRow(partId, rowNumber) { const key = 'P' + partId + 'R' + rowNumber; const idx = this.expandedRows.indexOf(key); if (idx > -1) { this.expandedRows.splice(idx, 1); } else { this.expandedRows.push(key); } },
    getPartStitches(part) { if (!part.rows.length) return 0; return part.rows[part.rows.length - 1].endStitches; },
    updateLegend() {
      const usedTypes = new Set();
      for (const part of this.parsedData.parts) { for (const row of part.rows) { for (const st of row.stitches) { usedTypes.add(st.type); } } }
      const LABELS = { 'X':'短针','V':'加针','A':'减针','W':'长针','T':'中长针','CH':'锁针','SL':'引拔针' };
      this.legendItems = Array.from(usedTypes).map(t => ({ type: t, label: LABELS[t] || t, color: getStitchColor(t), }));
    },
    drawChart() {
      const ctx = uni.createCanvasContext('patternChart', this);
      const size = this.canvasSize;
      const cx = size / 2;
      const cy = size / 2;
      ctx.clearRect(0, 0, size, size);
      const part = this.parsedData.parts.find(p => p.id === this.selectedPartId);
      if (!part || part.rows.length === 0) {
        ctx.setFontSize(14); ctx.setFillStyle('#999'); ctx.setTextAlign('center'); ctx.fillText('请输入花样文本', cx, cy); ctx.draw(); return;
      }
      const roundRows = part.rows.filter(r => r.type === 'round');
      const flatRows = part.rows.filter(r => r.type === 'flat');
      if (roundRows.length === 0 && flatRows.length === 0) {
        ctx.setFontSize(14); ctx.setFillStyle('#999'); ctx.setTextAlign('center'); ctx.fillText('无可绘制的行', cx, cy); ctx.draw(); return;
      }
      const totalDrawRows = roundRows.length + (flatRows.length > 0 ? 1 : 0);
      const maxRadius = Math.min(cx, cy) - 20;
      const ringWidth = Math.min(maxRadius / (totalDrawRows + 1), 22);
      const innerRadius = 12;
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.setFillStyle('#333'); ctx.fill();
      for (let i = 0; i < roundRows.length; i++) {
        const row = roundRows[i];
        const r = innerRadius + (i + 1) * ringWidth;
        const stitchCount = row.stitches.length || row.endStitches;
        if (stitchCount === 0) continue;
        const anglePerStitch = (Math.PI * 2) / stitchCount;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.setStrokeStyle('#E8E8E8'); ctx.setLineWidth(0.5); ctx.stroke();
        for (let j = 0; j < stitchCount; j++) {
          const stitch = row.stitches[j] || { type: 'X' };
          const angle = j * anglePerStitch - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const color = getStitchColor(stitch.type);
          const dotSize = Math.max(1.5, Math.min(ringWidth * 0.22, 4));
          if (i > 0) {
            const prevR = innerRadius + i * ringWidth;
            ctx.beginPath(); ctx.moveTo(cx + prevR * Math.cos(angle), cy + prevR * Math.sin(angle)); ctx.lineTo(x, y); ctx.setStrokeStyle(color); ctx.setLineWidth(0.4); ctx.setGlobalAlpha(0.25); ctx.stroke(); ctx.setGlobalAlpha(1);
          }
          ctx.beginPath(); ctx.arc(x, y, dotSize, 0, Math.PI * 2); ctx.setFillStyle(color); ctx.fill();
          if (stitch.type === 'V') {
            ctx.beginPath(); const ts = dotSize * 1.5; ctx.moveTo(x, y - ts); ctx.lineTo(x - ts * 0.7, y + ts * 0.5); ctx.lineTo(x + ts * 0.7, y + ts * 0.5); ctx.closePath(); ctx.setStrokeStyle(color); ctx.setLineWidth(0.8); ctx.stroke();
          }
        }
        ctx.setFontSize(7); ctx.setFillStyle('#AAA'); ctx.setTextAlign('center'); ctx.fillText('R' + row.rowNumber, cx, cy - r - 4);
      }
      if (flatRows.length > 0) {
        const barY = size - 30; const barWidth = size - 60;
        const totalFlatStitches = flatRows.reduce((s, r) => s + r.endStitches, 0);
        const stitchW = Math.min(barWidth / totalFlatStitches, 8);
        let offsetX = (size - totalFlatStitches * stitchW) / 2;
        ctx.setFontSize(8); ctx.setFillStyle('#AAA'); ctx.setTextAlign('left'); ctx.fillText('平织:', 10, barY - 8);
        for (const row of flatRows) {
          for (let j = 0; j < (row.stitches.length || row.endStitches); j++) {
            const st = row.stitches[j] || { type: 'CH' };
            const color = getStitchColor(st.type);
            ctx.beginPath(); ctx.rect(offsetX + j * stitchW, barY, stitchW - 1, 6); ctx.setFillStyle(color); ctx.fill();
          }
          offsetX += (row.stitches.length || row.endStitches) * stitchW;
        }
      }
      ctx.draw();
    },
    showMenu() {
      uni.showActionSheet({
        itemList: ['示例文本', '清空画布', '查看帮助'],
        success: (res) => {
          if (res.tapIndex === 0) this.loadSample();
          else if (res.tapIndex === 1) this.clearText();
          else if (res.tapIndex === 2) this.switchTab('ref');
        }
      });
    },
  },
  onUnload() { if (this.renderer3d) { this.renderer3d.dispose(); this.renderer3d = null; } }
};
</script>

<style lang="scss" scoped>
.pattern-viewer { min-height: 100vh; background: #F5F5F5; }
.fixed-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #FFFFFF; }
.nav-bar { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; background: #FFFFFF; .left { width: 44px; } .title { font-size: 17px; font-weight: 600; color: #333; } .right { flex-shrink: 0; } }
.tab-bar { position: relative; left: 0; right: 0; z-index: 99; display: flex; background: #FFFFFF; border-bottom: 1px solid #F0F0F0; padding: 0 20px; .tab-item { flex: 1; text-align: center; padding: 10px 0; font-size: 14px; color: #999; position: relative; transition: all 0.2s; &.active { color: #5BB98A; font-weight: 600; &::after { content: ''; position: absolute; bottom: 0; left: 30%; right: 30%; height: 3px; background: #5BB98A; border-radius: 2px; } } } }
.main-content { padding-bottom: 80px; }
.chart-panel { padding: 16px; padding-bottom: 120px; .chart-toolbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; } .part-selector { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; .part-chip { padding: 6px 14px; background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 20px; font-size: 12px; color: #666; transition: all 0.2s; &.active { background: #5BB98A; border-color: #5BB98A; color: #fff; } } } .mode-toggle { display: flex; background: #F0F0F0; border-radius: 16px; padding: 2px; flex-shrink: 0; .toggle-btn { padding: 4px 14px; border-radius: 14px; font-size: 12px; font-weight: 600; color: #999; transition: all 0.25s; &.active { background: #5BB98A; color: #fff; box-shadow: 0 2px 6px rgba(91, 185, 138, 0.3); } } } .chart-container { background: #FFFFFF; border-radius: 16px; padding: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative; } .chart-3d { background: linear-gradient(135deg, #FAF9F6 0%, #F0EDE8 100%); } .rotate-hint { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 11px; pointer-events: none; animation: fadeHint 5s ease-out forwards; } @keyframes fadeHint { 0%, 70% { opacity: 1; } 100% { opacity: 0; } } .chart-canvas { display: block; } .touch-overlay { position: absolute; top: 0; left: 0; z-index: 10; } .chart-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding: 10px 16px; background: #FFFFFF; border-radius: 12px; .legend-item { display: flex; align-items: center; gap: 5px; } .legend-dot { width: 10px; height: 10px; border-radius: 50%; } .legend-text { font-size: 12px; color: #666; } } }
.text-panel { padding: 16px; padding-bottom: 100px; .editor-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; .toolbar-label { font-size: 14px; font-weight: 600; color: #333; } .toolbar-actions { display: flex; gap: 8px; } .action-btn { padding: 4px 12px; background: #F0F0F0; border-radius: 8px; font-size: 12px; color: #666; &:active { background: #E0E0E0; } } } .pattern-editor { width: 100%; min-height: 250px; background: #FFFFFF; border-radius: 12px; padding: 16px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.8; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.04); } .editor-placeholder { color: #CCC; font-size: 13px; } .syntax-help { margin-top: 16px; background: #FFFFFF; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); .help-title { font-size: 13px; font-weight: 600; color: #666; margin-bottom: 10px; } .help-grid { display: flex; flex-wrap: wrap; gap: 8px; } .help-item { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: #F8F8F8; border-radius: 6px; } .symbol { font-family: 'Courier New', monospace; font-weight: 700; color: #E74C3C; font-size: 13px; } .meaning { font-size: 12px; color: #666; } } }
.detail-panel { padding: 16px; padding-bottom: 100px; .pattern-title-section { background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); .pattern-title { font-size: 18px; font-weight: 700; color: #333; display: block; } .pattern-author { font-size: 13px; color: #999; margin-top: 4px; display: block; } } .part-section { margin-bottom: 12px; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); } .part-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid #F0F0F0; .part-name { font-size: 15px; font-weight: 700; color: #333; } .part-info { font-size: 13px; color: #999; flex: 1; } } .row-card { padding: 10px 16px; border-bottom: 1px solid #F8F8F8; &:last-child { border-bottom: none; } .row-header { display: flex; align-items: center; gap: 6px; } .row-type-tag { font-size: 12px; font-weight: 700; padding: 2px 6px; border-radius: 4px; min-width: 32px; text-align: center; &.round { background: #EBF5FF; color: #4A90D9; } &.flat { background: #FFF3E0; color: #F0A500; } } .row-stitches { font-size: 13px; color: #666; &.highlight { color: #E74C3C; font-weight: 600; } &.result { font-weight: 600; color: #333; } } .row-arrow { font-size: 12px; color: #CCC; } .color-badge { font-size: 11px; padding: 1px 6px; background: #FFF8E1; color: #F57F17; border-radius: 4px; font-weight: 500; } .row-detail { margin-top: 8px; .stitch-bar { background: #F8F8F8; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: center; gap: 6px; } .color-tag { background: #FFF8E1; color: #F57F17; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; } .modifier-badge { background: #FFE0B2; color: #E65100; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; } .stitch-desc { font-size: 13px; color: #555; } } } .sewing-section { background: #FFFFFF; border-radius: 12px; padding: 14px 16px; margin-top: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); .sewing-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; } .sewing-title { font-size: 14px; font-weight: 600; color: #5BB98A; } .sewing-item { padding: 6px 0; border-bottom: 1px solid #F8F8F8; &:last-child { border-bottom: none; } } .sewing-text { font-family: 'Courier New', monospace; font-size: 13px; color: #555; } } .empty-detail { display: flex; flex-direction: column; align-items: center; padding: 80px 0; .empty-text { margin-top: 12px; font-size: 14px; color: #999; } } }
.ref-panel { padding: 16px; padding-bottom: 100px; .ref-section { background: #FFFFFF; border-radius: 12px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); } .ref-cat-header { padding: 12px 16px 8px; border-bottom: 1px solid #F0F0F0; } .ref-cat-title { font-size: 15px; font-weight: 700; color: #333; } .ref-items { padding: 4px 0; } .ref-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid #FAFAFA; &:last-child { border-bottom: none; } } .ref-symbol { font-family: 'Courier New', monospace; font-size: 14px; font-weight: 700; min-width: 72px; flex-shrink: 0; &.syntax { font-size: 12px; color: #5BB98A; min-width: 100px; } } .ref-info { display: flex; flex-direction: column; flex: 1; min-width: 0; } .ref-cn { font-size: 13px; color: #333; font-weight: 600; } .ref-en { font-size: 11px; color: #999; margin-top: 1px; } .ref-note { font-size: 11px; color: #AAA; flex-shrink: 0; max-width: 100px; text-align: right; } .hook-table { padding: 0 12px 8px; } .hook-row { display: flex; padding: 6px 4px; border-bottom: 1px solid #F8F8F8; &:last-child { border-bottom: none; } &.header { border-bottom: 1px solid #E8E8E8; .hook-cell { font-weight: 700; color: #333; font-size: 12px; } } } .hook-cell { flex: 1; font-size: 12px; color: #666; text-align: center; &.yarn { font-size: 11px; padding: 1px 6px; border-radius: 4px; } } .ref-credit { text-align: center; padding: 12px 0 20px; font-size: 11px; color: #CCC; } }
.stats-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-around; background: #FFFFFF; padding: 12px 20px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); box-shadow: 0 -2px 8px rgba(0,0,0,0.06); z-index: 100; .stat-item { display: flex; align-items: baseline; gap: 4px; } .stat-value { font-size: 18px; font-weight: 700; color: #5BB98A; } .stat-label { font-size: 12px; color: #999; } .stat-divider { width: 1px; height: 20px; background: #E0E0E0; } }
</style>
