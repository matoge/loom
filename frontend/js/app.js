// Working 3D annotation app with ISO 8855 coordinate system
class AnnotationApp {
    constructor() {
        this.canvas = document.getElementById('babylon-canvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;
        this.camera = null;
        this.pointCloud = null;
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Simple 3D Annotation Studio...');
        this.createScene();
        this.createSimpleGrid();
        this.createAxisDisplay();
        this.createCameraFrustumStructure(); // Just structure, no image yet
        this.startRenderLoop();
        this.setupUI();
        this.hideInstructions();
    }
    
    hideInstructions() {
        // Auto-hide instructions after delay
        setTimeout(() => {
            const instructions = document.getElementById('instructions-overlay');
            if (instructions) {
                instructions.style.display = 'none';
            }
        }, 3000);
    }
    
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.06, 0.08, 0.12);
        
        // Camera aligned with ISO 8855 - looking towards +X forward
        this.camera = new BABYLON.ArcRotateCamera(
            'camera', 
            -Math.PI / 2,  // Alpha: -90° = looking towards +X forward (ISO convention)
            Math.PI / 4,   // Beta: 45° elevation angle (better view of frustum)
            15,            // Closer radius to see frustum better
            new BABYLON.Vector3(0, 0, 0), // Look at origin where axis display is
            this.scene
        );
        
        this.camera.attachControl(this.canvas, true);
        this.camera.wheelPrecision = 50;
        
