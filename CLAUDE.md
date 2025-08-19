# 3D Point Cloud Annotation Tool - Development Guide

## 🎯 Project Goal
Build a generic 3D point cloud annotation tool using Babylon.js that can work with any point cloud and image data. This tool should allow users to create, edit, and manage 3D bounding box annotations and point segmentations.

## 📋 Implementation Phases

### Phase 1: Core Setup (30 minutes)
1. **Create Project Structure**
   ```
   3d-annotation-tool/
   ├── backend/
   │   ├── app.py
   │   └── requirements.txt
   ├── frontend/
   │   ├── index.html
   │   ├── js/
   │   │   └── app.js
   │   └── css/
   │       └── styles.css
   └── data/
       └── sample/
   ```

2. **Set up Flask Backend**
   - Basic Flask app with CORS
   - Endpoints for point cloud loading
   - Static file serving for frontend

3. **Initialize Babylon.js Scene**
   - Basic 3D scene setup
   - Camera and lighting
   - Canvas initialization

### Phase 2: Point Cloud Display (45 minutes)
1. **Backend Point Cloud Loader**
   ```python
   @app.route('/api/pointcloud/load', methods=['POST'])
   def load_pointcloud():
       # Load .ply, .pcd, or .bin files
       # Return points as JSON array
   ```

2. **Frontend Point System**
   ```javascript
   class PointCloudViewer {
       async loadPoints(url) {
           // Fetch points from backend
           // Create Babylon.js PointsCloudSystem
           // Apply colors based on intensity
       }
   }
   ```

### Phase 3: Bounding Box Tools (1 hour)
1. **Box Creation Tool**
   - Click-drag to create boxes
   - Visual feedback during creation
   - Wireframe rendering

2. **Box Editing**
   - Resize handles at corners
   - Rotation handle
   - Center position dragging

3. **Box Management**
   - List of annotations
   - Select/delete boxes
   - Update properties panel

### Phase 4: Point Segmentation (45 minutes)
1. **Inside/Outside Classification**
   - Calculate points inside each box
   - Color points by classification
   - Real-time updates

2. **Manual Selection Tools**
   - Brush selection tool
   - Rectangle selection in screen space
   - Add/remove from selection

### Phase 5: Data Persistence (30 minutes)
1. **Save Annotations**
   ```python
   @app.route('/api/annotations/save', methods=['POST'])
   def save_annotations():
       # Save to JSON file
       # Include boxes and segmentations
   ```

2. **Load Projects**
   - List saved projects
   - Load annotations with point cloud
   - Restore view state

### Phase 6: UI Polish (30 minutes)
1. **Toolbar and Controls**
   - Tool selection buttons
   - View mode switcher
   - Keyboard shortcuts

2. **Properties Panel**
   - Live update box dimensions
   - Label editing
   - Color coding

## 🚀 Quick Start Commands

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install backend dependencies
pip install flask flask-cors numpy

# 3. Generate sample data
python generate_sample_data.py

# 4. Start backend server
cd backend && python app.py

# 5. Open frontend (in new terminal)
cd frontend && python -m http.server 8080
# Navigate to http://localhost:8080
```

## 💻 Core Implementation Files

### `backend/app.py` - Minimal Flask Server
```python
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import numpy as np
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/pointcloud/load', methods=['POST'])
def load_pointcloud():
    # Dummy data for testing
    points = []
    for i in range(1000):
        points.append({
            'x': np.random.uniform(-10, 10),
            'y': np.random.uniform(-10, 10),
            'z': np.random.uniform(0, 5),
            'intensity': np.random.uniform(0, 1)
        })
    return jsonify({'points': points, 'total': len(points)})

