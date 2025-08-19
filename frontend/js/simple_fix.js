// Emergency fix for Generate Scene button
console.log('🔧 Loading simple fix...');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, setting up emergency button handler...');
    
    // Find the button by multiple methods
    const loadButton = document.getElementById('load-preset') || 
                      document.querySelector('[id="load-preset"]') ||
                      document.querySelector('button:contains("Generate Scene")');
    
    console.log('🎯 Button found:', !!loadButton);
    
    if (loadButton) {
        // Remove any existing listeners and add new one
        loadButton.onclick = async function(e) {
            e.preventDefault();
            console.log('🚀 EMERGENCY: Button clicked!');
            
            // Hide loading overlay if it exists
            const overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
            try {
                console.log('📡 Making direct API call...');
                
                const response = await fetch('http://192.168.1.9:8001/api/pointcloud/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({preset: 'traffic_scene', num_points: 2000})
                });
                
                console.log('📨 Response:', response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ SUCCESS! Got', data.points.length, 'points');
                    alert(`SUCCESS! Generated ${data.points.length} points in ${data.metadata.generation_time_ms}ms`);
                } else {
                    console.error('❌ HTTP Error:', response.status);
                    alert(`HTTP Error: ${response.status} ${response.statusText}`);
                }
                
            } catch (error) {
                console.error('❌ Network Error:', error);
                alert(`Network Error: ${error.message}`);
            }
        };
        
        console.log('✅ Emergency handler attached');
        
    } else {
        console.error('❌ Could not find Generate Scene button');
    }
});