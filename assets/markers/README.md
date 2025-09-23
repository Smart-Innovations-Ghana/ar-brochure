# AR Markers

This directory contains the pattern files (.patt) for AR.js marker tracking. Each page in the brochure needs its own marker pattern.

## Required Pattern Files:

- `pattern-page1.patt` - Pattern file for page 1 video content
- `pattern-page2.patt` - Pattern file for page 2 3D model
- `pattern-page3.patt` - Pattern file for page 3 video content
- `pattern-page4.patt` - Pattern file for page 4 3D model
- `pattern-page5.patt` - Pattern file for page 5 video content
- `pattern-page6.patt` - Pattern file for page 6 3D model
- `pattern-page7.patt` - Pattern file for page 7 video content
- `pattern-page8.patt` - Pattern file for page 8 3D model

## How to Create Custom Markers:

1. Design Your Markers:

   - Create high-contrast black and white images
   - Keep designs simple but distinctive
   - Use thick lines and shapes
   - Make sure each marker is visually different
   - Recommended size: 512x512 pixels
   - Format: PNG or JPEG

2. Generate Pattern Files:
   a. Using the Online Marker Generator:

   - Visit: https://ar-js-org.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
   - Upload your marker image
   - Click "Generate"
   - Download the generated .patt file
   - Rename it to match the page number (e.g., pattern-page1.patt)
   - Place it in this directory

   b. Using the AR.js Marker Training CLI:

   ```bash
   # Install the tool
   npm install -g @ar-js-org/ar.js-markers

   # Generate a marker
   ar-js-markers create -i marker-image.png -o pattern-page1.patt
   ```

3. Test Your Markers:
   - Print the markers (recommended size: 3-5 inches)
   - Make sure they're on a flat surface
   - Good lighting is important
   - Avoid glossy paper (reduces glare)
   - Test each marker with your application

## Best Practices for Marker Design:

1. Asymmetric Patterns:

   - Makes detection more reliable
   - Helps determine orientation

2. High Contrast:

   - Use solid black and white
   - Avoid grayscale or colors
   - Sharp edges work better

3. Simple Shapes:

   - Geometric patterns work well
   - Avoid too many small details
   - Include some unique elements

4. Border:
   - Include a thick black border
   - Helps with quick detection
   - Recommended border width: 10% of marker size

## Troubleshooting:

If markers aren't being detected:

1. Check lighting conditions
2. Ensure marker is flat
3. Try different marker sizes
4. Increase contrast in marker design
5. Test with simpler patterns
6. Make sure camera has clear view
7. Check if pattern files match markers

## Production Tips:

1. Print Quality:

   - Use high-quality printer
   - Matte paper preferred
   - Maintain exact 1:1 scale
   - No stretching/distortion

2. Physical Size:

   - Recommended: 3-5 inches
   - Larger = better detection range
   - Keep consistent size across markers

3. Placement:
   - Flat, non-reflective surface
   - Good ambient lighting
   - No shadows across marker
   - Clear line of sight to camera
