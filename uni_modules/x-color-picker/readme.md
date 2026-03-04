# x-color-picker 颜色选择器使用说明

## 组件简介

`x-color-picker` 一个功能强大的颜色选择器组件。它提供了直观的颜色选择界面，支持多种颜色格式，并具有丰富的自定义选项。

## 特性

- 🎨 **直观的颜色选择界面**：HSV 色相/饱和度/亮度面板
- 🌈 **多种颜色格式支持**：HEX、RGB、HSL
- 🎯 **透明度控制**：支持 Alpha 通道调节
- 🎪 **预设颜色**：内置常用颜色面板
- 📝 **历史记录**：自动保存最近使用的颜色
- 🌙 **深色模式**：支持明暗主题切换


## 基础用法

### 最简单的使用方式
```vue
<template>
  <x-color-picker v-model="selectedColor" />
</template>

<script>
export default {
  data() {
    return {
      selectedColor: '#1B73CC'
    }
  }
}
</script>
```

### 监听颜色变化
```vue
<template>
  <x-color-picker 
    v-model="selectedColor" 
    @change="onColorChange"
    @confirm="onColorConfirm"
    @cancel="onColorCancel"
  />
</template>

<script>
export default {
  data() {
    return {
      selectedColor: '#1B73CC'
    }
  },
  methods: {
    onColorChange(color) {
      console.log('颜色实时变化:', color)
    },
    onColorConfirm(color) {
      console.log('确认选择:', color)
    },
    onColorCancel() {
      console.log('取消选择')
    }
  }
}
</script>
```

## Props 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `modelValue` | String | `'#1B73CC'` | 当前选中的颜色值（HEX 格式）|
| `showAlpha` | Boolean | `true` | 是否显示透明度控制 |
| `showPresets` | Boolean | `true` | 是否显示预设颜色面板 |
| `darkMode` | Boolean | `false` | 是否启用深色模式 |
| `saveHistory` | Boolean | `true` | 是否保存颜色历史记录 |
| `cancelText` | String | `'取消'` | 取消按钮文本 |
| `confirmText` | String | `'确定'` | 确认按钮文本 |
| `options` | Object | 见下方 | 自定义配置选项 |

### options 配置项

```javascript
{
  width: uni.upx2px(630),        // 组件宽度（px）
  padding: uni.upx2px(32),       // 内边距（px）
  throttleDelay: 16,             // 触摸事件节流延迟（ms）
  cursorSize: uni.upx2px(36),    // 光标大小（px）
  maxHistory: 8                  // 最大历史记录数量
}
```

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | `color: string` | 颜色值更新（用于 v-model） |
| `change` | `color: object` | 颜色实时变化时触发 |
| `confirm` | `color: object` | 点击确认按钮时触发 |
| `cancel` | - | 点击取消按钮时触发 |

### color 对象结构
```javascript
{
  hex: '#FF5722',                    // HEX 格式
  rgb: { r: 255, g: 87, b: 34 },     // RGB 对象
  hsv: { h: 12, s: 87, v: 100 },     // HSV 对象
  hsl: { h: 12, s: 100, l: 57 },     // HSL 对象
  alpha: 100,                        // 透明度 (0-100)
  rgba: 'rgba(255, 87, 34, 1)'       // RGBA 字符串
}
```

## 高级用法示例

### 禁用透明度和预设颜色
```vue
<template>
  <x-color-picker 
    v-model="color"
    :show-alpha="false"
    :show-presets="false"
  />
</template>
```

### 深色模式
```vue
<template>
  <x-color-picker 
    v-model="color"
    :dark-mode="true"
  />
</template>
```

### 自定义尺寸和配置
```vue
<template>
  <x-color-picker 
    v-model="color"
    :options="customOptions"
  />
</template>

<script>
export default {
  data() {
    return {
      color: '#FF5722',
      customOptions: {
        width: uni.upx2px(700),    // 更大的宽度
        maxHistory: 12,            // 更多历史记录
        throttleDelay: 8           // 更快的响应速度
      }
    }
  }
}
</script>
```

### 禁用历史记录
```vue
<template>
  <x-color-picker 
    v-model="color"
    :save-history="false"
  />
</template>
```

### 自定义按钮文本
```vue
<template>
  <x-color-picker 
    v-model="color"
    cancel-text="返回"
    confirm-text="应用"
  />
</template>
```

## 颜色格式说明

### HEX 格式
- 格式：`#RRGGBB`
- 示例：`#FF5722`、`#000000`、`#FFFFFF`

### RGB 格式
- 格式：`{ r: 0-255, g: 0-255, b: 0-255 }`
- 示例：`{ r: 255, g: 87, b: 34 }`

### HSL 格式
- 格式：`{ h: 0-360, s: 0-100, l: 0-100 }`
- 示例：`{ h: 12, s: 100, l: 57 }`

### HSV 格式
- 格式：`{ h: 0-360, s: 0-100, v: 0-100 }`
- 示例：`{ h: 12, s: 87, v: 100 }`


## 注意事项

1. **性能优化**：组件内置了触摸事件节流，避免频繁更新导致的性能问题
2. **存储限制**：历史记录使用 `uni.getStorageSync` 存储，注意存储空间限制
3. **样式兼容**：在不同平台可能存在细微的样式差异，可通过条件编译进行调整
4. **触摸精度**：在小屏设备上，建议适当调整组件尺寸以提供更好的触摸体验

## 常见问题

### Q: 如何获取不同格式的颜色值？
A: 监听 `change` 或 `confirm` 事件，事件参数包含所有格式的颜色值。

### Q: 如何自定义预设颜色？
A: 当前版本预设颜色是固定的，如需自定义，可以修改组件内的 `PRESET_COLORS` 常量。

### Q: 历史记录存储在哪里？
A: 历史记录使用 `uni.getStorageSync('colorPickerHistory')` 存储在本地。

### Q: 如何在不同页面间共享颜色选择器状态？
A: 可以使用 Vuex 或其他状态管理工具来管理颜色状态。


## 插件如果对你有帮助给个好评吧~