        // Directional lighting - no visible light source
        const light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-1, -1, -1), this.scene);
        light.intensity = 0.7;
        
        // Ground plane
        const ground = BABYLON.MeshBuilder.CreateGround('ground', {width: 100, height: 100}, this.scene);
        const groundMat = new BABYLON.StandardMaterial('groundMat', this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        ground.material = groundMat;
        ground.position.y = -0.1;
    }
    
    createSimpleGrid() {
        try {
            const lines = [];
            
            // Concentric circles (distance rings)
            const circles = [10, 20, 30, 50];
            for (const radius of circles) {
                const points = [];
                const segments = 64;
                
                for (let i = 0; i <= segments; i++) {
                    const angle = (i / segments) * 2 * Math.PI;
                    points.push(new BABYLON.Vector3(
                        radius * Math.cos(angle), // X (ISO -Y, right/left)
                        0.05, // Slightly above ground
                        radius * Math.sin(angle)  // Z (ISO +X, forward/backward)
                    ));
                }
                lines.push(points);
            }
            
            // Radial lines from center (like spokes)
            const radialAngles = [0, 45, 90, 135, 180, 225, 270, 315];
            const maxRadius = 50;
            
            for (const angleDeg of radialAngles) {
                const angleRad = (angleDeg * Math.PI) / 180;
                const radialLine = [
                    new BABYLON.Vector3(0, 0.05, 0), // Center
                    new BABYLON.Vector3(
                        maxRadius * Math.cos(angleRad), // X direction
                        0.05,
                        maxRadius * Math.sin(angleRad)  // Z direction  
                    )
                ];
                lines.push(radialLine);
            }
            
            // Create the grid
            const grid = BABYLON.MeshBuilder.CreateLineSystem('grid', { lines }, this.scene);
            grid.color = new BABYLON.Color3(0.25, 0.35, 0.4);
            grid.alpha = 0.7;
            
            // Add simple coordinate axes
            this.createCoordinateAxes();
            
        } catch (error) {
            console.error('Error creating grid:', error);
        }
    }
    
    createCoordinateAxes() {
        // Simple colored coordinate axes
        const axisLines = [
            // Z-axis (forward/backward) - Red
            {
                line: [
                    new BABYLON.Vector3(0, 0.1, -20),
                    new BABYLON.Vector3(0, 0.1, 20)
                ],
                color: new BABYLON.Color3(1, 0.2, 0.2)
            },
            // X-axis (right/left) - Green
            {
                line: [
                    new BABYLON.Vector3(-20, 0.1, 0),
                    new BABYLON.Vector3(20, 0.1, 0)
                ],
                color: new BABYLON.Color3(0.2, 1, 0.2)
            },
            // Y-axis (up) - Blue
            {
                line: [
                    new BABYLON.Vector3(0, 0, 0),
                    new BABYLON.Vector3(0, 8, 0)
                ],
                color: new BABYLON.Color3(0.2, 0.2, 1)
            }
        ];
        
        for (const axis of axisLines) {
            const axisLine = BABYLON.MeshBuilder.CreateLineSystem(
                'axisLine',
                { lines: [axis.line] },
                this.scene
            );
            axisLine.color = axis.color;
            axisLine.alpha = 0.8;
        }
    }
    
    createAxisDisplay() {
        console.log('🧭 Creating simple axis display...');
        
        const axisLength = 5;
        const origin = BABYLON.Vector3.Zero();
        
        try {
            // Make thicker, more visible axis arrows using cylinders
            
            // X+ FORWARD axis (RED) - thick cylinder pointing toward camera
            const xCylinder = BABYLON.MeshBuilder.CreateCylinder('xAxis', {
                height: axisLength, 
                diameter: 0.2
            }, this.scene);
            xCylinder.position = new BABYLON.Vector3(0, 0, axisLength/2);
            xCylinder.rotation.x = Math.PI/2;
            const xMat = new BABYLON.StandardMaterial('xMat', this.scene);
            xMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
            xCylinder.material = xMat;
            
            // Y+ LEFT axis (GREEN) - thick cylinder pointing left
            const yCylinder = BABYLON.MeshBuilder.CreateCylinder('yAxis', {
                height: axisLength,
                diameter: 0.2
            }, this.scene);
            yCylinder.position = new BABYLON.Vector3(-axisLength/2, 0, 0);
            yCylinder.rotation.z = Math.PI/2;
            const yMat = new BABYLON.StandardMaterial('yMat', this.scene);
            yMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
            yCylinder.material = yMat;
            
            // Z+ UP axis (BLUE) - thick cylinder pointing up
            const zCylinder = BABYLON.MeshBuilder.CreateCylinder('zAxis', {
                height: axisLength,
                diameter: 0.2
            }, this.scene);
            zCylinder.position = new BABYLON.Vector3(0, axisLength/2, 0);
            const zMat = new BABYLON.StandardMaterial('zMat', this.scene);
            zMat.emissiveColor = new BABYLON.Color3(0, 0, 1);
            zCylinder.material = zMat;
            
            console.log('🔴 RED cylinder = X+ FORWARD');
            console.log('🟢 GREEN cylinder = Y+ LEFT'); 
            console.log('🔵 BLUE cylinder = Z+ UP');
            
        } catch (error) {
            console.error('❌ Error creating axis display:', error);
        }
    }
    
    createCameraFrustumStructure() {
        // Smaller, more realistic camera frustum - structure only, no image yet
        const position = new BABYLON.Vector3(0, 1.5, 1); // Lower camera position
        const fovH = Math.PI * 90 / 180; // 90° horizontal FOV (more realistic)
        const fovV = Math.PI * 50 / 180; // 50° vertical FOV 
        const nearDist = 0.3;
        const farDist = 8; // Much smaller frustum
        
        // Create frustum wireframe pointing in +Z direction (ISO +X)
        const frustumLines = [];
        
        // Near plane corners
        const nearHW = Math.tan(fovH / 2) * nearDist;
        const nearHH = Math.tan(fovV / 2) * nearDist;
        const nearCorners = [
            position.add(new BABYLON.Vector3(-nearHW, nearHH, nearDist)),  // Top-left
            position.add(new BABYLON.Vector3(nearHW, nearHH, nearDist)),   // Top-right
            position.add(new BABYLON.Vector3(nearHW, -nearHH, nearDist)),  // Bottom-right
            position.add(new BABYLON.Vector3(-nearHW, -nearHH, nearDist)), // Bottom-left
        ];
        
        // Far plane corners
        const farHW = Math.tan(fovH / 2) * farDist;
        const farHH = Math.tan(fovV / 2) * farDist;
        const farCorners = [
            position.add(new BABYLON.Vector3(-farHW, farHH, farDist)),   // Top-left
            position.add(new BABYLON.Vector3(farHW, farHH, farDist)),    // Top-right
            position.add(new BABYLON.Vector3(farHW, -farHH, farDist)),   // Bottom-right
            position.add(new BABYLON.Vector3(-farHW, -farHH, farDist)),  // Bottom-left
        ];
        
        // Near plane lines
        for (let i = 0; i < 4; i++) {
            frustumLines.push([nearCorners[i], nearCorners[(i + 1) % 4]]);
        }
        
        // Far plane lines  
        for (let i = 0; i < 4; i++) {
            frustumLines.push([farCorners[i], farCorners[(i + 1) % 4]]);
        }
        
        // Connection lines from near to far
        for (let i = 0; i < 4; i++) {
            frustumLines.push([nearCorners[i], farCorners[i]]);
        }
        
        // Create line system
        const frustum = BABYLON.MeshBuilder.CreateLineSystem('frustum', {
            lines: frustumLines
        }, this.scene);
        
        const frustumMaterial = new BABYLON.StandardMaterial('frustumMat', this.scene);
        frustumMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan color
        frustum.material = frustumMaterial;
        
        // Store frustum data for later image plane creation
        this.farCorners = farCorners;
        this.frustumMesh = frustum;
        
        console.log('📹 Camera frustum structure created (no image yet)');
    }
    
    createFrustumImagePlane(farCorners, imageData) {
        try {
            // Remove existing image plane
            if (this.imagePlane) {
                this.imagePlane.dispose();
            }
            
            // Create a plane mesh for the far plane
            const imagePlane = BABYLON.MeshBuilder.CreatePlane('imagePlane', {
                width: Math.abs(farCorners[1].x - farCorners[0].x), // Width from corners
                height: Math.abs(farCorners[0].y - farCorners[3].y)  // Height from corners
            }, this.scene);
            
            // Position at center of far plane
            const centerX = (farCorners[0].x + farCorners[1].x) / 2;
            const centerY = (farCorners[0].y + farCorners[3].y) / 2;
            const centerZ = farCorners[0].z;
            imagePlane.position = new BABYLON.Vector3(centerX, centerY, centerZ);
            
            // Create material for camera image
            const imageMaterial = new BABYLON.StandardMaterial('imageMat', this.scene);
            
            // Load the provided image data
            if (imageData && imageData.image_data) {
                const texture = new BABYLON.Texture(imageData.image_data, this.scene);
                imageMaterial.diffuseTexture = texture;
                imageMaterial.emissiveTexture = texture; // Make it glow slightly
                imageMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                console.log(`✅ Camera image loaded for preset: ${imageData.preset}`);
            }
            
            imagePlane.material = imageMaterial;
            
            // Store reference for later updates
            this.imagePlane = imagePlane;
            
            // Add click handler to transition to 2D mode
            imagePlane.actionManager = new BABYLON.ActionManager(this.scene);
            imagePlane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    console.log('📸 Clicked on camera frustum image - transitioning to 2D mode');
                    this.transitionTo2DMode();
                }
            ));
            
            console.log('📸 Camera image plane created with scene data and click handler');
            
        } catch (error) {
            console.error('❌ Error creating image plane:', error);
        }
    }
    
    async loadCameraImage(material, preset = 'traffic_scene') {
        try {
            const apiBaseUrl = this.getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/camera/image/${preset}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Create texture from base64 image data
                const texture = new BABYLON.Texture(data.image_data, this.scene);
                material.diffuseTexture = texture;
                material.emissiveTexture = texture; // Make it glow slightly
                material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                
                console.log(`✅ Camera image loaded and applied to frustum for preset: ${preset}`);
            } else {
                console.error('❌ Failed to load camera image');
            }
            
        } catch (error) {
            console.error('❌ Error loading camera image:', error);
        }
    }
    
    async updateCameraImage(preset) {
        // Find the image plane material and update it
        if (this.imagePlane && this.imagePlane.material) {
            await this.loadCameraImage(this.imagePlane.material, preset);
        }
    }
    
    toggle2DImageOverlay() {
        // Check if we have scene data with camera image
        if (!this.currentSceneData || !this.currentSceneData.camera_image) {
            alert('Please generate a scene first to view 2D camera image');
            return;
        }
        
        // Create or toggle the 2D annotation sub-window
        let subWindow = document.getElementById('camera-2d-window');
        
        if (!subWindow) {
            subWindow = this.create2DAnnotationWindow();
        } else {
            // Toggle visibility
            const isVisible = subWindow.style.display !== 'none';
            subWindow.style.display = isVisible ? 'none' : 'block';
            console.log(`📐 2D annotation window ${isVisible ? 'hidden' : 'shown'}`);
        }
    }
    
    create2DAnnotationWindow() {
        // Create a professional 2D annotation sub-window (bottom-right)
        const subWindow = document.createElement('div');
        subWindow.id = 'camera-2d-window';
        subWindow.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 480px;
            height: 360px;
            background: rgba(20, 25, 35, 0.95);
            border: 2px solid #00ffff;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            display: block;
            z-index: 1000;
            resize: both;
            overflow: hidden;
            min-width: 320px;
            min-height: 240px;
        `;
        
        // Title bar with controls
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            background: linear-gradient(90deg, #00ffff22, #0066ff22);
            padding: 8px 12px;
            border-bottom: 1px solid #00ffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        `;
        
        const titleText = document.createElement('span');
        titleText.textContent = `📐 2D Camera View (${this.currentSceneData.preset})`;
        titleText.style.cssText = `
            color: #00ffff;
            font-weight: bold;
            flex: 1;
            font-size: 14px;
        `;
        
        // Controls section
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;
        
        // Point cloud overlay toggle
        const pcOverlayBtn = document.createElement('button');
        pcOverlayBtn.textContent = '🔴 PC';
        pcOverlayBtn.title = 'Toggle Point Cloud Overlay';
        pcOverlayBtn.style.cssText = `
            padding: 4px 8px;
            background: #333;
            color: #fff;
            border: 1px solid #666;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        `;
        pcOverlayBtn.onclick = () => this.togglePointCloudOverlay();
        
        // Box count
        const boxCountText = document.createElement('span');
        boxCountText.id = '2d-box-count-window';
        boxCountText.textContent = '0';
        boxCountText.style.cssText = `
            color: #00ffff;
            font-size: 11px;
            padding: 2px 6px;
            background: rgba(0, 255, 255, 0.2);
            border-radius: 10px;
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            padding: 2px 8px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
        `;
        closeBtn.onclick = () => subWindow.style.display = 'none';
        
        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: calc(100% - 40px);
            overflow: hidden;
        `;
        
        // Camera image
        const img = document.createElement('img');
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            background: #111;
        `;
        img.src = this.currentSceneData.camera_image.image_data;
        
        // SVG overlay for 2D annotations
        const svgOverlay = document.createElement('svg');
        svgOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: all;
            cursor: crosshair;
        `;
        
        // Canvas for point cloud overlay (initially hidden)
        const pcCanvas = document.createElement('canvas');
        pcCanvas.id = 'pc-overlay-canvas';
        pcCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: none;
        `;
        
        // Setup 2D box drawing
        this.setup2DBoxDrawingWindow(svgOverlay, img);
        
        // Make draggable
        this.makeDraggable(subWindow, titleBar);
        
        // Assemble components
        controls.appendChild(pcOverlayBtn);
        controls.appendChild(boxCountText);
        controls.appendChild(closeBtn);
        
        titleBar.appendChild(titleText);
        titleBar.appendChild(controls);
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(pcCanvas);
        imageContainer.appendChild(svgOverlay);
        
        subWindow.appendChild(titleBar);
        subWindow.appendChild(imageContainer);
        
        document.body.appendChild(subWindow);
        
        console.log('📐 Professional 2D annotation sub-window created');
        return subWindow;
    }
    
    setup2DBoxDrawingWindow(svgOverlay, imageElement) {
        this.image2DBoxes = this.image2DBoxes || [];
        let isDrawing = false;
        let startPoint = null;
        let currentBox = null;
        
        svgOverlay.addEventListener('mousedown', (e) => {
            const rect = svgOverlay.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
            const y = ((e.clientY - rect.top) / rect.height) * 100;  // Percentage
            
            isDrawing = true;
            startPoint = { x, y };
            
            // Create new SVG rectangle
            currentBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            currentBox.setAttribute('x', x + '%');
            currentBox.setAttribute('y', y + '%');
            currentBox.setAttribute('width', '0%');
            currentBox.setAttribute('height', '0%');
            currentBox.setAttribute('fill', 'none');
            currentBox.setAttribute('stroke', '#00ff00');
            currentBox.setAttribute('stroke-width', '2');
            currentBox.setAttribute('stroke-dasharray', '5,5');
            
            svgOverlay.appendChild(currentBox);
        });
        
        svgOverlay.addEventListener('mousemove', (e) => {
            if (!isDrawing || !currentBox) return;
            
            const rect = svgOverlay.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const width = Math.abs(x - startPoint.x);
            const height = Math.abs(y - startPoint.y);
            const minX = Math.min(x, startPoint.x);
            const minY = Math.min(y, startPoint.y);
            
            currentBox.setAttribute('x', minX + '%');
            currentBox.setAttribute('y', minY + '%');
            currentBox.setAttribute('width', width + '%');
            currentBox.setAttribute('height', height + '%');
        });
        
        svgOverlay.addEventListener('mouseup', (e) => {
            if (!isDrawing || !currentBox) return;
            
            isDrawing = false;
            
            // Get final box dimensions
            const rect = svgOverlay.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const width = Math.abs(x - startPoint.x);
            const height = Math.abs(y - startPoint.y);
            
            // Only keep box if it has meaningful size
            if (width > 1 && height > 1) {
                // Make box solid and add click handler
                currentBox.setAttribute('stroke', '#00ff00');
                currentBox.setAttribute('stroke-dasharray', 'none');
                currentBox.setAttribute('fill', 'rgba(0, 255, 0, 0.1)');
                
                // Store box data
                const boxData = {
                    element: currentBox,
                    id: `2d_box_${this.image2DBoxes.length + 1}`,
                    x: Math.min(x, startPoint.x),
                    y: Math.min(y, startPoint.y),
                    width: width,
                    height: height,
                    label: 'object_2d'
                };
                
                this.image2DBoxes.push(boxData);
                
                // Update box count
                this.update2DBoxCountWindow();
                
                // Add click handler for selection
                currentBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.select2DBox(boxData);
                });
                
                console.log('📦 Created 2D box:', boxData);
            } else {
                // Remove too small boxes
                svgOverlay.removeChild(currentBox);
            }
            
            currentBox = null;
            startPoint = null;
        });
    }
    
    select2DBox(boxData) {
        // Deselect all boxes
        this.image2DBoxes.forEach(box => {
            box.element.setAttribute('stroke', '#00ff00');
            box.element.setAttribute('stroke-width', '2');
        });
        
        // Select this box
        boxData.element.setAttribute('stroke', '#ff0000');
        boxData.element.setAttribute('stroke-width', '3');
        
        console.log('📦 Selected 2D box:', boxData.id);
    }
    
    update2DBoxCount() {
        const countElement = document.getElementById('2d-box-count');
        if (countElement) {
            const count = this.image2DBoxes ? this.image2DBoxes.length : 0;
            countElement.textContent = `${count} boxes`;
        }
    }
    
    update2DBoxCountWindow() {
        const countElement = document.getElementById('2d-box-count-window');
        if (countElement) {
            const count = this.image2DBoxes ? this.image2DBoxes.length : 0;
            countElement.textContent = `${count}`;
        }
    }
    
    makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(element).left, 10);
            startTop = parseInt(window.getComputedStyle(element).top, 10);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            element.style.left = (startLeft + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        }
        
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
    
    togglePointCloudOverlay() {
        const canvas = document.getElementById('pc-overlay-canvas');
        const btn = document.querySelector('button[title="Toggle Point Cloud Overlay"]');
        
        if (!canvas || !btn) return;
        
        const isVisible = canvas.style.display !== 'none';
        
        if (isVisible) {
            canvas.style.display = 'none';
            btn.textContent = '⚫ PC';
            btn.style.background = '#333';
            console.log('🔴 Point cloud overlay hidden');
        } else {
            canvas.style.display = 'block';
            btn.textContent = '🔴 PC';
            btn.style.background = '#aa0000';
            this.renderPointCloudOverlay(canvas);
            console.log('🔴 Point cloud overlay shown');
        }
    }
    
    renderPointCloudOverlay(canvas) {
        if (!this.currentSceneData || !this.currentSceneData.point_cloud) {
            console.log('⚠️ No point cloud data for overlay');
            return;
        }
        
        // Set canvas size to match container
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple point projection (this would normally use camera matrices)
        const points = this.currentSceneData.point_cloud.points;
        
        // Simulate camera projection (simplified)
        points.forEach(point => {
            const [x, y, z, intensity] = point;
            
            // Simple perspective projection
            const projectedX = (canvas.width / 2) + (x * 20);
            const projectedY = (canvas.height / 2) - (z * 20);
            
            // Only render points that are in front of camera and within bounds
            if (projectedX >= 0 && projectedX < canvas.width && 
                projectedY >= 0 && projectedY < canvas.height && y > 0) {
                
                ctx.fillStyle = `rgba(0, 255, 255, ${intensity * 0.8})`;
                ctx.fillRect(projectedX - 1, projectedY - 1, 2, 2);
            }
        });
        
        console.log(`📊 Rendered ${points.length} points on overlay`);
    }
    
    transitionTo2DMode() {
        // Smooth transition from 3D frustum click to 2D annotation mode
        console.log('🔄 Transitioning from 3D to 2D annotation mode...');
        
        // Open the 2D annotation window
        this.toggle2DImageOverlay();
        
        // Optional: Add visual feedback for the transition
        if (this.imagePlane) {
            // Brief highlight animation
            const originalColor = this.imagePlane.material.emissiveColor.clone();
            this.imagePlane.material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            
            setTimeout(() => {
                if (this.imagePlane && this.imagePlane.material) {
                    this.imagePlane.material.emissiveColor = originalColor;
                }
            }, 200);
        }
    }
    
    toggleCameraFrustum() {
        if (this.frustumMesh) {
            this.frustumMesh.isVisible = !this.frustumMesh.isVisible;
        }
        if (this.imagePlane) {
            this.imagePlane.isVisible = !this.imagePlane.isVisible;
        }
    }
    
    startRenderLoop() {
        this.engine.runRenderLoop(() => this.scene.render());
        window.addEventListener('resize', () => this.engine.resize());
    }
    
    setupUI() {
        console.log('🔧 Setting up UI...');
        
        // Connect to existing UI elements
        const loadButton = document.getElementById('load-preset');
        console.log('Load button found:', !!loadButton);
        
        if (loadButton) {
            loadButton.addEventListener('click', (e) => {
                console.log('🎯 Generate Scene button clicked!');
                e.preventDefault();
                this.loadSelectedPreset();
            });
        } else {
            console.warn('❌ Load preset button not found');
        }
        
        // Setup view mode buttons
        this.setupViewModeButtons();
        
        // Setup annotation tools
        this.setupAnnotationTools();
        
        // Hide instructions button
        const hideInstructionsBtn = document.getElementById('hide-instructions');
        if (hideInstructionsBtn) {
            hideInstructionsBtn.addEventListener('click', () => {
                const instructions = document.getElementById('instructions-overlay');
                if (instructions) {
                    instructions.style.display = 'none';
                }
            });
        }
        
        console.log('✅ UI setup complete');
    }
    
    setupViewModeButtons() {
        // 3D View - look at X forward
        const view3D = document.getElementById('view-3d');
        if (view3D) {
            view3D.addEventListener('click', () => {
                this.camera.alpha = -Math.PI / 2;  // Look towards +X forward
                this.camera.beta = Math.PI / 4;    // 45° elevation
                this.camera.radius = 15;
                this.camera.setTarget(BABYLON.Vector3.Zero());
                console.log('📐 3D view activated - looking at X forward');
            });
        }
        
        // Top View  
        const viewTop = document.getElementById('view-top');
        if (viewTop) {
            viewTop.addEventListener('click', () => {
                this.camera.alpha = 0;
                this.camera.beta = 0.1; // Almost top-down
                this.camera.radius = 20;
                this.camera.setTarget(BABYLON.Vector3.Zero());
                console.log('🔝 Top view activated');
            });
        }
        
        // 2D View (show camera image overlay)
        const view2D = document.getElementById('view-2d');
        if (view2D) {
            view2D.addEventListener('click', () => {
                this.toggle2DImageOverlay();
                console.log('🖼️ 2D camera view toggled');
            });
        }
        
        // Camera Frustum Toggle
        const toggleFrustum = document.getElementById('toggle-frustum');
        if (toggleFrustum) {
            toggleFrustum.addEventListener('click', () => {
                this.toggleCameraFrustum();
                console.log('📹 Camera frustum visibility toggled');
            });
        }
    }
    
    setupAnnotationTools() {
        this.annotationBoxes = [];
        this.currentTool = 'select';
        
        // Select Tool
        const selectTool = document.getElementById('tool-select');
        if (selectTool) {
            selectTool.addEventListener('click', () => {
                this.currentTool = 'select';
                this.updateToolSelection();
                console.log('🖱️ Select tool activated');
            });
        }
        
        // Box Tool
        const boxTool = document.getElementById('tool-box');
        if (boxTool) {
            boxTool.addEventListener('click', () => {
                this.currentTool = 'box';
                this.updateToolSelection();
                console.log('📦 Box tool activated');
            });
        }
        
        // Setup 3D interaction for box creation
        this.setupBoxCreation();
    }
    
    updateToolSelection() {
        // Update UI to show active tool
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`tool-${this.currentTool}`);
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    setupBoxCreation() {
        let startPoint = null;
        let isCreating = false;
        
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.currentTool !== 'box') return;
            
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === 0) {
                        const pickResult = this.scene.pick(
                            this.scene.pointerX,
                            this.scene.pointerY,
                            (mesh) => mesh.name === 'ground'
                        );
                        
                        if (pickResult.hit) {
                            startPoint = pickResult.pickedPoint;
                            isCreating = true;
                            console.log('📦 Starting box creation at:', startPoint);
                        }
                    }
                    break;
                    
                case BABYLON.PointerEventTypes.POINTERUP:
                    if (isCreating && startPoint) {
                        const pickResult = this.scene.pick(
                            this.scene.pointerX,
                            this.scene.pointerY,
                            (mesh) => mesh.name === 'ground'
                        );
                        
                        if (pickResult.hit) {
                            this.createAnnotationBox(startPoint, pickResult.pickedPoint);
                        }
                        
                        startPoint = null;
                        isCreating = false;
                    }
                    break;
            }
        });
    }
    
    createAnnotationBox(startPoint, endPoint) {
        const center = startPoint.add(endPoint).scale(0.5);
        const size = endPoint.subtract(startPoint);
        
        // Ensure minimum size for visibility (typical car dimensions)
        const minSize = 4.0; // 4 meters minimum 
        const boxWidth = Math.max(Math.abs(size.x), minSize);
        const boxDepth = Math.max(Math.abs(size.z), minSize);
        const boxHeight = 1.8; // Typical car height
        
        // Create wireframe box
        const box = BABYLON.MeshBuilder.CreateBox('annotationBox', {
            width: boxWidth,
            height: boxHeight,
            depth: boxDepth
        }, this.scene);
        
        box.position = new BABYLON.Vector3(center.x, boxHeight/2, center.z); // Center vertically
        
        // Wireframe material
        const material = new BABYLON.StandardMaterial('boxMaterial', this.scene);
        material.wireframe = true;
        material.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange
        box.material = material;
        
        // Store annotation data
        box.metadata = {
            type: 'annotation',
            label: document.getElementById('object-label').value || 'object',
            created: Date.now(),
            id: `box_${this.annotationBoxes.length + 1}`,
            dimensions: {
                width: boxWidth,
                height: boxHeight,
                depth: boxDepth
            }
        };
        
        // Add selection capability
        box.actionManager = new BABYLON.ActionManager(this.scene);
        box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, 
            () => this.selectBox(box)
        ));
        
        this.annotationBoxes.push(box);
        this.updateObjectsList();
        
        console.log('✅ Created annotation box:', box.metadata);
    }
    
    updateObjectsList() {
        const objectList = document.getElementById('object-list');
        const statObjects = document.getElementById('stat-objects');
        
        if (this.annotationBoxes.length === 0) {
            if (objectList) {
                objectList.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="box" class="empty-icon"></i>
                        <p>No objects yet</p>
                        <p class="empty-hint">Use the Box tool to create annotations</p>
                    </div>`;
            }
        } else {
            if (objectList) {
                objectList.innerHTML = this.annotationBoxes.map(box => `
                    <div class="object-item">
                        <span>${box.metadata.id}: ${box.metadata.label}</span>
                        <button onclick="app.deleteBox('${box.metadata.id}')" class="btn btn-sm btn-danger">×</button>
                    </div>
                `).join('');
            }
        }
        
        if (statObjects) {
            statObjects.textContent = this.annotationBoxes.length;
        }
    }
    
    selectBox(box) {
        // Deselect previous box
        if (this.selectedBox) {
            this.selectedBox.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange
            this.hideEditingHandles();
        }
        
        // Select new box
        this.selectedBox = box;
        box.material.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green when selected
        this.showEditingHandles(box);
        
        console.log('📦 Selected box:', box.metadata.id);
    }
    
    showEditingHandles(box) {
        // Remove existing handles
        this.hideEditingHandles();
        
        this.editingHandles = [];
        const handleSize = 0.3;
        
        // Get box dimensions
        const width = box.metadata.dimensions.width;
        const height = box.metadata.dimensions.height;
        const depth = box.metadata.dimensions.depth;
        
        // Create corner handles
        const corners = [
            [-width/2, height/2, -depth/2], [width/2, height/2, -depth/2],
            [-width/2, height/2, depth/2], [width/2, height/2, depth/2],
            [-width/2, -height/2, -depth/2], [width/2, -height/2, -depth/2],
            [-width/2, -height/2, depth/2], [width/2, -height/2, depth/2]
        ];
        
        corners.forEach((corner, index) => {
            const handle = BABYLON.MeshBuilder.CreateSphere(`handle_${index}`, {diameter: handleSize}, this.scene);
            handle.position = box.position.add(new BABYLON.Vector3(corner[0], corner[1], corner[2]));
            
            const handleMat = new BABYLON.StandardMaterial(`handleMat_${index}`, this.scene);
            handleMat.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow handles
            handle.material = handleMat;
            
            this.editingHandles.push(handle);
        });
    }
    
    hideEditingHandles() {
        if (this.editingHandles) {
            this.editingHandles.forEach(handle => handle.dispose());
            this.editingHandles = [];
        }
    }
    
    deleteBox(boxId) {
        const boxIndex = this.annotationBoxes.findIndex(box => box.metadata.id === boxId);
        if (boxIndex >= 0) {
            if (this.selectedBox === this.annotationBoxes[boxIndex]) {
                this.hideEditingHandles();
                this.selectedBox = null;
            }
            this.annotationBoxes[boxIndex].dispose();
            this.annotationBoxes.splice(boxIndex, 1);
            this.updateObjectsList();
            console.log('🗑️ Deleted box:', boxId);
        }
    }
    
    async loadPresets() {
        try {
            // Use the server's IP for remote browser access
            const apiBaseUrl = this.getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/pointcloud/presets`);
            if (!response.ok) throw new Error('Failed to fetch presets');
            
            const data = await response.json();
            
            const select = document.getElementById('preset-select');
            if (select) {
                select.innerHTML = '';
                data.presets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = preset.id;
                    option.textContent = preset.name;
                    select.appendChild(option);
                });
                console.log('✅ Presets loaded successfully');
            }
        } catch (error) {
            console.error('❌ Failed to load presets:', error);
            // Add fallback preset
            const select = document.getElementById('preset-select');
            if (select) {
                select.innerHTML = '<option value="traffic_scene">🚦 Traffic Scene</option>';
            }
        }
    }
    
    getApiBaseUrl() {
        // Check if we're running on localhost or remote server
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8001';
        } else {
            // For remote access, use the server's actual IP
            return 'http://192.168.1.9:8001';
        }
    }
    
    async loadSelectedPreset() {
        const select = document.getElementById('preset-select');
        const preset = select ? select.value : 'traffic_scene';
        
        console.log(`🚀 Loading complete scene: ${preset}...`);
        
        try {
            const apiBaseUrl = this.getApiBaseUrl();
            console.log(`📡 API Base URL: ${apiBaseUrl}`);
            
            const url = `${apiBaseUrl}/api/scene/generate`;
            console.log(`📞 Making request to: ${url}`);
            
            const requestBody = {
                preset: preset,
                num_points: 8000
            };
            console.log('📦 Request body:', requestBody);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody)
            });
            
            console.log('📨 Response status:', response.status, response.statusText);
            console.log('🔗 CORS headers:', response.headers.get('access-control-allow-origin'));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const sceneData = await response.json();
            console.log('🎬 Complete scene data received:', {
                preset: sceneData.preset,
                scene_type: sceneData.scene_type,
                points: sceneData.point_cloud.points.length,
                has_image: !!sceneData.camera_image.image_data
            });
            
            // Store current scene data for other functions
            this.currentSceneData = sceneData;
            
            // Display point cloud
            this.displayPoints(sceneData.point_cloud.points);
            
            // Create camera image plane with the scene's image data
            this.createFrustumImagePlane(this.farCorners, sceneData.camera_image);
            
            console.log(`✅ Successfully loaded complete scene ${preset}`);
            console.log(`   - Point cloud: ${sceneData.point_cloud.points.length} points`);
            console.log(`   - Camera image: ${sceneData.camera_image.width}x${sceneData.camera_image.height}`);
            
        } catch (error) {
            console.error('❌ Scene Loading Error:', error.name, error.message);
            alert('Generate Scene failed: ' + error.message);
        }
    }
    
    displayPoints(points) {
        // Remove existing point cloud
        if (this.pointCloud) {
            this.pointCloud.dispose();
        }
        
        const pcs = new BABYLON.PointsCloudSystem('pcs', 1, this.scene);
        
        pcs.addPoints(points.length, (particle, i) => {
            const point = points[i];
            
            // Points come as [x, y, z, intensity] from backend
            // ISO 8855: x=forward, y=left, z=up
            // Our camera system: x=right, y=up, z=forward  
            // Mapping: ISO_x -> Babylon_z, ISO_y -> -Babylon_x, ISO_z -> Babylon_y
            particle.position = new BABYLON.Vector3(
                -point[1],  // ISO y (left) -> Babylon -x (screen left)
                point[2],   // ISO z (up) -> Babylon y (screen up)
                point[0]    // ISO x (forward) -> Babylon z (screen forward)
            );
            
            // Color by intensity
            const intensity = point[3] || 0.5;
            particle.color = new BABYLON.Color4(
                intensity, 
                intensity * 0.8, 
                intensity * 0.6, 
                1
            );
        });
        
        pcs.buildMeshAsync().then(() => {
            this.pointCloud = pcs.mesh;
            
            // Make points thicker/more visible
            if (this.pointCloud.material) {
                this.pointCloud.material.pointSize = 4.0; // Increase from default 1.0
            }
            
            console.log('✅ Point cloud rendered successfully');
        }).catch(error => {
            console.error('❌ Failed to render point cloud:', error);
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.annotationApp = new AnnotationApp();
});