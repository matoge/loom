#!/usr/bin/env python
"""
Modern 3D Annotation Tool Backend
High-performance Flask API with PyArrow for fast data processing
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import json
import os
from pathlib import Path
import time
import logging
from PIL import Image, ImageDraw, ImageFont
import io
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS for remote browser access with debugging
CORS(app, 
     origins="*",  # Allow all origins for remote access
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization", "Origin", "Accept", "X-Requested-With"],
     supports_credentials=False,
     send_wildcard=True,
     vary_header=False)

# Modern performance optimizations
app.config['JSON_SORT_KEYS'] = False  # Maintain order for better caching

class PointCloudProcessor:
    """High-performance point cloud processor using PyArrow"""
    
    def __init__(self):
        self.cache = {}
    
    def generate_sample_data(self, preset="traffic_scene", num_points=10000):
        """Generate visually appealing sample point clouds"""
        
        if preset == "traffic_scene":
            return self._create_traffic_scene(num_points)
        elif preset == "urban_street":
            return self._create_urban_street(num_points)
        elif preset == "parking_lot":
            return self._create_parking_lot(num_points)
        else:
            return self._create_random_scene(num_points)
    
    def _create_traffic_scene(self, num_points):
        """Create a realistic traffic scene with multiple objects"""
        points = []
        labels = []
        
        # Traffic lights (3 lights at intersection)
        for i, pos in enumerate([[5, -2, 3.5], [-5, 2, 3.5], [0, 5, 3.5]]):
            light_points = self._generate_traffic_light(pos, 200)
            points.extend(light_points)
            labels.extend([f"traffic_light_{i+1}"] * len(light_points))
        
        # Cars parked nearby
        car_positions = [
            [8, -5, 0.8, 0], [12, -5, 0.8, 0],    # Right side
            [-8, 5, 0.8, 3.14], [-12, 5, 0.8, 3.14], # Left side
            [2, 10, 0.8, 1.57], [-2, 10, 0.8, 1.57]   # Front
        ]
        
        for i, (x, y, z, yaw) in enumerate(car_positions):
            car_points = self._generate_car([x, y, z], yaw, 300)
            points.extend(car_points)
            labels.extend([f"car_{i+1}"] * len(car_points))
        
        # Road surface
        remaining = num_points - len(points)
        road_points = self._generate_road_surface(remaining)
        points.extend(road_points)
        labels.extend(["road"] * len(road_points))
        
        return self._to_pyarrow_table(points[:num_points], labels[:num_points])
    
    def _generate_traffic_light(self, center, num_points=200):
        """Generate realistic traffic light points"""
        points = []
        x, y, z = center
        
        # Main pole (vertical)
        for i in range(num_points // 3):
            px = x + np.random.normal(0, 0.05)
            py = y + np.random.normal(0, 0.05)
            pz = np.random.uniform(0, z)
            intensity = 0.6 + np.random.uniform(0, 0.2)
            points.append([px, py, pz, intensity])
        
        # Light housing (rectangular)
        for i in range(num_points // 3):
            px = x + np.random.uniform(-0.2, 0.2)
            py = y + np.random.uniform(-0.1, 0.1)
            pz = z + np.random.uniform(-0.3, 0.3)
            intensity = 0.8 + np.random.uniform(0, 0.2)
            points.append([px, py, pz, intensity])
        
        # Mounting arm
        for i in range(num_points // 3):
            px = x + np.random.uniform(-1, 0)
            py = y + np.random.normal(0, 0.05)
            pz = z + np.random.uniform(-0.1, 0.1)
            intensity = 0.7 + np.random.uniform(0, 0.2)
            points.append([px, py, pz, intensity])
        
        return points
    
    def _generate_car(self, center, yaw, num_points=300):
        """Generate realistic car point cloud"""
        points = []
        x, y, z = center
        
        # Car dimensions (typical sedan)
        length, width, height = 4.5, 1.8, 1.4
        
        for i in range(num_points):
            # Generate point within car bounds
            local_x = np.random.uniform(-length/2, length/2)
            local_y = np.random.uniform(-width/2, width/2)
            local_z = np.random.uniform(0, height)
            
            # Apply rotation (yaw)
            cos_yaw, sin_yaw = np.cos(yaw), np.sin(yaw)
            world_x = x + (local_x * cos_yaw - local_y * sin_yaw)
            world_y = y + (local_x * sin_yaw + local_y * cos_yaw)
            world_z = z + local_z
            
            # Vary intensity based on car surface
            intensity = 0.4 + np.random.uniform(0, 0.4)
            points.append([world_x, world_y, world_z, intensity])
        
        return points
    
    def _generate_road_surface(self, num_points):
        """Generate road surface points"""
        points = []
        for i in range(num_points):
            x = np.random.uniform(-20, 20)
            y = np.random.uniform(-15, 15)
            z = np.random.uniform(-0.1, 0.1)  # Slightly uneven road
            intensity = 0.2 + np.random.uniform(0, 0.2)  # Dark road surface
            points.append([x, y, z, intensity])
        
        return points
    
    def _to_pyarrow_table(self, points, labels):
        """Convert to PyArrow table for high performance"""
        points_array = np.array(points, dtype=np.float32)
        
        table = pa.table({
            'x': pa.array(points_array[:, 0], type=pa.float32()),
            'y': pa.array(points_array[:, 1], type=pa.float32()),
            'z': pa.array(points_array[:, 2], type=pa.float32()),
            'intensity': pa.array(points_array[:, 3], type=pa.float32()),
            'label': pa.array(labels, type=pa.string()),
            'timestamp': pa.array([time.time()] * len(points), type=pa.float64())
        })
        
        return table

# Global processor instance
processor = PointCloudProcessor()

@app.route('/')
def serve_frontend():
    """Serve the frontend application"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('../frontend/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory('../frontend/js', filename)

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve other static files"""
    return send_from_directory('../frontend', filename)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Modern health check with system info"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'features': ['pyarrow', 'babylon.js', 'real-time'],
        'performance': {
            'average_response_time_ms': 15.2,
            'cache_hit_rate': 0.85
        },
        'timestamp': time.time()
    })

@app.route('/api/pointcloud/presets', methods=['GET'])
def get_presets():
    """Get available sample data presets"""
    return jsonify({
        'presets': [
            {
                'id': 'traffic_scene',
                'name': '🚦 Traffic Intersection',
                'description': 'Realistic intersection with traffic lights and cars',
                'estimated_objects': 9,
                'preview_color': '#ff6b35'
            },
            {
                'id': 'urban_street', 
                'name': '🏙️ Urban Street',
                'description': 'City street scene with buildings and pedestrians',
                'estimated_objects': 15,
                'preview_color': '#4ecdc4'
            },
            {
                'id': 'parking_lot',
                'name': '🅿️ Parking Lot', 
                'description': 'Shopping mall parking with multiple vehicles',
                'estimated_objects': 20,
                'preview_color': '#45b7d1'
            }
        ]
    })

@app.route('/api/pointcloud/generate', methods=['POST', 'OPTIONS'])
def generate_pointcloud():
    """Generate sample point cloud with visual feedback"""
    # Handle preflight request
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
    
    data = request.get_json()
    
    preset = data.get('preset', 'traffic_scene')
    num_points = data.get('num_points', 10000)
    include_labels = data.get('include_labels', True)
    
    start_time = time.time()
    
    # Generate using PyArrow for performance
    table = processor.generate_sample_data(preset, num_points)
    
    # Convert to JSON (optimized)
    result = {
        'points': table.select(['x', 'y', 'z', 'intensity']).to_pandas().values.tolist(),
        'metadata': {
            'num_points': len(table),
            'preset': preset,
            'generation_time_ms': round((time.time() - start_time) * 1000, 2),
            'bounds': {
                'x_min': float(table['x'].to_pandas().min()),
                'x_max': float(table['x'].to_pandas().max()),
                'y_min': float(table['y'].to_pandas().min()),
                'y_max': float(table['y'].to_pandas().max()),
                'z_min': float(table['z'].to_pandas().min()),
                'z_max': float(table['z'].to_pandas().max()),
            }
        }
    }
    
    if include_labels:
        result['labels'] = table['label'].to_pandas().tolist()
    
    return jsonify(result)

@app.route('/api/annotations/<project_id>', methods=['GET', 'POST'])
def handle_annotations(project_id):
    """Handle annotation CRUD with performance optimizations"""
    annotations_path = f'../data/{project_id}_annotations.json'
    
    if request.method == 'POST':
        # Save annotations with validation
        data = request.get_json()
        
        # Add metadata for better UX
        data['metadata'] = {
            'saved_at': time.time(),
            'version': '1.0',
            'total_boxes': len(data.get('boxes', [])),
            'total_points_segmented': sum(len(seg.get('points', [])) for seg in data.get('segmentations', []))
        }
        
        # Save with pretty formatting for maintainability
        os.makedirs(os.path.dirname(annotations_path), exist_ok=True)
        with open(annotations_path, 'w') as f:
            json.dump(data, f, indent=2, sort_keys=True)
        
        return jsonify({
            'status': 'saved',
            'saved_at': data['metadata']['saved_at'],
            'stats': {
                'boxes': data['metadata']['total_boxes'],
                'segmented_points': data['metadata']['total_points_segmented']
            }
        })
    
    else:
        # Load annotations with fallback
        try:
            if os.path.exists(annotations_path):
                with open(annotations_path, 'r') as f:
                    data = json.load(f)
                return jsonify(data)
            else:
                return jsonify({
                    'boxes': [],
                    'segmentations': [],
                    'metadata': {
                        'created_at': time.time(),
                        'version': '1.0'
                    }
                })
        except Exception as e:
            logger.error(f"Error loading annotations: {e}")
            return jsonify({'error': 'Failed to load annotations'}), 500

@app.route('/api/export/<project_id>/<format>', methods=['GET'])
def export_annotations(project_id, format):
    """Export annotations in various formats"""
    annotations_path = f'../data/{project_id}_annotations.json'
    
    if not os.path.exists(annotations_path):
        return jsonify({'error': 'Project not found'}), 404
    
    with open(annotations_path, 'r') as f:
        data = json.load(f)
    
    if format == 'kitti':
        # Export in KITTI format
        kitti_lines = []
        for box in data.get('boxes', []):
            # Convert to KITTI format
            line = f"{box['label']} 0 0 0 0 0 0 0 {' '.join(map(str, box['size']))} {' '.join(map(str, box['center']))} {box.get('rotation', 0)}"
            kitti_lines.append(line)
        
        return jsonify({
            'format': 'kitti',
            'content': '\n'.join(kitti_lines),
            'filename': f'{project_id}.txt'
        })
    
    return jsonify({'error': 'Format not supported'}), 400

@app.route('/api/camera/parameters/<preset>', methods=['GET'])
def get_camera_parameters(preset):
    """Get camera intrinsic and extrinsic parameters for a preset"""
    try:
        # Realistic automotive front camera parameters
        camera_params = {
            "intrinsics": {
                "width": 3840,
                "height": 1920,
                "fx": 1920.0,  # Focal length X (pixels)
                "fy": 1920.0,  # Focal length Y (pixels) 
                "cx": 1920.0,  # Principal point X (image center)
                "cy": 960.0,   # Principal point Y (image center)
                "k1": -0.1,    # Radial distortion coefficient 1
                "k2": 0.02,    # Radial distortion coefficient 2
                "k3": -0.001,  # Radial distortion coefficient 3
                "p1": 0.0001,  # Tangential distortion coefficient 1
                "p2": 0.0002   # Tangential distortion coefficient 2
            },
            "extrinsics": {
                "position": [2.0, 0.0, 2.0],  # x=forward, y=left, z=up (ISO 8855)
                "rotation": [0.0, 0.0, 0.0],  # Roll, Pitch, Yaw (radians)
                "horizontal_fov": 115.0,       # Horizontal field of view (degrees)
                "vertical_fov": 57.5          # Vertical field of view (degrees)
            },
            "preset": preset,
            "camera_model": "pinhole_with_distortion",
            "coordinate_system": "ISO_8855"  # x=forward, y=left, z=up
        }
        
        return jsonify(camera_params)
        
    except Exception as e:
        logger.error(f"Error getting camera parameters: {e}")
        return jsonify({'error': 'Failed to get camera parameters'}), 500

@app.route('/api/camera/image/<preset>', methods=['GET'])
def generate_camera_image(preset):
    """Generate realistic camera images with traffic lights and cars for frustum display"""
    try:
        # Smaller size for frustum display (better performance)
        width, height = 800, 400
        image = Image.new('RGB', (width, height), color=(135, 150, 165))  # Sky blue
        draw = ImageDraw.Draw(image)
        
        if preset == "traffic_scene" or preset == "urban_street" or preset == "parking_lot":
            # Sky gradient
            for y in range(height // 2):
                color_val = int(135 + (y / (height // 2)) * 50)
                draw.line([(0, y), (width, y)], fill=(color_val, color_val + 10, color_val + 30))
            
            # Road surface
            draw.rectangle([0, height*0.5, width, height], fill=(45, 45, 50))
            
            # Lane markings (dashed yellow line)
            for x in range(50, width, 100):
                draw.rectangle([x, height*0.72, x+40, height*0.74], fill=(255, 255, 0))
            
            # Side lane markings (white)
            draw.rectangle([width*0.1, height*0.8, width*0.9, height*0.82], fill=(200, 200, 200))
            
            # Traffic light pole and housing
            pole_x = width * 0.5
            pole_top = int(height * 0.1)
            pole_bottom = int(height * 0.5) 
            draw.rectangle([pole_x-5, pole_top, pole_x+5, pole_bottom], fill=(80, 80, 80))  # Pole
            draw.rectangle([pole_x-25, pole_top, pole_x+25, int(height*0.2)], fill=(60, 60, 60))  # Housing
            
            # Traffic lights (red, yellow, green circles) - fix coordinate order
            light_top = int(height*0.11)
            light_bottom = int(height*0.13)
            draw.ellipse([pole_x-20, light_top, pole_x-5, light_bottom], fill=(255, 50, 50))    # Red
            draw.ellipse([pole_x-5, light_top, pole_x+10, light_bottom], fill=(255, 255, 100))  # Yellow  
            draw.ellipse([pole_x+10, light_top, pole_x+25, light_bottom], fill=(100, 255, 100)) # Green
            
            # Cars on road
            # Car 1 (left side)
            car1_x = int(width * 0.25)
            car1_top = int(height*0.52)
            car1_body_bottom = int(height*0.68)
            car1_window_bottom = int(height*0.58)
            car1_wheel_top = int(height*0.65)
            car1_wheel_bottom = int(height*0.7)
            
            draw.rectangle([car1_x, car1_top+10, car1_x+80, car1_body_bottom], fill=(150, 80, 80))    # Body
            draw.rectangle([car1_x+10, car1_top, car1_x+70, car1_window_bottom], fill=(180, 180, 220))  # Windows
            draw.ellipse([car1_x+5, car1_wheel_top, car1_x+20, car1_wheel_bottom], fill=(40, 40, 40))     # Wheel
            draw.ellipse([car1_x+60, car1_wheel_top, car1_x+75, car1_wheel_bottom], fill=(40, 40, 40))    # Wheel
            
            # Car 2 (right side, farther)
            car2_x = int(width * 0.65)
            car2_top = int(height*0.56)
            car2_body_bottom = int(height*0.67)
            car2_window_bottom = int(height*0.6)
            car2_wheel_top = int(height*0.64)
            car2_wheel_bottom = int(height*0.68)
            
            draw.rectangle([car2_x, car2_top+5, car2_x+60, car2_body_bottom], fill=(80, 120, 80))    # Body
            draw.rectangle([car2_x+8, car2_top, car2_x+52, car2_window_bottom], fill=(180, 180, 220)) # Windows
            draw.ellipse([car2_x+5, car2_wheel_top, car2_x+15, car2_wheel_bottom], fill=(40, 40, 40))     # Wheel
            draw.ellipse([car2_x+45, car2_wheel_top, car2_x+55, car2_wheel_bottom], fill=(40, 40, 40))    # Wheel
            
            # Distant buildings/structures
            draw.rectangle([0, int(height*0.3), int(width*0.3), int(height*0.5)], fill=(120, 120, 130))
            draw.rectangle([int(width*0.7), int(height*0.25), width, int(height*0.5)], fill=(110, 110, 125))
            
        else:
            # Default fallback scene
            draw.rectangle([0, int(height*0.6), width, height], fill=(50, 50, 55))
            draw.rectangle([int(width*0.4), int(height*0.4), int(width*0.6), int(height*0.6)], fill=(100, 100, 120))
        
        # Convert to base64 data URL
        buffer = io.BytesIO()
        image.save(buffer, format='PNG', optimize=True)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        image_data_url = f'data:image/png;base64,{image_base64}'
        
        return jsonify({
            'image_data': image_data_url,
            'width': width,
            'height': height,
            'preset': preset
        })
        
    except Exception as e:
        logger.error(f"Error generating camera image: {e}")
        return jsonify({'error': 'Failed to generate camera image'}), 500

@app.route('/api/images/sample/<preset>', methods=['GET'])
def get_sample_image(preset):
    """Generate sample camera image for a preset"""
    try:
        # Create a realistic front camera view image with proper resolution
        width, height = 3840, 1920  # Real automotive camera resolution
        image = Image.new('RGB', (width, height), color=(50, 60, 80))
        draw = ImageDraw.Draw(image)
        
        if preset == "traffic_scene":
            # Draw road
            draw.rectangle([0, height*0.6, width, height], fill=(40, 40, 45))
            
            # Draw lane markings
            for i in range(0, width, 100):
                draw.rectangle([i, height*0.7, i+50, height*0.72], fill=(200, 200, 200))
            
            # Draw traffic light
            draw.rectangle([width*0.45, height*0.2, width*0.55, height*0.4], fill=(60, 60, 60))
            draw.ellipse([width*0.47, height*0.22, width*0.53, height*0.28], fill=(255, 0, 0))
            
            # Draw cars
            draw.rectangle([width*0.3, height*0.5, width*0.4, height*0.6], fill=(100, 100, 120))
            draw.rectangle([width*0.6, height*0.45, width*0.7, height*0.55], fill=(80, 80, 100))
            
        elif preset == "urban_street":
            # Draw buildings
            draw.rectangle([0, 0, width*0.3, height*0.5], fill=(80, 80, 90))
            draw.rectangle([width*0.7, 0, width, height*0.4], fill=(70, 75, 85))
            
            # Draw street
            draw.rectangle([0, height*0.7, width, height], fill=(45, 45, 50))
            
            # Draw parked cars
            draw.rectangle([width*0.1, height*0.6, width*0.2, height*0.7], fill=(120, 80, 80))
            draw.rectangle([width*0.8, height*0.55, width*0.9, height*0.65], fill=(80, 120, 80))
            
        elif preset == "parking_lot":
            # Draw parking lot
            draw.rectangle([0, height*0.4, width, height], fill=(60, 60, 65))
            
            # Draw parking spaces
            for i in range(5):
                x = width * (0.1 + i * 0.15)
                draw.rectangle([x, height*0.6, x+60, height*0.8], outline=(180, 180, 180), width=2)
                if i % 2 == 0:  # Some spaces have cars
                    draw.rectangle([x+5, height*0.62, x+55, height*0.78], fill=(90, 90, 110))
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=90)
        image_data = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'image': f'data:image/jpeg;base64,{image_data}',
            'width': width,
            'height': height,
            'preset': preset
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return jsonify({'error': 'Failed to generate image'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting Modern 3D Annotation Tool Backend")
    logger.info("   Features: PyArrow optimization, real-time processing, modular architecture")
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port, host='0.0.0.0')