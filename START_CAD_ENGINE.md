# 🚀 Enable 3D Viewing for STEP Files

Your `cone_clutch.stp` file is uploaded but showing a download button instead of 3D view. Here's how to fix it:

## Why You See the Download Button

The STEP file was uploaded **before** the CAD engine was running, so it wasn't converted to STL. STEP files need conversion to STL for browser 3D viewing.

---

## 🔧 Solution: Start the CAD Engine

### Option 1: Quick Fix - Re-upload the File (Recommended)

**Steps:**
1. Delete the current STEP file from the BOM item
2. Start Docker Desktop (see instructions below)
3. Start the CAD engine
4. Re-upload the STEP file
5. It will automatically convert to STL and show 3D view!

### Option 2: Manual Conversion Endpoint (No re-upload needed)

I can add an endpoint to manually trigger conversion of already-uploaded files.

---

## 📋 How to Start Docker CAD Engine

### Step 1: Start Docker Desktop

**Windows:**
1. Click Start menu
2. Search for "Docker Desktop"
3. Click to launch Docker Desktop
4. Wait for "Docker Desktop is running" status (bottom-left icon turns green)

**Check if Docker is running:**
```bash
docker --version
```

Should show: `Docker version 29.1.3, build f52814d` (or similar)

### Step 2: Build the CAD Engine Image

Open **Command Prompt** or **PowerShell** in the `mithran` folder:

```bash
cd cad-engine
docker build -t mithran-cad-engine .
```

This takes **5-10 minutes** the first time (downloads OpenCascade libraries).

### Step 3: Run the CAD Engine

```bash
docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine
```

### Step 4: Verify It's Running

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "opencascade": "pythonocc-core 7.7.2",
  "capabilities": ["STEP", "IGES", "STL"]
}
```

---

## 🎯 Now Upload Your STEP File

1. Go to your BOM item in the browser
2. Delete the old STEP file (if present)
3. Click "Upload 3D File"
4. Select `cone_clutch.stp`
5. Wait 5-30 seconds for conversion
6. **See the 3D model rotate!** 🎉

---

## 🐳 Alternative: Docker Compose (All Services Together)

If you want to run everything with Docker:

```bash
# From mithran folder
docker-compose up --build
```

This starts:
- CAD Engine on port 5000
- Backend on port 4000
- Frontend on port 3000

**Note:** You'll need to stop your current backend/frontend servers first:
- Close the terminal windows OR
- Press Ctrl+C in each terminal

---

## 🔍 Troubleshooting

### "Docker Desktop is not running"
→ Launch Docker Desktop application and wait for it to start

### "Cannot connect to Docker daemon"
→ Docker Desktop needs to be running (check system tray icon)

### "Port 5000 already in use"
→ Stop any other service on port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CAD Engine starts but conversion fails
→ Check Docker logs:
```bash
docker logs cad-engine
```

---

## ⚡ Quick Commands

**Check if CAD engine is running:**
```bash
curl http://localhost:5000/health
```

**Stop CAD engine:**
```bash
docker stop cad-engine
docker rm cad-engine
```

**Restart CAD engine:**
```bash
docker restart cad-engine
```

**View logs:**
```bash
docker logs -f cad-engine
```

---

## 📊 What Happens During Conversion

```
1. Upload cone_clutch.stp (1.2 MB)
      ↓
2. Frontend → Backend (file received)
      ↓
3. Backend uploads to Supabase Storage
      ↓
4. Backend detects .stp extension
      ↓
5. Backend sends to CAD Engine (localhost:5000)
      ↓
6. CAD Engine:
   - Parses STEP with OpenCascade
   - Converts B-Rep to triangular mesh
   - Exports binary STL (~3.5 MB)
      ↓
7. Backend receives STL buffer
      ↓
8. Backend uploads STL to Supabase
      ↓
9. Backend saves STL path to database
      ↓
10. Frontend displays 3D viewer with STL
      ↓
11. YOU SEE YOUR 3D MODEL! 🎉
```

**Timeline:** 5-30 seconds for typical CAD files

---

## ✅ After CAD Engine is Running

Your STEP files will:
- ✅ Automatically convert to STL on upload
- ✅ Show interactive 3D viewer
- ✅ Allow rotation, zoom, pan
- ✅ Display in full screen
- ✅ Show file metadata

No more download buttons! Just beautiful 3D models.

---

## 🎬 Next Steps

1. **Start Docker Desktop** (most important!)
2. **Build CAD engine:** `docker build -t mithran-cad-engine .`
3. **Run CAD engine:** `docker run -d -p 5000:5000 --name cad-engine mithran-cad-engine`
4. **Verify:** `curl http://localhost:5000/health`
5. **Re-upload STEP file** in the UI
6. **Watch it convert and display!**

---

Need help? Check:
- `DEPLOYMENT_STATUS.md` - Full system status
- `docs/CAD_ENGINE_SETUP.md` - Detailed CAD engine docs
- `cad-engine/README.md` - API reference

---

**Ready?** Start Docker Desktop now! 🚀
