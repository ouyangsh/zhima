import { createScopedThreejs } from 'threejs-miniprogram';

/**
 * 3D 钩针图样渲染器
 * 负责解析 pattern 数据并生成 3D 模型
 */
export class Pattern3DRenderer {
    constructor() {
        this.THREE = null; // Three.js context instance
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.meshGroup = null;
        this.requestId = null;
        this.canvas = null;
        this.width = 300;
        this.height = 300;

        // 旋转/交互状态
        this._touchState = {
            lastX: 0,
            lastY: 0,
            rotX: 0,
            rotY: 0,
            distance: 15,
            rotating: false,
            pinchDist: 0,
            isScrolling: undefined // 新增：是否判定为滚动
        };

        // 针法尺寸映射 (模拟真实比例)
        this.stitchWidthMap = {
            'X': 1.0, 'V': 1.2, 'A': 0.8,
            'T': 1.0, 'F': 1.1, 'E': 1.2,
            'CH': 0.8, 'SL': 0.5
        };
        this.stitchHeightMap = {
            'X': 1.0, 'V': 1.0, 'A': 1.0,
            'T': 1.5, 'F': 2.0, 'E': 3.0,
            'CH': 0.5, 'SL': 0.2
        };
    }

    init(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;

        // 初始化 scoped threejs
        this.THREE = createScopedThreejs(canvas);

        this.renderer = new this.THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio);
        this.renderer.setSize(width, height);
        // 重要：如果不清除 alpha，背景可能会变黑
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new this.THREE.Scene();

        // 相机设置 (透视投影)
        this.camera = new this.THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this._updateCamera();

