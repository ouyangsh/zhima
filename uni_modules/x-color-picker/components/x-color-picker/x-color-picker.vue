<template>
    <view class="x-color-picker" :class="{ 'color-picker--dark': darkMode }" :style="containerStyle">
        <!-- 预设颜色 -->
        <view class="preset-colors" v-if="showPresets">
            <view class="preset-title">常用颜色</view>
            <view class="preset-grid">
                <view v-for="(color, index) in presetColors" :key="index" class="preset-item" :style="[{ backgroundColor: color }]" @click="selectPresetColor(color)">
                    <view v-if="color === currentHex" class="preset-selected">✓</view>
                </view>
            </view>
        </view>

        <!-- 历史颜色 -->
        <view class="history-colors" v-if="colorHistory.length > 0">
            <view class="history-title">
                <text>最近使用</text>
                <text @click="clearColorHistory">清除</text>
            </view>
            <view class="history-grid">
                <view v-for="(color, index) in colorHistory" :key="index" class="history-item" :style="[{ backgroundColor: color }]" @click="selectPresetColor(color)">
                    <view v-if="color === currentHex" class="history-selected">✓</view>
                </view>
            </view>
        </view>

        <!-- 主色彩选择区域 -->
        <view class="color-main">
            <!-- 饱和度/亮度面板 -->
            <view class="saturation-panel" :style="[panelStyle, { backgroundColor: pureColor }]" @touchstart="onSaturationTouchStart" @touchmove="onSaturationTouchMove" @touchend="onTouchEnd"
                ref="saturationPanel">
                <!-- 白色渐变 -->
                <view class="saturation-white"></view>
                <!-- 黑色渐变 -->
                <view class="saturation-black"></view>
                <!-- 选择器指示点 -->
                <view class="saturation-cursor" :style="[cursorStyle, { left: saturationPosition.x + 'px', top: saturationPosition.y + 'px' }]"></view>
            </view>

            <!-- 色相滑条 -->
            <view class="hue-slider" :style="sliderStyle" @touchstart="onHueTouchStart" @touchmove="onHueTouchMove" @touchend="onTouchEnd">
                <view class="hue-track"></view>
                <view class="hue-cursor" :style="[{ left: huePosition + 'px' }]"></view>
            </view>

            <!-- 透明度滑条 -->
            <view v-if="showAlpha" class="alpha-slider" :style="sliderStyle" @touchstart="onAlphaTouchStart" @touchmove="onAlphaTouchMove" @touchend="onTouchEnd">
                <view class="alpha-checkerboard"></view>
                <view class="alpha-bg" :style="[{ background: alphaGradient }]"></view>
                <view class="alpha-cursor" :style="[{ left: alphaPosition + 'px' }]"></view>
            </view>
        </view>

        <!-- 颜色预览和信息 -->
        <view class="color-info">
            <!-- 颜色预览 -->
            <view class="color-preview">
                <view class="preview-current" :style="[{ backgroundColor: currentColorRgba }]">
                    <view class="preview-checkerboard"></view>
                </view>
                <view class="preview-old" :style="[{ backgroundColor: initialColor }]"></view>
            </view>

            <!-- 颜色值输入 -->
            <view class="color-inputs">
                <view class="input-tabs">
                    <text v-for="tab in inputTabs" :key="tab.key" class="input-tab" :class="{ active: activeInputTab === tab.key }" @click="activeInputTab = tab.key">
                        {{ tab.label }}
                    </text>
                </view>

                <!-- HEX 输入 -->
                <view v-if="activeInputTab === 'hex'" class="input-group">
                    <input class="color-input hex-input" v-model="hexInput" @input="onHexInput" @blur="validateHexInput" maxlength="7" placeholder="#000000" />
                </view>

                <!-- RGB 输入 -->
                <view v-if="activeInputTab === 'rgb'" class="input-row">
                    <view class="input-group">
                        <text class="input-label">R</text>
                        <input class="color-input" type="number" v-model.number="rgbInput.r" @input="onRgbInput" min="0" max="255" />
                    </view>
                    <view class="input-group">
                        <text class="input-label">G</text>
                        <input class="color-input" type="number" v-model.number="rgbInput.g" @input="onRgbInput" min="0" max="255" />
                    </view>
                    <view class="input-group">
                        <text class="input-label">B</text>
                        <input class="color-input" type="number" v-model.number="rgbInput.b" @input="onRgbInput" min="0" max="255" />
                    </view>
                    <view v-if="showAlpha" class="input-group">
                        <text class="input-label">A</text>
                        <input class="color-input" type="number" v-model.number="alphaInput" @input="onAlphaInputChange" min="0" max="100" />
                    </view>
                </view>

                <!-- HSL 输入 -->
                <view v-if="activeInputTab === 'hsl'" class="input-row">
                    <view class="input-group">
                        <text class="input-label">H</text>
                        <input class="color-input" type="number" v-model.number="hslInput.h" @input="onHslInput" min="0" max="360" />
                    </view>
                    <view class="input-group">
                        <text class="input-label">S</text>
                        <input class="color-input" type="number" v-model.number="hslInput.s" @input="onHslInput" min="0" max="100" />
                    </view>
                    <view class="input-group">
                        <text class="input-label">L</text>
                        <input class="color-input" type="number" v-model.number="hslInput.l" @input="onHslInput" min="0" max="100" />
                    </view>
                </view>
            </view>
        </view>

        <!-- 操作按钮 -->
        <view class="color-actions">
            <button class="action-btn cancel-btn" @click="onCancel">
                {{ cancelText }}
            </button>
            <button class="action-btn confirm-btn" @click="onConfirm">
                {{ confirmText }}
            </button>
        </view>
    </view>
