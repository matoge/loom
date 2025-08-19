// Simple working 3D annotation app with ISO 8855 coordinate system
class SimpleAnnotationApp {
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
        
        // Camera aligned with ISO 8855 - looking towards +Z (which represents ISO +X forward)
        this.camera = new BABYLON.ArcRotateCamera(
            'camera', 
            0,           // Alpha: 0 = looking towards +Z (ISO +X forward)
            Math.PI / 3, // Beta: elevation angle
            25,          // Radius: distance from target
            BABYLON.Vector3.Zero(), 
            this.scene
        );
        
        this.camera.attachControl(this.canvas, true);
        this.camera.wheelPrecision = 50;
        
        // Basic lighting
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.8;
        
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
    
    startRenderLoop() {
        this.engine.runRenderLoop(() => this.scene.render());
        window.addEventListener('resize', () => this.engine.resize());
    }
    
    setupUI() {
        // Connect to existing UI elements
        const loadButton = document.getElementById('load-preset');
        if (loadButton) {
            loadButton.addEventListener('click', () => this.loadSelectedPreset());
        }
        
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
    }
    
    async loadPresets() {
        try {
            const response = await fetch('http://localhost:8001/api/pointcloud/presets');
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
    
    async loadSelectedPreset() {
        const select = document.getElementById('preset-select');
        const preset = select ? select.value : 'traffic_scene';
        
        console.log(`Loading preset: ${preset}...`);
        
        try {
            const response = await fetch('http://localhost:8001/api/pointcloud/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    preset: preset,
                    num_points: 8000
                })
            });
            
            if (!response.ok) throw new Error('Failed to generate point cloud');
            
            const data = await response.json();
            this.displayPoints(data.points);
            console.log(`✅ Loaded ${preset} with ${data.points.length} points`);
            
        } catch (error) {
            console.error('❌ Failed to load preset:', error);
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
            console.log('✅ Point cloud rendered successfully');
        }).catch(error => {
            console.error('❌ Failed to render point cloud:', error);
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.annotationApp = new SimpleAnnotationApp();
});