        // 灯光设置
        const ambientLight = new this.THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        const backLight = new this.THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-10, -10, -10);
        this.scene.add(backLight);
    }

    _updateCamera() {
        if (!this.camera) return;
        const r = this._touchState.distance;
        const phi = this._touchState.rotX;   // 上下旋转
        const theta = this._touchState.rotY; // 左右旋转

        // 球坐标转笛卡尔坐标
        const y = r * Math.sin(phi);
        const horizontalR = r * Math.cos(phi);
        const x = horizontalR * Math.sin(theta);
        const z = horizontalR * Math.cos(theta);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 根据图解数据生成模型
     * @param {Object} patternData 解析后的图样数据
     * @param {Number} highlightPartId 高亮部件ID
     */
    generateModel(patternData, highlightPartId = -1) {
        if (!this.scene) return;

        // 清理旧模型
        if (this.meshGroup) {
            this.scene.remove(this.meshGroup);
            // 简单释放几何体和材质内存
            this.meshGroup.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                }
            });
        }

        this.meshGroup = new this.THREE.Group();

        // 遍历部件生成
        let currentY = 0;

        patternData.parts.forEach((part, index) => {
            const isHighlight = (highlightPartId === -1 || highlightPartId === part.id);
            const partGroup = this._createPartMesh(part, isHighlight, index);
            this.meshGroup.add(partGroup);
        });

        // 自动缩放模型以适应视图
        this._fitCameraToGroup(this.meshGroup);

        this.scene.add(this.meshGroup);
        this._render();
    }

    /**
     * 生成单个部件的 Mesh
     */
    _createPartMesh(part, isHighlight, partIndex) {
        const group = new this.THREE.Group();
        const baseColor = isHighlight ? this._getPartColor(partIndex) : 0xAAAAAA;
        const opacity = isHighlight ? 1.0 : 0.3;

        // 1. 预计算每一行的结构数据 (半径, Y坐标)
        const rowShapes = this._calculateShape(part);

        // 2. 生成每一行的 Mesh
        part.rows.forEach((row, rowIndex) => {
            const shape = rowShapes[rowIndex];
            if (!shape) return;

            // 材质
            const material = new this.THREE.MeshPhongMaterial({
                color: row.color ? this._parseColor(row.color) : baseColor, // 支持行内换色
                transparent: true,
                opacity: opacity,
                shininess: 30, // 增加光泽感，模拟毛线
                flatShading: false
            });

            // 几何体：使用 Torus (圆环) 来模拟一行
            const radius = shape.radius;
            const tubeRadius = shape.tubeRadius;
            const radialSegments = 8;
            const tubularSegments = Math.max(12, Math.min(row.endStitches * 2, 64));

            const geometry = new this.THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments);
            const mesh = new this.THREE.Mesh(geometry, material);

            mesh.rotation.x = Math.PI / 2;
            mesh.position.y = shape.y;
            mesh.position.y += rowIndex * 0.01;

            group.add(mesh);
        });

        return group;
    }

    _calculateShape(part) {
        const shapes = [];
        let currentRadius = 0.5; // 初始半径
        let currentY = 0;

        // 预设单位尺寸
        const UNIT_WIDTH = 0.4;  // 单位针宽
        const UNIT_HEIGHT = 0.5; // 单位针高

        part.rows.forEach((row, i) => {
            let totalWidthFactor = 0;
            let maxStitchHeight = 0;

            const stitches = row.stitches || [];
            if (stitches.length > 0) {
                stitches.forEach(st => {
                    const type = st.type.split('(')[0];
                    totalWidthFactor += (this.stitchWidthMap[type] || 1.0);
                    const h = (this.stitchHeightMap[type] || 1.0);
                    if (h > maxStitchHeight) maxStitchHeight = h;
                });
                if (row.repeatTimes > 1 && row.isRepeat) {
                    const unitAvg = totalWidthFactor / stitches.length;
                    totalWidthFactor = row.endStitches * unitAvg;
                } else if (row.endStitches > stitches.length) {
                    totalWidthFactor = row.endStitches;
                }
            } else {
                totalWidthFactor = row.endStitches;
                maxStitchHeight = 1.0;
            }

            const targetCircumference = totalWidthFactor * UNIT_WIDTH;
            const targetRadius = targetCircumference / (2 * Math.PI);
            const tubeRadius = (maxStitchHeight * UNIT_HEIGHT) / 2;
            const L = maxStitchHeight * UNIT_HEIGHT;
            const dr = Math.abs(targetRadius - currentRadius);
            let dy = 0;
            if (i === 0) {
                currentY = 0;
            } else {
                if (dr < L) {
                    dy = Math.sqrt(L * L - dr * dr);
                } else {
                    dy = 0;
                }
                currentY += dy;
            }

            shapes.push({
                radius: i === 0 ? targetRadius / 2 : targetRadius,
                tubeRadius: tubeRadius,
                y: -currentY
            });

            currentRadius = targetRadius;
        });

        // 归一化 Y，让中心在原点
        const midY = shapes.length > 0 ? shapes[shapes.length - 1].y / 2 : 0;
        shapes.forEach(s => s.y -= midY);

        return shapes;
    }

    _fitCameraToGroup(group) {
        const box = new this.THREE.Box3().setFromObject(group);
        const center = box.getCenter(new this.THREE.Vector3());
        const size = box.getSize(new this.THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        this._touchState.distance = maxDim * 2.5;
        this._touchState.rotX = 0.5; // 稍微俯视
        this._touchState.rotY = 0;

        this._updateCamera();
    }

    _getPartColor(index) {
        const colors = [0x5BB98A, 0xF57F17, 0x4A90D9, 0xE74C3C, 0x9B59B6];
        return colors[index % colors.length];
    }

    _parseColor(colorStr) {
        if (colorStr.startsWith('#')) return parseInt(colorStr.replace('#', '0x'), 16);
        return 0x5BB98A;
    }

    _render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    startAutoRotate() {
        if (this.requestId) return;
        const animate = () => {
            if (!this._touchState.rotating && this._touchState.rotY !== undefined) {
                this._touchState.rotY += 0.005;
                this._updateCamera();
                this._render();
            }
            this.canvas.requestAnimationFrame(animate);
        };
        this.requestId = this.canvas.requestAnimationFrame(animate);
    }

    stopAutoRotate() {
        // 占位
    }

    dispose() {
        if (this.requestId) {
            this.canvas.cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.THREE = null;
    }

    // ===== 交互事件处理 =====

    handleTouchStart(e) {
        this.stopAutoRotate();
        const touches = e.touches || e.changedTouches;
        if (!touches || touches.length === 0) return;

        // Reset scrolling flag
        this._touchState.isScrolling = undefined;

        if (touches.length === 1) {
            this._touchState.rotating = true;
            this._touchState.lastX = touches[0].clientX || touches[0].x;
            this._touchState.lastY = touches[0].clientY || touches[0].y;
        } else if (touches.length === 2) {
            const dx = (touches[0].clientX || touches[0].x) - (touches[1].clientX || touches[1].x);
            const dy = (touches[0].clientY || touches[0].y) - (touches[1].clientY || touches[1].y);
            this._touchState.pinchDist = Math.sqrt(dx * dx + dy * dy);
        }
    }

    handleTouchMove(e) {
        const touches = e.touches || e.changedTouches;
        if (!touches || touches.length === 0) return;

        if (touches.length === 1 && this._touchState.rotating) {
            const x = touches[0].clientX || touches[0].x;
            const y = touches[0].clientY || touches[0].y;
            const dx = x - this._touchState.lastX;
            const dy = y - this._touchState.lastY;

            // 判断用户意图是“页面滚动”还是“模型旋转”
            if (this._touchState.isScrolling === undefined) {
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return; // Wait for distinct movement

                if (Math.abs(dy) > Math.abs(dx)) {
                    // Vertical movement -> allow scroll
                    this._touchState.isScrolling = true;
                    this._touchState.rotating = false;
                    return;
                } else {
                    // Horizontal movement -> lock to rotate
                    this._touchState.isScrolling = false;
                }
            }

            if (this._touchState.isScrolling) {
                return;
            }

            // Execute rotation
            this._touchState.rotY += dx * 0.008;
            this._touchState.rotX += dy * 0.008;
            this._touchState.rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this._touchState.rotX));

            this._touchState.lastX = x;
            this._touchState.lastY = y;
            this._updateCamera();
            this._render();
        }
        else if (touches.length === 2) {
            const x1 = touches[0].clientX || touches[0].x;
            const y1 = touches[0].clientY || touches[0].y;
            const x2 = touches[1].clientX || touches[1].x;
            const y2 = touches[1].clientY || touches[1].y;

            const dx = x1 - x2;
            const dy = y1 - y2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (!this._touchState.pinchDist) this._touchState.pinchDist = dist;

            const delta = dist - this._touchState.pinchDist;
            this._touchState.distance = Math.max(3, Math.min(50, this._touchState.distance - delta * 0.03));

            this._touchState.pinchDist = dist;
            this._updateCamera();
            this._render();
        }
    }

    handleTouchEnd() {
        this._touchState.rotating = false;
    }
}