@app.route('/api/annotations/<project_id>', methods=['GET', 'POST'])
def annotations(project_id):
    if request.method == 'POST':
        # Save annotations
        data = request.json
        with open(f'../data/{project_id}_annotations.json', 'w') as f:
            json.dump(data, f)
        return jsonify({'status': 'saved'})
    else:
        # Load annotations
        try:
            with open(f'../data/{project_id}_annotations.json', 'r') as f:
                data = json.load(f)
            return jsonify(data)
        except:
            return jsonify({'boxes': [], 'segmentations': []})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### `frontend/index.html` - Basic UI Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>3D Annotation Tool</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; font-family: Arial; }
        #renderCanvas { width: 100%; height: 100vh; }
        #toolbar { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; }
        button { margin: 5px; padding: 8px 15px; cursor: pointer; }
        #panel { position: absolute; right: 10px; top: 10px; width: 300px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px; }
        input, select { width: 100%; margin: 5px 0; padding: 5px; }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    <div id="toolbar">
        <button onclick="app.loadPointCloud()">Load Points</button>
        <button onclick="app.setTool('box')">Box Tool</button>
        <button onclick="app.setTool('select')">Select Tool</button>
        <button onclick="app.saveAnnotations()">Save</button>
    </div>
    
    <div id="panel">
        <h3>Properties</h3>
        <label>Label: <input type="text" id="label" value="object"></label>
        <label>X: <input type="number" id="x" step="0.1"></label>
        <label>Y: <input type="number" id="y" step="0.1"></label>
        <label>Z: <input type="number" id="z" step="0.1"></label>
        <label>Width: <input type="number" id="width" step="0.1" value="2"></label>
        <label>Height: <input type="number" id="height" step="0.1" value="2"></label>
        <label>Length: <input type="number" id="length" step="0.1" value="2"></label>
        
        <h3>Annotations</h3>
        <div id="annotation-list"></div>
    </div>
    
    <script src="js/app.js"></script>
</body>
</html>
```

### `frontend/js/app.js` - Core Application Logic
```javascript
class AnnotationApp {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = this.createScene();
        this.points = null;
        this.boxes = [];
        this.currentTool = 'box';
        this.selectedBox = null;
        
        this.setupInteraction();
        this.engine.runRenderLoop(() => this.scene.render());
        window.addEventListener('resize', () => this.engine.resize());
    }
    
    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        // Camera
        const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, 
            BABYLON.Vector3.Zero(), scene);
        camera.attachControl(this.canvas, true);
        camera.wheelPrecision = 50;
        
        // Light
        const light = new BABYLON.HemisphericLight('light', 
            new BABYLON.Vector3(0, 1, 0), scene);
        
        // Grid
        const grid = BABYLON.MeshBuilder.CreateGround('grid', 
            {width: 100, height: 100, subdivisions: 50}, scene);
        const gridMat = new BABYLON.StandardMaterial('gridMat', scene);
        gridMat.wireframe = true;
        gridMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        grid.material = gridMat;
        
        return scene;
    }
    
    async loadPointCloud() {
        const response = await fetch('http://localhost:5000/api/pointcloud/load', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({file: 'sample.ply'})
        });
        
        const data = await response.json();
        this.displayPoints(data.points);
    }
    
    displayPoints(points) {
        // Remove existing point cloud
        if (this.pointCloud) {
            this.pointCloud.dispose();
        }
        
        // Create point cloud system
        const pcs = new BABYLON.PointsCloudSystem('pcs', 1, this.scene);
        
        pcs.addPoints(points.length, (particle, i) => {
            const point = points[i];
            particle.position = new BABYLON.Vector3(point.x, point.z, point.y);
            
            // Color by intensity
            const intensity = point.intensity || 0.5;
            particle.color = new BABYLON.Color4(intensity, intensity, intensity, 1);
        });
        
        pcs.buildMeshAsync().then(() => {
            this.pointCloud = pcs.mesh;
            this.points = points;
            console.log(`Loaded ${points.length} points`);
        });
    }
    
    createBoundingBox(center, size) {
        const box = BABYLON.MeshBuilder.CreateBox('bbox', {
            width: size.x,
            height: size.y,
            depth: size.z
        }, this.scene);
        
        box.position = center;
        
        // Wireframe material
        const mat = new BABYLON.StandardMaterial('bboxMat', this.scene);
        mat.wireframe = true;
        mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        box.material = mat;
        
        // Metadata
        box.metadata = {
            type: 'bbox',
            label: document.getElementById('label').value,
            size: size,
            id: 'box_' + Date.now()
        };
        
        this.boxes.push(box);
        this.updateAnnotationList();
        
        return box;
    }
    
    setupInteraction() {
        let startPoint = null;
        
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (this.currentTool === 'box' && pointerInfo.event.button === 0) {
                        const pickResult = this.scene.pick(
                            this.scene.pointerX, 
                            this.scene.pointerY
                        );
                        if (pickResult.hit) {
                            startPoint = pickResult.pickedPoint;
                        }
                    }
                    break;
                    
                case BABYLON.PointerEventTypes.POINTERUP:
                    if (this.currentTool === 'box' && startPoint) {
                        const pickResult = this.scene.pick(
                            this.scene.pointerX,
                            this.scene.pointerY
                        );
                        if (pickResult.hit) {
                            const endPoint = pickResult.pickedPoint;
                            const center = startPoint.add(endPoint).scale(0.5);
                            const size = {
                                x: Math.abs(endPoint.x - startPoint.x) || 2,
                                y: 2, // Default height
                                z: Math.abs(endPoint.z - startPoint.z) || 2
                            };
                            this.createBoundingBox(center, size);
                        }
                        startPoint = null;
                    }
                    break;
            }
        });
    }
    
    setTool(tool) {
        this.currentTool = tool;
        console.log('Tool set to:', tool);
    }
    
    async saveAnnotations() {
        const annotations = {
            boxes: this.boxes.map(box => ({
                id: box.metadata.id,
                label: box.metadata.label,
                center: [box.position.x, box.position.y, box.position.z],
                size: [box.metadata.size.x, box.metadata.size.y, box.metadata.size.z],
                rotation: box.rotation.y
            }))
        };
        
        await fetch('http://localhost:5000/api/annotations/project1', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(annotations)
        });
        
        alert('Annotations saved!');
    }
    
    updateAnnotationList() {
        const list = document.getElementById('annotation-list');
        list.innerHTML = this.boxes.map(box => 
            `<div>${box.metadata.id}: ${box.metadata.label}</div>`
        ).join('');
    }
}

