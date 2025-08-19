#!/usr/bin/env python
"""
High-performance sample data generator for 3D Annotation Studio
Creates realistic point cloud scenes with PyArrow optimization
"""

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import json
import os
from pathlib import Path
import argparse

class HighPerformanceSampleGenerator:
    """Generate realistic sample data with performance optimizations"""
    
    def __init__(self, output_dir="data/sample"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_all_presets(self):
        """Generate all available sample presets"""
        presets = [
            ("traffic_scene", 12000),
            ("urban_street", 15000), 
            ("parking_lot", 18000)
        ]
        
        print("🚀 Generating high-quality sample data...")
        
        for preset_name, num_points in presets:
            print(f"   Generating {preset_name} with {num_points:,} points...")
            
            # Generate point cloud data
            points_data = self._generate_preset_data(preset_name, num_points)
            
            # Save in multiple formats for flexibility
            self._save_as_parquet(points_data, f"{preset_name}.parquet")
            self._save_as_ply(points_data, f"{preset_name}.ply")
            self._save_as_json(points_data, f"{preset_name}.json")
            
            print(f"   ✅ {preset_name} complete")
        
        # Generate metadata file
        self._generate_metadata()
        
        print(f"🎉 Sample data generation complete! Check: {self.output_dir}")
    
    def _generate_preset_data(self, preset_name, num_points):
        """Generate specific preset data with realistic objects"""
        
        if preset_name == "traffic_scene":
            return self._generate_traffic_intersection(num_points)
        elif preset_name == "urban_street":
            return self._generate_urban_street(num_points)
        elif preset_name == "parking_lot":
            return self._generate_parking_lot(num_points)
        else:
            return self._generate_random_scene(num_points)
    
    def _generate_traffic_intersection(self, num_points):
        """Generate realistic traffic intersection with multiple traffic lights"""
        scene_objects = []
        all_points = []
        all_labels = []
        
        # Traffic lights at intersection corners
        traffic_lights = [
            {"pos": [8, -3, 4], "rotation": 0, "id": "traffic_light_north"},
            {"pos": [-8, 3, 4], "rotation": np.pi, "id": "traffic_light_south"},
            {"pos": [3, 8, 4], "rotation": -np.pi/2, "id": "traffic_light_east"},
            {"pos": [-3, -8, 4], "rotation": np.pi/2, "id": "traffic_light_west"}
        ]
        
        for tl in traffic_lights:
            points, bbox = self._create_traffic_light_detailed(tl["pos"], tl["rotation"])
            all_points.extend(points)
            all_labels.extend([tl["id"]] * len(points))
            
            scene_objects.append({
                "type": "traffic_light",
                "id": tl["id"],
                "position": tl["pos"],
                "rotation": tl["rotation"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Vehicles waiting at intersection
        vehicles = [
            {"pos": [5, -8, 0.8], "rot": 0, "type": "sedan", "id": "car_north_1"},
            {"pos": [2, -8, 0.8], "rot": 0, "type": "suv", "id": "car_north_2"},
            {"pos": [-5, 8, 0.8], "rot": np.pi, "type": "truck", "id": "car_south_1"},
            {"pos": [-2, 8, 0.8], "rot": np.pi, "type": "sedan", "id": "car_south_2"},
            {"pos": [8, 5, 0.8], "rot": -np.pi/2, "type": "sedan", "id": "car_east_1"},
            {"pos": [8, -5, 0.8], "rot": np.pi/2, "type": "suv", "id": "car_west_1"}
        ]
        
        for vehicle in vehicles:
            points, bbox = self._create_vehicle_detailed(
                vehicle["pos"], vehicle["rot"], vehicle["type"]
            )
            all_points.extend(points)
            all_labels.extend([vehicle["id"]] * len(points))
            
            scene_objects.append({
                "type": "vehicle",
                "id": vehicle["id"],
                "vehicle_type": vehicle["type"],
                "position": vehicle["pos"],
                "rotation": vehicle["rot"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Road surface with lane markings
        remaining_points = num_points - len(all_points)
        road_points = self._create_road_with_markings(remaining_points)
        all_points.extend(road_points)
        all_labels.extend(["road_surface"] * len(road_points))
        
        return {
            "points": np.array(all_points, dtype=np.float32),
            "labels": all_labels,
            "scene_objects": scene_objects,
            "scene_type": "traffic_intersection",
            "metadata": {
                "total_points": len(all_points),
                "num_objects": len(scene_objects),
                "scene_bounds": self._calculate_bounds(all_points)
            }
        }
    
    def _generate_urban_street(self, num_points):
        """Generate urban street scene with buildings and pedestrians"""
        scene_objects = []
        all_points = []
        all_labels = []
        
        # Buildings along the street
        buildings = [
            {"pos": [15, 0, 6], "size": [8, 20, 12], "id": "building_east"},
            {"pos": [-15, 0, 6], "size": [8, 20, 12], "id": "building_west"},
            {"pos": [0, 25, 4], "size": [30, 6, 8], "id": "building_north"}
        ]
        
        for building in buildings:
            points, bbox = self._create_building(building["pos"], building["size"])
            all_points.extend(points)
            all_labels.extend([building["id"]] * len(points))
            
            scene_objects.append({
                "type": "building",
                "id": building["id"],
                "position": building["pos"],
                "size": building["size"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Street furniture
        furniture = [
            {"pos": [6, -5, 1], "type": "lamp_post", "id": "lamp_1"},
            {"pos": [6, 0, 1], "type": "lamp_post", "id": "lamp_2"},
            {"pos": [6, 5, 1], "type": "lamp_post", "id": "lamp_3"},
            {"pos": [-6, -5, 1], "type": "lamp_post", "id": "lamp_4"},
            {"pos": [-6, 0, 1], "type": "lamp_post", "id": "lamp_5"},
            {"pos": [-6, 5, 1], "type": "lamp_post", "id": "lamp_6"},
            {"pos": [8, -8, 0.4], "type": "bench", "id": "bench_1"},
            {"pos": [-8, 8, 0.4], "type": "bench", "id": "bench_2"}
        ]
        
        for item in furniture:
            if item["type"] == "lamp_post":
                points, bbox = self._create_lamp_post(item["pos"])
            elif item["type"] == "bench":
                points, bbox = self._create_bench(item["pos"])
            
            all_points.extend(points)
            all_labels.extend([item["id"]] * len(points))
            
            scene_objects.append({
                "type": "street_furniture",
                "id": item["id"],
                "furniture_type": item["type"],
                "position": item["pos"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Parked cars
        parked_cars = [
            {"pos": [10, -10, 0.8], "rot": 0, "id": "parked_car_1"},
            {"pos": [10, -5, 0.8], "rot": 0, "id": "parked_car_2"},
            {"pos": [-10, 10, 0.8], "rot": np.pi, "id": "parked_car_3"}
        ]
        
        for car in parked_cars:
            points, bbox = self._create_vehicle_detailed(car["pos"], car["rot"], "sedan")
            all_points.extend(points)
            all_labels.extend([car["id"]] * len(points))
            
            scene_objects.append({
                "type": "parked_vehicle",
                "id": car["id"],
                "position": car["pos"],
                "rotation": car["rot"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Road and sidewalks
        remaining_points = num_points - len(all_points)
        road_points = self._create_urban_road_surface(remaining_points)
        all_points.extend(road_points)
        all_labels.extend(["road_surface"] * len(road_points))
        
        return {
            "points": np.array(all_points, dtype=np.float32),
            "labels": all_labels,
            "scene_objects": scene_objects,
            "scene_type": "urban_street",
            "metadata": {
                "total_points": len(all_points),
                "num_objects": len(scene_objects),
                "scene_bounds": self._calculate_bounds(all_points)
            }
        }
    
    def _generate_parking_lot(self, num_points):
        """Generate shopping mall parking lot scene"""
        scene_objects = []
        all_points = []
        all_labels = []
        
        # Parking lot with organized vehicle placement
        rows = 4
        spaces_per_row = 6
        
        vehicle_types = ["sedan", "suv", "truck", "compact"]
        
        for row in range(rows):
            for space in range(spaces_per_row):
                # Not all spaces are filled
                if np.random.random() < 0.75:  # 75% occupancy
                    x = (space - spaces_per_row/2) * 3
                    y = (row - rows/2) * 8
                    z = 0.8
                    
                    vehicle_type = np.random.choice(vehicle_types)
                    vehicle_id = f"parked_car_r{row}_s{space}"
                    
                    points, bbox = self._create_vehicle_detailed([x, y, z], 0, vehicle_type)
                    all_points.extend(points)
                    all_labels.extend([vehicle_id] * len(points))
                    
                    scene_objects.append({
                        "type": "parked_vehicle",
                        "id": vehicle_id,
                        "vehicle_type": vehicle_type,
                        "position": [x, y, z],
                        "rotation": 0,
                        "bounding_box": bbox,
                        "num_points": len(points)
                    })
        
        # Parking lot infrastructure
        infrastructure = [
            {"pos": [0, -20, 3], "type": "light_pole", "id": "pole_1"},
            {"pos": [10, -10, 3], "type": "light_pole", "id": "pole_2"},
            {"pos": [-10, -10, 3], "type": "light_pole", "id": "pole_3"},
            {"pos": [10, 10, 3], "type": "light_pole", "id": "pole_4"},
            {"pos": [-10, 10, 3], "type": "light_pole", "id": "pole_5"}
        ]
        
        for item in infrastructure:
            points, bbox = self._create_light_pole(item["pos"])
            all_points.extend(points)
            all_labels.extend([item["id"]] * len(points))
            
            scene_objects.append({
                "type": "infrastructure",
                "id": item["id"],
                "infrastructure_type": item["type"],
                "position": item["pos"],
                "bounding_box": bbox,
                "num_points": len(points)
            })
        
        # Parking lot surface
        remaining_points = num_points - len(all_points)
        surface_points = self._create_parking_surface(remaining_points)
        all_points.extend(surface_points)
        all_labels.extend(["parking_surface"] * len(surface_points))
        
        return {
            "points": np.array(all_points, dtype=np.float32),
            "labels": all_labels,
            "scene_objects": scene_objects,
            "scene_type": "parking_lot",
            "metadata": {
                "total_points": len(all_points),
                "num_objects": len(scene_objects),
                "scene_bounds": self._calculate_bounds(all_points)
            }
        }
    
    def _create_traffic_light_detailed(self, center, rotation):
        """Create detailed traffic light with pole and housing"""
        points = []
        x, y, z = center
        
        # Main support pole (vertical)
        pole_points = 80
        for i in range(pole_points):
            px = x + np.random.normal(0, 0.03)
            py = y + np.random.normal(0, 0.03)
            pz = np.random.uniform(0, z)
            intensity = 0.6 + np.random.uniform(0, 0.2)
            points.append([px, py, pz, intensity])
        
        # Traffic light housing (main box)
        housing_points = 60
        for i in range(housing_points):
            local_x = np.random.uniform(-0.15, 0.15)
            local_y = np.random.uniform(-0.08, 0.08)
            local_z = z + np.random.uniform(-0.2, 0.2)
            
            # Apply rotation
            world_x = x + (local_x * np.cos(rotation) - local_y * np.sin(rotation))
            world_y = y + (local_x * np.sin(rotation) + local_y * np.cos(rotation))
            
            intensity = 0.8 + np.random.uniform(0, 0.2)
            points.append([world_x, world_y, local_z, intensity])
        
        # Mounting arm (horizontal)
        arm_points = 40
        for i in range(arm_points):
            local_x = np.random.uniform(-0.8, 0)
            local_y = np.random.normal(0, 0.03)
            local_z = z + np.random.uniform(-0.05, 0.05)
            
            # Apply rotation
            world_x = x + (local_x * np.cos(rotation) - local_y * np.sin(rotation))
            world_y = y + (local_x * np.sin(rotation) + local_y * np.cos(rotation))
            
            intensity = 0.7 + np.random.uniform(0, 0.2)
            points.append([world_x, world_y, local_z, intensity])
        
        # Calculate bounding box
        points_array = np.array(points)
        bbox = {
            "center": [x, y, z],
            "size": [0.3, 0.2, 0.4],
            "rotation": rotation
        }
        
        return points, bbox
    
    def _create_vehicle_detailed(self, center, rotation, vehicle_type):
        """Create detailed vehicle point cloud"""
        points = []
        x, y, z = center
        
        # Vehicle dimensions based on type
        if vehicle_type == "sedan":
            length, width, height = 4.5, 1.8, 1.4
            point_density = 250
        elif vehicle_type == "suv":
            length, width, height = 4.8, 2.0, 1.8
            point_density = 300
        elif vehicle_type == "truck":
            length, width, height = 6.5, 2.4, 2.5
            point_density = 400
        else:  # compact
            length, width, height = 3.8, 1.6, 1.2
            point_density = 200
        
        for i in range(point_density):
            # Generate point within vehicle bounds
            local_x = np.random.uniform(-length/2, length/2)
            local_y = np.random.uniform(-width/2, width/2)
            local_z = np.random.uniform(0, height)
            
            # Apply rotation
            world_x = x + (local_x * np.cos(rotation) - local_y * np.sin(rotation))
            world_y = y + (local_x * np.sin(rotation) + local_y * np.cos(rotation))
            world_z = z + local_z
            
            # Vary intensity based on surface (windshield vs metal)
            if abs(local_x) > length * 0.3 and local_z > height * 0.5:
                intensity = 0.9 + np.random.uniform(0, 0.1)  # Windshield/windows
            else:
                intensity = 0.4 + np.random.uniform(0, 0.3)  # Body panels
            
            points.append([world_x, world_y, world_z, intensity])
        
        bbox = {
            "center": [x, y, z + height/2],
            "size": [length, width, height],
            "rotation": rotation
        }
        
        return points, bbox
    
    def _create_building(self, center, size):
        """Create building point cloud"""
        points = []
        x, y, z = center
        length, width, height = size
        
        num_points = int(length * width * height / 2)  # Density based on volume
        
        for i in range(num_points):
            px = x + np.random.uniform(-length/2, length/2)
            py = y + np.random.uniform(-width/2, width/2)
            pz = np.random.uniform(0, height)
            intensity = 0.3 + np.random.uniform(0, 0.4)  # Building materials
            points.append([px, py, pz, intensity])
        
        bbox = {
            "center": [x, y, z],
            "size": size,
            "rotation": 0
        }
        
        return points, bbox
    
    def _create_lamp_post(self, center):
        """Create street lamp post"""
        points = []
        x, y, z = center
        
        # Pole
        for i in range(30):
            px = x + np.random.normal(0, 0.02)
            py = y + np.random.normal(0, 0.02)
            pz = np.random.uniform(0, 4)
            intensity = 0.5 + np.random.uniform(0, 0.3)
            points.append([px, py, pz, intensity])
        
        # Lamp housing at top
        for i in range(15):
            px = x + np.random.uniform(-0.2, 0.2)
            py = y + np.random.uniform(-0.2, 0.2)
            pz = 4 + np.random.uniform(-0.1, 0.1)
            intensity = 0.8 + np.random.uniform(0, 0.2)
            points.append([px, py, pz, intensity])
        
        bbox = {
            "center": [x, y, 2],
            "size": [0.4, 0.4, 4],
            "rotation": 0
        }
        
        return points, bbox
    
    def _create_bench(self, center):
        """Create park bench"""
        points = []
        x, y, z = center
        
        for i in range(40):
            px = x + np.random.uniform(-0.8, 0.8)
            py = y + np.random.uniform(-0.2, 0.2)
            pz = z + np.random.uniform(0, 0.4)
            intensity = 0.4 + np.random.uniform(0, 0.3)
            points.append([px, py, pz, intensity])
        
        bbox = {
            "center": [x, y, z + 0.2],
            "size": [1.6, 0.4, 0.4],
            "rotation": 0
        }
        
        return points, bbox
    
    def _create_light_pole(self, center):
        """Create parking lot light pole"""
        points = []
        x, y, z = center
        
        # Tall pole
        for i in range(50):
            px = x + np.random.normal(0, 0.03)
            py = y + np.random.normal(0, 0.03)
            pz = np.random.uniform(0, z)
            intensity = 0.5 + np.random.uniform(0, 0.3)
            points.append([px, py, pz, intensity])
        
        # Multiple light fixtures
        for fixture in range(3):
            fixture_angle = fixture * 2 * np.pi / 3
            fx = x + 0.5 * np.cos(fixture_angle)
            fy = y + 0.5 * np.sin(fixture_angle)
            
            for i in range(10):
                px = fx + np.random.uniform(-0.1, 0.1)
                py = fy + np.random.uniform(-0.1, 0.1)
                pz = z + np.random.uniform(-0.2, 0.2)
                intensity = 0.9 + np.random.uniform(0, 0.1)
                points.append([px, py, pz, intensity])
        
        bbox = {
            "center": [x, y, z/2],
            "size": [1.0, 1.0, z],
            "rotation": 0
        }
        
        return points, bbox
    
    def _create_road_with_markings(self, num_points):
        """Create road surface with lane markings"""
        points = []
        
        for i in range(num_points):
            x = np.random.uniform(-20, 20)
            y = np.random.uniform(-20, 20)
            z = np.random.uniform(-0.05, 0.05)
            
            # Lane markings (higher intensity)
            if abs(x) < 0.1 or abs(y) < 0.1:  # Center lines
                intensity = 0.8 + np.random.uniform(0, 0.2)
            else:
                intensity = 0.15 + np.random.uniform(0, 0.15)  # Regular asphalt
            
            points.append([x, y, z, intensity])
        
        return points
    
    def _create_urban_road_surface(self, num_points):
        """Create urban road with sidewalks"""
        points = []
        
        for i in range(num_points):
            x = np.random.uniform(-25, 25)
            y = np.random.uniform(-25, 25)
            
            # Sidewalk areas (higher)
            if abs(x) > 12:
                z = np.random.uniform(0.15, 0.25)  # Raised sidewalk
                intensity = 0.4 + np.random.uniform(0, 0.2)
            else:
                z = np.random.uniform(-0.05, 0.05)  # Road level
                intensity = 0.15 + np.random.uniform(0, 0.15)
            
            points.append([x, y, z, intensity])
        
        return points
    
    def _create_parking_surface(self, num_points):
        """Create parking lot surface with markings"""
        points = []
        
        for i in range(num_points):
            x = np.random.uniform(-25, 25)
            y = np.random.uniform(-25, 25)
            z = np.random.uniform(-0.02, 0.02)
            
            # Parking space lines
            if (abs(x + 7.5) < 0.05 or abs(x + 4.5) < 0.05 or 
                abs(x + 1.5) < 0.05 or abs(x - 1.5) < 0.05 or
                abs(x - 4.5) < 0.05 or abs(x - 7.5) < 0.05):
                intensity = 0.9 + np.random.uniform(0, 0.1)  # White lines
            else:
                intensity = 0.2 + np.random.uniform(0, 0.2)  # Concrete
            
            points.append([x, y, z, intensity])
        
        return points
    
    def _calculate_bounds(self, points):
        """Calculate scene bounds"""
        points_array = np.array(points)
        return {
            "x_min": float(points_array[:, 0].min()),
            "x_max": float(points_array[:, 0].max()),
            "y_min": float(points_array[:, 1].min()),
            "y_max": float(points_array[:, 1].max()),
            "z_min": float(points_array[:, 2].min()),
            "z_max": float(points_array[:, 2].max())
        }
    
    def _save_as_parquet(self, data, filename):
        """Save as Parquet for high performance"""
        table = pa.table({
            'x': pa.array(data['points'][:, 0], type=pa.float32()),
            'y': pa.array(data['points'][:, 1], type=pa.float32()),
            'z': pa.array(data['points'][:, 2], type=pa.float32()),
            'intensity': pa.array(data['points'][:, 3], type=pa.float32()),
            'label': pa.array(data['labels'], type=pa.string())
        })
        
        pq.write_table(table, self.output_dir / filename)
    
    def _save_as_ply(self, data, filename):
        """Save as PLY format for compatibility"""
        with open(self.output_dir / filename, 'w') as f:
            points = data['points']
            
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
            for point in points:
                f.write(f"{point[0]} {point[1]} {point[2]} {point[3]}\n")
    
    def _save_as_json(self, data, filename):
        """Save as JSON with metadata"""
        output_data = {
            "points": data['points'].tolist(),
            "labels": data['labels'],
            "scene_objects": data['scene_objects'],
            "metadata": data['metadata']
        }
        
        with open(self.output_dir / filename, 'w') as f:
            json.dump(output_data, f, indent=2)
    
    def _generate_metadata(self):
        """Generate metadata file for all samples"""
        metadata = {
            "version": "1.0",
            "generator": "High-Performance Sample Generator",
            "formats": ["parquet", "ply", "json"],
            "presets": [
                {
                    "id": "traffic_scene",
                    "name": "🚦 Traffic Intersection",
                    "description": "Realistic intersection with traffic lights and vehicles",
                    "files": {
                        "parquet": "traffic_scene.parquet",
                        "ply": "traffic_scene.ply",
                        "json": "traffic_scene.json"
                    }
                },
                {
                    "id": "urban_street",
                    "name": "🏙️ Urban Street",
                    "description": "City street with buildings and infrastructure",
                    "files": {
                        "parquet": "urban_street.parquet",
                        "ply": "urban_street.ply", 
                        "json": "urban_street.json"
                    }
                },
                {
                    "id": "parking_lot",
                    "name": "🅿️ Parking Lot",
                    "description": "Shopping mall parking with organized vehicles",
                    "files": {
                        "parquet": "parking_lot.parquet",
                        "ply": "parking_lot.ply",
                        "json": "parking_lot.json"
                    }
                }
            ],
            "usage": {
                "parquet": "Fastest loading, use for production",
                "ply": "Standard format, good for visualization tools",
                "json": "Human readable, includes full metadata"
            }
        }
        
        with open(self.output_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Generate sample data for 3D Annotation Studio')
    parser.add_argument('--output', '-o', default='data/sample', help='Output directory')
    parser.add_argument('--preset', '-p', help='Generate specific preset only')
    
    args = parser.parse_args()
    
    generator = HighPerformanceSampleGenerator(args.output)
    
    if args.preset:
        print(f"Generating {args.preset} preset...")
        data = generator._generate_preset_data(args.preset, 10000)
        generator._save_as_parquet(data, f"{args.preset}.parquet")
        generator._save_as_ply(data, f"{args.preset}.ply")
        generator._save_as_json(data, f"{args.preset}.json")
        print(f"✅ {args.preset} complete")
    else:
        generator.generate_all_presets()

if __name__ == "__main__":
    main()