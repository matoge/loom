# 3D Point Cloud Annotation Tool

A professional web-based 3D point cloud annotation tool built with Babylon.js and Flask, designed for autonomous vehicle dataset labeling and general 3D annotation tasks.

## Features

### Core Functionality
- **3D Point Cloud Visualization**: Efficient rendering of large point clouds with Babylon.js
- **3D Bounding Box Annotation**: Create, edit, and manage 3D bounding boxes in point clouds
- **2D-3D Synchronized Workflow**: Seamless transition between 3D and 2D annotation modes
- **Camera Frustum Visualization**: Visual representation of camera field of view in 3D space
- **ISO 8855 Coordinate System**: Automotive standard coordinate system (X=forward, Y=left positive, Z=up)

### 2D Annotation Features
- **Professional Sub-window Interface**: Bottom-right resizable annotation window
- **Zoom and Pan Controls**: 
  - Mouse wheel zoom (towards cursor position)
  - Middle mouse button drag for panning
  - Reset zoom button
- **2D Bounding Box Drawing**: Click and drag to create 2D annotations
- **Point Cloud Overlay**: Project 3D points onto 2D camera image

### Performance Optimizations
- **PyArrow Backend**: High-performance point cloud data processing
- **Efficient Rendering**: Babylon.js PointsCloudSystem for large datasets
- **Real-time Updates**: Dynamic point cloud and annotation updates

## Installation

### Prerequisites
- Python 3.8+
- Modern web browser (Chrome, Firefox, Edge)
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/3d-annotation-tool.git
cd 3d-annotation-tool
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

## Usage

### Starting the Application

1. Start the backend server:
```bash
cd backend
python app.py
```
The backend runs on port 5001 by default.

2. Start the frontend server (in a new terminal):
```bash
cd frontend
python -m http.server 8888
```

3. Open your browser and navigate to:
```
http://localhost:8888
```

### Basic Workflow

1. **Generate Scene**: Click "Generate Scene" to load sample point cloud and camera data
2. **3D Annotation**: 
   - Select Box tool
   - Click and drag on ground plane to create 3D bounding boxes
3. **2D Annotation**:
   - Click "2D" button or click on camera frustum to open 2D view
   - Draw bounding boxes on the camera image
   - Toggle point cloud overlay with "PC" button
4. **Navigation**:
   - 3D View: Mouse to rotate, scroll to zoom
   - 2D View: Mouse wheel to zoom, middle button drag to pan

### Keyboard Shortcuts
- `Del`: Delete selected box
- `Escape`: Deselect current tool

## Project Structure

```
3d-annotation-tool/
├── backend/
│   ├── app.py              # Flask backend server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   └── simple_fix.js  # Additional utilities
│   └── css/
│       └── styles.css     # Application styles
├── data/                  # Data directory (auto-created)
├── CLAUDE.md             # Development instructions
└── README.md            # This file
```

## Development

### Debug Functions

The application includes debug functions accessible from the browser console:

- `debugTest2D()` - Comprehensive 2D functionality test
- `testTogglePC()` - Toggle point cloud overlay
- `testToggle2D()` - Toggle 2D annotation window

### Architecture

- **Frontend**: Babylon.js for 3D rendering, vanilla JavaScript for UI
- **Backend**: Flask with PyArrow for high-performance data processing
- **Communication**: RESTful API with CORS support

## API Endpoints

### Scene Generation
- `POST /api/scene/generate`
  - Generates unified scene with point cloud and camera image
  - Parameters: `preset`, `num_points`

### Annotations
- `GET /api/annotations/<project_id>`
  - Retrieve saved annotations
- `POST /api/annotations/<project_id>`
  - Save annotations

## Configuration

### Backend Configuration
- Port: Set `PORT` environment variable (default: 5001)
- CORS: Configured for development (all origins allowed)

### Frontend Configuration
- API URL: Automatically detects local vs. remote access
- Canvas settings: Configurable in `app.js`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [Babylon.js](https://www.babylonjs.com/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by autonomous vehicle annotation tools

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend is running on correct port
2. **Point Cloud Not Loading**: Check browser console for errors
3. **2D Window Not Appearing**: Try `testToggle2D()` in console
4. **Bounding Boxes Not Drawing**: Check if tool is selected

### Support

For issues and questions, please open an issue on GitHub or check the browser console for debug information.