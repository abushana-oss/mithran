# 🎯 How to View Your STEP File in 3D

Your `cone_clutch.stp` is uploaded but showing a download button. Here's how to fix it in **2 simple ways**:

---

## ✅ Option 1: Manual Conversion (No Re-upload)

Your STEP file is already in Supabase. I've added a manual conversion endpoint.

### Steps:

**1. Start Docker Desktop**
- Open Docker Desktop application
- Wait until it says "Docker Desktop is running"

**2. Build & Run CAD Engine**
```bash
cd C:\Users\abush\OneDrive\Desktop\mithran\cad-engine
docker build -t mithran-cad-engine .
docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine
```

**3. Verify CAD Engine**
```bash
curl http://localhost:5000/health
```
Should return: `{"status": "healthy", ...}`

**4. Trigger Conversion via API**

Get your BOM item ID from the URL (it's in the browser address bar when viewing the item).

Then run:
```bash
curl -X POST http://localhost:4000/api/v1/bom-items/YOUR_BOM_ITEM_ID/convert-step \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**To get your JWT token:**
- Open browser DevTools (F12)
- Go to Application tab → Local Storage
- Find `supabase.auth.token`
- Copy the `access_token` value

**5. Refresh the Page**
- Go back to the BOM item in your browser
- Refresh the page
- **See your 3D model!** 🎉

---

## ✅ Option 2: Re-upload the File (Simpler)

If you have the original `cone_clutch.stp` file:

**1. Start Docker + CAD Engine** (same as above)
```bash
# Start Docker Desktop first
cd C:\Users\abush\OneDrive\Desktop\mithran\cad-engine
docker build -t mithran-cad-engine .
docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine
```

**2. Verify CAD Engine**
```bash
curl http://localhost:5000/health
```

**3. Delete Old File**
- Go to the BOM item in the browser
- Click the delete/remove button on the 3D file

**4. Re-upload**
- Click "Upload 3D File"
- Select `cone_clutch.stp`
- Wait 5-30 seconds
- **3D viewer appears automatically!** 🚀

---

## 🚀 Quick Docker Commands

**Check if CAD engine is running:**
```bash
curl http://localhost:5000/health
```

**Stop CAD engine:**
```bash
docker stop cad-engine
docker rm cad-engine
```

**View logs:**
```bash
docker logs -f cad-engine
```

**Rebuild after changes:**
```bash
docker stop cad-engine
docker rm cad-engine
docker build -t mithran-cad-engine .
docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine
```

---

## 🎬 What You'll See

**Before (Current):**
```
[Download STP File Button]
"Interactive 3D preview coming soon"
```

**After:**
```
[Interactive 3D Viewer]
- Rotate with left mouse
- Pan with right mouse
- Zoom with scroll wheel
- Fullscreen button
- Professional lighting
```

---

## 🔍 Troubleshooting

### "Docker Desktop is not running"
→ Launch Docker Desktop and wait for green status

### "Port 5000 already in use"
→ Stop any other service on port 5000:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "CAD engine not responding"
→ Check logs:
```bash
docker logs cad-engine
```

### "Conversion failed"
→ Make sure CAD engine health check passes:
```bash
curl http://localhost:5000/health
```

---

## 📝 Summary

**Easiest Path:**
1. ✅ Start Docker Desktop
2. ✅ Build CAD engine: `docker build -t mithran-cad-engine .`
3. ✅ Run CAD engine: `docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine`
4. ✅ Re-upload STEP file in browser
5. ✅ Enjoy 3D viewing!

**Total time:** 10-15 minutes (first build takes longer)

---

## 🎯 What Happens During Conversion

```
cone_clutch.stp (STEP file)
    ↓
CAD Engine (OpenCascade)
    ↓
Parses STEP geometry
    ↓
Converts to triangular mesh
    ↓
Exports binary STL
    ↓
Browser 3D Viewer (Three.js)
    ↓
Interactive 3D Model! 🎉
```

**Timeline:** 5-30 seconds depending on file complexity

---

**Ready?** Start Docker Desktop now and follow Option 1 or 2! 🚀
