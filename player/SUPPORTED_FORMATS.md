# Supported Image Formats

## Panoramic Game Player - Supported File Types

The player supports all common web image formats through Three.js TextureLoader:

### ✅ Fully Supported Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| **JPEG** | `.jpg`, `.jpeg` | ✅ Recommended - Best compression, smaller files |
| **PNG** | `.png` | ✅ Supported - Larger files, lossless, supports transparency |
| **WebP** | `.webp` | ✅ Modern format - Better compression than JPEG |

### 📝 Format Recommendations

**For Panoramic Images:**
- **Recommended**: **JPEG (.jpg)**
  - Best compression ratio
  - Smaller file sizes (faster loading)
  - Quality: 80-90% is sufficient for panoramas
  - Example: 4096×2048 panorama = ~200-500KB

**When to use PNG:**
- Need transparency (rare for panoramas)
- Need lossless quality (usually overkill)
- Warning: Files will be 10-20x larger than JPEG

**When to use WebP:**
- Modern browsers only
- Better compression than JPEG
- Good balance of quality and size

### 🔧 How to Use Different Formats

1. **Place your panorama in** `public/assets/panoramas/`
2. **Update game.json** to point to the file:

```json
{
  "panorama": {
    "type": "equirectangular",
    "url": "/assets/panoramas/node-1.png"  // Change extension
  }
}
```

### 📏 Image Requirements

**Equirectangular Panoramas:**
- Aspect Ratio: **2:1** (width is 2× height)
- Resolution: 2048px - 8192px wide
- Recommended: 4096×2048 or 2048×1024
- Max File Size: 50MB (but keep under 5MB for web)

**Examples:**
```
✅ 4096×2048 (4K)
✅ 2048×1024 (2K)
✅ 8192×4096 (8K - large!)
❌ 1920×1080 (not 2:1 ratio)
❌ 4096×2048.5 (invalid ratio)
```

### 🎯 Best Practices

1. **Use JPEG for production**
   - Compress to 80-90% quality
   - Keep file size under 2MB per panorama
   - Faster loading = better user experience

2. **Use PNG only when necessary**
   - Your 5.9MB PNG could be ~300KB as JPEG
   - No visible quality loss for panoramas

3. **Optimize before deployment**
   - Use tools like ImageMagick, Sharp, or Photoshop
   - Example: `convert input.png -quality 85 output.jpg`

### 🐛 Troubleshooting

**"PNG not loading"**
- Check `game.json` has correct `.png` extension in URL
- Verify file is in `public/assets/panoramas/`
- Check browser console for 404 errors

**"Image looks blurry"**
- Resolution too low (use at least 2048×1024)
- JPEG quality too low (use 80%+)

**"Slow loading"**
- File too large (compress to under 2MB)
- Consider JPEG instead of PNG

### 📦 File Size Comparison

Same 4096×2048 panorama:
- **PNG**: 5-10 MB (lossless)
- **JPEG 90%**: 400-800 KB (visually identical)
- **JPEG 80%**: 200-400 KB (minimal quality loss)
- **WebP 90%**: 300-600 KB (modern browsers)

**Conclusion:** Use JPEG at 80-90% quality for best results! 🎯