</template>

<script>
    const PRESET_COLORS = [
        '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80',
        '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
        '#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF', '#FF8080',
        '#FFB366', '#FFFF80', '#B3FF80', '#80FF80', '#80FFB3', '#80FFFF',
        '#80B3FF', '#8080FF', '#B380FF', '#FF80FF', '#FF80B3'
    ];

    const DEFAULT_OPTIONS = {
        width: uni.upx2px(630),
        padding: uni.upx2px(32),
        throttleDelay: 16,
        cursorSize: uni.upx2px(36),
        maxHistory: 8
    }


    export default {
        name: 'x-color-picker',
        props: {
            modelValue: {
                type: String,
                default: '#1B73CC'
            },
            showAlpha: {
                type: Boolean,
                default: true
            },
            showPresets: {
                type: Boolean,
                default: true
            },
            darkMode: {
                type: Boolean,
                default: false
            },
            saveHistory: {
                type: Boolean,
                default: true
            },
            cancelText: {
                type: String,
                default: '取消'
            },
            confirmText: {
                type: String,
                default: '确定'
            },
            options: {
                type: Object,
                default: () => DEFAULT_OPTIONS
            }
        },
        emits: ['update:modelValue', 'cancel', 'confirm', 'change'],
        data() {
            return {
                // 内部状态
                internalHsv: { h: 0, s: 100, v: 100 },
                internalRgb: { r: 255, g: 0, b: 0 },
                internalAlpha: 100,

                // 输入框状态
                hexInput: '#FF0000',
                rgbInput: { r: 255, g: 0, b: 0 },
                hslInput: { h: 0, s: 100, l: 50 },
                alphaInput: 100,

                // UI 状态
                activeInputTab: 'hex',
                initialColor: '#FF0000',
                colorHistory: [],

                // 位置信息
                saturationPosition: { x: 0, y: 0 },
                huePosition: 0,
                alphaPosition: 0,

                // 触摸状态
                isDragging: false,
                dragType: '',
                lastTouchTime: 0,

                // 缓存的DOM查询结果
                panelRect: null,
                hueRect: null,
                alphaRect: null
            }
        },
        computed: {
            // 合并配置选项
            mergedOptions() {
                return { ...DEFAULT_OPTIONS, ...this.options };
            },

            // 计算面板尺寸（内容区域宽度减去内边距）
            computedPanelSize() {
                const contentWidth = this.mergedOptions.width - (this.mergedOptions.padding * 2);
                return {
                    width: contentWidth,
                    height: contentWidth * 0.714 // 保持 560:400 的宽高比
                };
            },

            // 计算滑条宽度
            computedSliderWidth() {
                return this.mergedOptions.width - (this.mergedOptions.padding * 2);
            },

            // 容器样式
            containerStyle() {
                return {
                    width: this.mergedOptions.width + 'px',
                    padding: this.mergedOptions.padding + 'px'
                };
            },

            // 面板样式
            panelStyle() {
                return {
                    width: this.computedPanelSize.width + 'px',
                    height: this.computedPanelSize.height + 'px'
                };
            },

            // 指示点样式
            cursorStyle() {
                return {
                    width: this.mergedOptions.cursorSize + 'px',
                    height: this.mergedOptions.cursorSize + 'px'
                };
            },

            // 滑条样式
            sliderStyle() {
                return {
                    width: this.computedSliderWidth + 'px'
                };
            },

            // 预设颜色
            presetColors() {
                return PRESET_COLORS;
            },

            // 输入标签页
            inputTabs() {
                return [
                    { key: 'hex', label: 'HEX' },
                    { key: 'rgb', label: 'RGB' },
                    { key: 'hsl', label: 'HSL' }
                ];
            },

            // 当前HEX颜色
            currentHex() {
                return this.rgbToHex(this.internalRgb.r, this.internalRgb.g, this.internalRgb.b);
            },

            // 纯色（用于饱和度面板背景）
            pureColor() {
                return this.hsvToRgbString(this.internalHsv.h, 100, 100);
            },

            // 当前颜色的RGBA值
            currentColorRgba() {
                const { r, g, b } = this.internalRgb;
                const alpha = this.internalAlpha / 100;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            },

            // 透明度渐变背景
            alphaGradient() {
                const { r, g, b } = this.internalRgb;
                return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1))`;
            }
        },
        watch: {
            modelValue: {
                handler(newVal) {
                    this.initialColor = newVal;
                    this.setColor(newVal);
                },
                immediate: true
            },
            // 监听配置变化，重新计算位置
            'mergedOptions.width': {
                handler() {
                    this.$nextTick(() => {
                        this.updateAllPositions();
                    });
                }
            }
        },
        mounted() {
            this.loadColorHistory();
        },
        methods: {
            // ========== 颜色设置 ==========
            setColor(color) {
                const rgb = this.hexToRgb(color);
                const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
                const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

                this.internalRgb = rgb;
                this.internalHsv = hsv;

                // 更新输入框
                this.hexInput = color;
                this.rgbInput = { ...rgb };
                this.hslInput = hsl;

                this.updateAllPositions();
            },

            // 更新所有位置
            updateAllPositions() {
                const { h, s, v } = this.internalHsv;

                // 色相位置
                this.huePosition = (h / 360) * this.computedSliderWidth;

                // 饱和度/亮度位置
                this.saturationPosition.x = (s / 100) * this.computedPanelSize.width;
                this.saturationPosition.y = ((100 - v) / 100) * this.computedPanelSize.height;

                // 透明度位置
                this.alphaPosition = (this.internalAlpha / 100) * this.computedSliderWidth;
            },

            // ========== 预设颜色相关 ==========
            selectPresetColor(color) {
                this.setColor(color);
                this.emitChange();
            },

            // 加载颜色历史
            loadColorHistory() {
                if (this.saveHistory) {
                    this.colorHistory = uni.getStorageSync('colorPickerHistory') || [];
                }
            },

            // 清除颜色历史
            clearColorHistory() {
                this.colorHistory = []
                uni.removeStorageSync('colorPickerHistory')
            },

            // 保存颜色历史
            saveColorHistory() {
                const color = this.currentHex;
                let history = [...this.colorHistory];

                // 移除已存在的相同颜色
                history = history.filter(c => c !== color);

                // 添加到开头
                history.unshift(color);

                // 限制历史记录数量
                if (history.length > this.mergedOptions.maxHistory) {
                    history = history.slice(0, this.mergedOptions.maxHistory);
                }

                if (this.saveHistory) {
                    this.colorHistory = history;
                    uni.setStorageSync('colorPickerHistory', history);
                }
            },

            // ========== 触摸事件处理 ==========
            onSaturationTouchStart(e) {
                this.startDragging('saturation', e);
                this.updateSaturationFromTouch(e);
            },

            onSaturationTouchMove(e) {
                if (this.isDragging && this.dragType === 'saturation') {
                    this.throttledUpdateSaturation(e);
                }
            },

            onHueTouchStart(e) {
                this.startDragging('hue', e);
                this.updateHueFromTouch(e);
            },

            onHueTouchMove(e) {
                if (this.isDragging && this.dragType === 'hue') {
                    this.throttledUpdateHue(e);
                }
            },

            onAlphaTouchStart(e) {
                this.startDragging('alpha', e);
                this.updateAlphaFromTouch(e);
            },

            onAlphaTouchMove(e) {
                if (this.isDragging && this.dragType === 'alpha') {
                    this.throttledUpdateAlpha(e);
                }
            },

            onTouchEnd() {
                this.isDragging = false;
                this.dragType = '';
                this.clearRectCache();
            },

            // 开始拖拽
            startDragging(type, e) {
                this.isDragging = true;
                this.dragType = type;
            },

            // ========== 节流更新函数 ==========
            throttledUpdateSaturation(e) {
                return this.throttle(() => this.updateSaturationFromTouch(e), this.mergedOptions.throttleDelay);
            },

            throttledUpdateHue(e) {
                return this.throttle(() => this.updateHueFromTouch(e), this.mergedOptions.throttleDelay);
            },

            throttledUpdateAlpha(e) {
                return this.throttle(() => this.updateAlphaFromTouch(e), this.mergedOptions.throttleDelay);
            },

            // 节流函数
            throttle(func, delay) {
                const now = Date.now();
                if (now - this.lastTouchTime >= delay) {
                    this.lastTouchTime = now;
                    return func();
                }
            },

            // ========== 位置更新函数 ==========
            updateSaturationFromTouch(e) {
                const touch = e.touches[0] || e.changedTouches[0];

                if (this.panelRect) {
                    this.updateSaturationPosition(touch, this.panelRect);
                } else {
                    this.queryRect('.saturation-panel', (rect) => {
                        this.panelRect = rect;
                        this.updateSaturationPosition(touch, rect);
                    });
                }
            },

            updateSaturationPosition(touch, rect) {
                const x = Math.max(0, Math.min(touch.clientX - rect.left, this.computedPanelSize.width));
                const y = Math.max(0, Math.min(touch.clientY - rect.top, this.computedPanelSize.height));

                this.saturationPosition.x = x;
                this.saturationPosition.y = y;

                const s = (x / this.computedPanelSize.width) * 100;
                const v = ((this.computedPanelSize.height - y) / this.computedPanelSize.height) * 100;

                this.internalHsv.s = Math.round(s);
                this.internalHsv.v = Math.round(v);

                this.updateColorFromHsv();
            },

            updateHueFromTouch(e) {
                const touch = e.touches[0] || e.changedTouches[0];

                if (this.hueRect) {
                    this.updateHuePosition(touch, this.hueRect);
                } else {
                    this.queryRect('.hue-slider', (rect) => {
                        this.hueRect = rect;
                        this.updateHuePosition(touch, rect);
                    });
                }
            },

            updateHuePosition(touch, rect) {
                const x = Math.max(0, Math.min(touch.clientX - rect.left, this.computedSliderWidth));
                this.huePosition = x;

                const h = (x / this.computedSliderWidth) * 360;
                this.internalHsv.h = Math.round(h);

                this.updateColorFromHsv();
            },

            updateAlphaFromTouch(e) {
                const touch = e.touches[0] || e.changedTouches[0];

                if (this.alphaRect) {
                    this.updateAlphaPosition(touch, this.alphaRect);
                } else {
                    this.queryRect('.alpha-slider', (rect) => {
                        this.alphaRect = rect;
                        this.updateAlphaPosition(touch, rect);
                    });
                }
            },

            updateAlphaPosition(touch, rect) {
                const x = Math.max(0, Math.min(touch.clientX - rect.left, this.computedSliderWidth));
                this.alphaPosition = x;

                const alpha = (x / this.computedSliderWidth) * 100;
                this.internalAlpha = Math.round(alpha);
                this.alphaInput = this.internalAlpha;
            },

            // DOM查询封装
            queryRect(selector, callback) {
                uni.createSelectorQuery().in(this).select(selector).boundingClientRect(callback).exec();
            },

            // 清除DOM查询缓存
            clearRectCache() {
                this.panelRect = null;
                this.hueRect = null;
                this.alphaRect = null;
            },

            // ========== 颜色更新 ==========
            updateColorFromHsv() {
                const { h, s, v } = this.internalHsv;
                this.internalRgb = this.hsvToRgb(h, s, v);

                // 更新输入框
                this.hexInput = this.currentHex;
                this.rgbInput = { ...this.internalRgb };
                this.hslInput = this.rgbToHsl(this.internalRgb.r, this.internalRgb.g, this.internalRgb.b);

                this.emitChange();
            },

            // ========== 输入事件处理 ==========
            onHexInput() {
                if (this.isValidHex(this.hexInput)) {
                    const rgb = this.hexToRgb(this.hexInput);
                    const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);

                    this.internalRgb = rgb;
                    this.internalHsv = hsv;
                    this.rgbInput = { ...rgb };
                    this.hslInput = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

                    this.updateAllPositions();
                    this.emitChange();
                }
            },

            validateHexInput() {
                if (!this.isValidHex(this.hexInput)) {
                    this.hexInput = this.currentHex;
                }
            },

            onRgbInput() {
                // 验证和限制输入值
                this.rgbInput.r = this.clamp(this.rgbInput.r || 0, 0, 255);
                this.rgbInput.g = this.clamp(this.rgbInput.g || 0, 0, 255);
                this.rgbInput.b = this.clamp(this.rgbInput.b || 0, 0, 255);

                this.internalRgb = { ...this.rgbInput };
                this.internalHsv = this.rgbToHsv(this.internalRgb.r, this.internalRgb.g, this.internalRgb.b);

                this.hexInput = this.currentHex;
                this.hslInput = this.rgbToHsl(this.internalRgb.r, this.internalRgb.g, this.internalRgb.b);

                this.updateAllPositions();
                this.emitChange();
            },

            onHslInput() {
                // 验证和限制输入值
                this.hslInput.h = this.clamp(this.hslInput.h || 0, 0, 360);
                this.hslInput.s = this.clamp(this.hslInput.s || 0, 0, 100);
                this.hslInput.l = this.clamp(this.hslInput.l || 0, 0, 100);

                const rgb = this.hslToRgb(this.hslInput.h, this.hslInput.s, this.hslInput.l);
                this.internalRgb = rgb;
                this.internalHsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);

                this.hexInput = this.currentHex;
                this.rgbInput = { ...rgb };

                this.updateAllPositions();
                this.emitChange();
            },

            onAlphaInputChange() {
                this.alphaInput = this.clamp(this.alphaInput || 0, 0, 100);
                this.internalAlpha = this.alphaInput;
                this.alphaPosition = (this.internalAlpha / 100) * this.computedSliderWidth;
                this.emitChange();
            },

            // ========== 工具函数 ==========
            clamp(value, min, max) {
                return Math.max(min, Math.min(max, parseInt(value) || 0));
            },

            // 发出变化事件
            emitChange() {
                const color = {
                    hex: this.currentHex,
                    rgb: this.internalRgb,
                    hsv: this.internalHsv,
                    hsl: this.hslInput,
                    alpha: this.internalAlpha,
                    rgba: this.currentColorRgba
                };
                this.$emit('change', color);
            },

            // ========== 颜色转换函数 ==========
            hsvToRgb(h, s, v) {
                h = h / 360;
                s = s / 100;
                v = v / 100;

                const i = Math.floor(h * 6);
                const f = h * 6 - i;
                const p = v * (1 - s);
                const q = v * (1 - f * s);
                const t = v * (1 - (1 - f) * s);

                let r, g, b;
                switch (i % 6) {
                    case 0:
                        r = v;
                        g = t;
                        b = p;
                        break;
                    case 1:
                        r = q;
                        g = v;
                        b = p;
                        break;
                    case 2:
                        r = p;
                        g = v;
                        b = t;
                        break;
                    case 3:
                        r = p;
                        g = q;
                        b = v;
                        break;
                    case 4:
                        r = t;
                        g = p;
                        b = v;
                        break;
                    case 5:
                        r = v;
                        g = p;
                        b = q;
                        break;
                }

                return {
                    r: Math.round(r * 255),
                    g: Math.round(g * 255),
                    b: Math.round(b * 255)
                };
            },

            hsvToRgbString(h, s, v) {
                const rgb = this.hsvToRgb(h, s, v);
                return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            },

            rgbToHsv(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const diff = max - min;

                let h = 0;
                const s = max === 0 ? 0 : diff / max;
                const v = max;

                if (diff !== 0) {
                    if (max === r) {
                        h = ((g - b) / diff) % 6;
                    } else if (max === g) {
                        h = (b - r) / diff + 2;
                    } else {
                        h = (r - g) / diff + 4;
                    }
                }

                return {
                    h: Math.round((h < 0 ? h + 6 : h) * 60),
                    s: Math.round(s * 100),
                    v: Math.round(v * 100)
                };
            },

            rgbToHsl(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const diff = max - min;
                const sum = max + min;

                let h = 0;
                let s = 0;
                const l = sum / 2;

                if (diff !== 0) {
                    s = l > 0.5 ? diff / (2 - sum) : diff / sum;

                    if (max === r) {
                        h = ((g - b) / diff) + (g < b ? 6 : 0);
                    } else if (max === g) {
                        h = (b - r) / diff + 2;
                    } else {
                        h = (r - g) / diff + 4;
                    }
                    h /= 6;
                }

                return {
                    h: Math.round(h * 360),
                    s: Math.round(s * 100),
                    l: Math.round(l * 100)
                };
            },

            hslToRgb(h, s, l) {
                h /= 360;
                s /= 100;
                l /= 100;

                const c = (1 - Math.abs(2 * l - 1)) * s;
                const x = c * (1 - Math.abs((h * 6) % 2 - 1));
                const m = l - c / 2;

                let r, g, b;

                if (0 <= h && h < 1 / 6) {
                    r = c;
                    g = x;
                    b = 0;
                } else if (1 / 6 <= h && h < 2 / 6) {
                    r = x;
                    g = c;
                    b = 0;
                } else if (2 / 6 <= h && h < 3 / 6) {
                    r = 0;
                    g = c;
                    b = x;
                } else if (3 / 6 <= h && h < 4 / 6) {
                    r = 0;
                    g = x;
                    b = c;
                } else if (4 / 6 <= h && h < 5 / 6) {
                    r = x;
                    g = 0;
                    b = c;
                } else {
                    r = c;
                    g = 0;
                    b = x;
                }

                return {
                    r: Math.round((r + m) * 255),
                    g: Math.round((g + m) * 255),
                    b: Math.round((b + m) * 255)
                };
            },

            rgbToHex(r, g, b) {
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('').toUpperCase();
            },

            hexToRgb(hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 255, g: 0, b: 0 };
            },

            isValidHex(hex) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
            },

            // ========== 按钮事件 ==========
            onCancel() {
                this.setColor(this.initialColor);
                this.$emit('cancel');
            },

            onConfirm() {
                this.saveColorHistory();
                const color = {
                    hex: this.currentHex,
                    rgb: this.internalRgb,
                    hsv: this.internalHsv,
                    hsl: this.hslInput,
                    alpha: this.internalAlpha,
                    rgba: this.currentColorRgba
                };
                this.$emit('confirm', color);
                this.$emit('update:modelValue', this.currentHex);
            }
        }
    }
</script>

<style scoped>
    .x-color-picker {
        background: #ffffff;
        border-radius: 24rpx;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
        margin: 0 auto;
        box-sizing: border-box;
    }

    .color-picker--dark {
        background: #1a1a1a;
        color: #ffffff;
    }

    /* ========== 预设颜色 ========== */
    .preset-colors,
    .history-colors {
        margin-bottom: 40rpx;
    }

    .preset-title,
    .history-title {
        font-size: 28rpx;
        color: #666666;
        margin-bottom: 16rpx;
        font-weight: 500;
    }

    .history-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .history-title text:last-child {
        color: #ff0000;
        font-size: 26rpx;
    }

    .color-picker--dark .preset-title,
    .color-picker--dark .history-title {
        color: #cccccc;
    }

    .preset-grid,
    .history-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;
    }

    .preset-item,
    .history-item {
        width: 56rpx;
        height: 56rpx;
        border-radius: 12rpx;
        border: 3rpx solid #ffffff;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .preset-item:active,
    .history-item:active {
        transform: scale(0.95);
    }

    .preset-selected,
    .history-selected {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: bold;
        text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.5);
    }

    /* ========== 主色彩选择区域 ========== */
    .color-main {
        margin-bottom: 40rpx;
    }

    .saturation-panel {
        position: relative;
        border-radius: 16rpx;
        overflow: hidden;
        margin-bottom: 32rpx;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
        cursor: crosshair;
    }

    .saturation-white {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right, #ffffff, transparent);
    }

    .saturation-black {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, transparent, #000000);
    }

    .saturation-cursor {
        position: absolute;
        border: 4rpx solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 12rpx rgba(0, 0, 0, 0.4), inset 0 0 4rpx rgba(0, 0, 0, 0.2);
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: transform 0.1s ease;
    }

    .saturation-cursor:active {
        transform: translate(-50%, -50%) scale(1.2);
    }

    /* ========== 滑条样式 ========== */
    .hue-slider,
    .alpha-slider {
        height: 48rpx;
        position: relative;
        border-radius: 24rpx;
        margin-bottom: 24rpx;
        cursor: pointer;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    }

    .hue-track {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right,
                #ff0000 0%,
                #ffff00 16.66%,
                #00ff00 33.33%,
                #00ffff 50%,
                #0000ff 66.66%,
                #ff00ff 83.33%,
                #ff0000 100%);
        border-radius: 24rpx;
    }

    .hue-cursor,
    .alpha-cursor {
        position: absolute;
        top: -8rpx;
        width: 32rpx;
        height: 64rpx;
        background: #ffffff;
        border: 3rpx solid #dddddd;
        border-radius: 8rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
        transform: translateX(-50%);
        pointer-events: none;
        transition: all 0.1s ease;
    }

    .hue-cursor:active,
    .alpha-cursor:active {
        transform: translateX(-50%) scale(1.1);
    }

    /* ========== 透明度滑条 ========== */
    .alpha-checkerboard {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
            linear-gradient(45deg, #cccccc 25%, transparent 25%),
            linear-gradient(-45deg, #cccccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #cccccc 75%),
            linear-gradient(-45deg, transparent 75%, #cccccc 75%);
        background-size: 16rpx 16rpx;
        background-position: 0 0, 0 8rpx, 8rpx -8rpx, -8rpx 0;
        border-radius: 24rpx;
    }

    .alpha-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 24rpx;
    }

    /* ========== 颜色信息区域 ========== */
    .color-info {
        display: flex;
        gap: 32rpx;
        margin-bottom: 40rpx;
    }

    .color-preview {
        width: 160rpx;
        flex-shrink: 0;
    }

    .preview-current,
    .preview-old {
        width: 100%;
        height: 60rpx;
        border-radius: 12rpx;
        position: relative;
        overflow: hidden;
        border: 2rpx solid #eeeeee;
    }

    .preview-current {
        margin-bottom: 16rpx;
    }

    .preview-checkerboard {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
            linear-gradient(45deg, #eeeeee 25%, transparent 25%),
            linear-gradient(-45deg, #eeeeee 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #eeeeee 75%),
            linear-gradient(-45deg, transparent 75%, #eeeeee 75%);
        background-size: 12rpx 12rpx;
        background-position: 0 0, 0 6rpx, 6rpx -6rpx, -6rpx 0;
    }


    /* ========== 颜色输入 ========== */
    .color-inputs {
        flex: 1;
        min-width: 0;
    }

    .input-tabs {
        display: flex;
        margin-bottom: 20rpx;
        background: #f8f8f8;
        border-radius: 12rpx;
        padding: 4rpx;
    }

    .color-picker--dark .input-tabs {
        background: #2a2a2a;
    }

    .input-tab {
        flex: 1;
        text-align: center;
        padding: 12rpx 8rpx;
        font-size: 26rpx;
        color: #666666;
        border-radius: 8rpx;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .input-tab.active {
        background: #ffffff;
        color: #333333;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    }

    .color-picker--dark .input-tab.active {
        background: #1a1a1a;
        color: #ffffff;
    }

    .input-group {
        margin-bottom: 20rpx;
    }

    .input-row {
        display: flex;
        gap: 16rpx;
    }

    .input-row .input-group {
        flex: 1;
        margin-bottom: 0;
    }

    .input-label {
        display: block;
        font-size: 24rpx;
        color: #666666;
        margin-bottom: 8rpx;
        font-weight: 500;
    }

    .color-picker--dark .input-label {
        color: #cccccc;
    }

    .color-input {
        width: 100%;
        height: 64rpx;
        padding: 0 16rpx;
        border: 2rpx solid #eeeeee;
        border-radius: 12rpx;
        font-size: 28rpx;
        text-align: center;
        box-sizing: border-box;
        transition: all 0.2s ease;
        background: #ffffff;
    }

    .color-picker--dark .color-input {
        background: #2a2a2a;
        border-color: #444444;
        color: #ffffff;
    }

    .color-input:focus {
        border-color: #007aff;
        outline: none;
        box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.1);
    }

    .hex-input {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        text-transform: uppercase;
    }

    /* ========== 操作按钮 ========== */
    .color-actions {
        display: flex;
        gap: 24rpx;
        margin-top: 40rpx;
    }

    .action-btn {
        flex: 1;
        height: 88rpx;
        line-height: 88rpx;
        text-align: center;
        border-radius: 16rpx;
        font-size: 32rpx;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .cancel-btn {
        background: #f8f8f8;
        color: #666666;
    }

    .color-picker--dark .cancel-btn {
        background: #2a2a2a;
        color: #cccccc;
    }

    .confirm-btn {
        background: linear-gradient(135deg, #007aff, #0056cc);
        color: #ffffff;
        box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
    }

    .action-btn:active {
        transform: scale(0.98);
    }

    .cancel-btn:active {
        background: #eeeeee;
    }

    .color-picker--dark .cancel-btn:active {
        background: #1a1a1a;
    }

    .confirm-btn:active {
        box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.4);
    }
</style>