// Initialize app
const app = new AnnotationApp();
```

## 📦 Sample Data Generator

### `generate_sample_data.py`
```python
import numpy as np
import struct

def generate_sample_pointcloud(num_points=5000):
    """Generate a sample point cloud with a car-like shape"""
    points = []
    
    # Car body (rectangular)
    for i in range(num_points // 2):
        x = np.random.uniform(-2, 2)
        y = np.random.uniform(-1, 1)
        z = np.random.uniform(0.3, 1.5)
        intensity = np.random.uniform(0.5, 1.0)
        points.append([x, y, z, intensity])
    
    # Ground points
    for i in range(num_points // 2):
        x = np.random.uniform(-10, 10)
        y = np.random.uniform(-10, 10)
        z = np.random.uniform(-0.1, 0.1)
        intensity = np.random.uniform(0.1, 0.3)
        points.append([x, y, z, intensity])
    
    return np.array(points)

def save_as_ply(points, filename):
    """Save points as PLY file"""
    with open(filename, 'w') as f:
        # Header
        f.write("ply\n")
        f.write("format ascii 1.0\n")
        f.write(f"element vertex {len(points)}\n")
        f.write("property float x\n")
        f.write("property float y\n")
        f.write("property float z\n")
        f.write("property float intensity\n")
        f.write("end_header\n")
        
        # Points
        for p in points:
            f.write(f"{p[0]} {p[1]} {p[2]} {p[3]}\n")

if __name__ == "__main__":
    points = generate_sample_pointcloud()
    save_as_ply(points, "data/sample/sample_car.ply")
    print(f"Generated {len(points)} points")
```

## 🎯 Key Features to Implement

1. **Point Cloud Loading**
   - Support PLY, PCD, BIN formats
   - Efficient rendering with Babylon.js
   - Color by intensity/height/classification

2. **3D Bounding Boxes**
   - Create with click-drag
   - Edit with visual handles
   - Rotate around Z-axis
   - Copy/paste boxes

3. **Point Segmentation**
   - Points inside/outside boxes
   - Manual brush selection
   - Classification labels

4. **View Modes**
   - 3D perspective view
   - Top-down (BEV) view
   - Side view
   - Synchronized cameras

5. **Data Management**
   - Save/load projects
   - Export annotations (JSON, KITTI format)
   - Undo/redo support

## 🔧 Development Tips

1. **Start Simple**: Get basic point cloud display working first
2. **Use Babylon.js GUI**: For 2D overlay controls
3. **Optimize Rendering**: Use LOD for large point clouds
4. **Test with Real Data**: Use KITTI or nuScenes samples
5. **Keyboard Shortcuts**: Del to delete, Ctrl+S to save, etc.

## 📚 Useful Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [Point Cloud Library (PCL)](https://pointclouds.org/)
- [KITTI Dataset Format](http://www.cvlibs.net/datasets/kitti/eval_object.php?obj_benchmark=3d)

## 🚀 Next Steps After Basic Implementation

1. **Add Image Overlay**: Project 3D boxes onto 2D images
2. **Auto-Segmentation**: ML-based point segmentation
3. **Multi-Frame Support**: Track objects across frames
4. **Collaboration**: Real-time multi-user annotation
5. **Export to Training**: Generate ML training datasets

---

**Remember**: Focus on getting a working prototype first, then iterate and add features. The goal is to have a functional tool in 4-6 hours that can be extended later.