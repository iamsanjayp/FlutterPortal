# Quick Start Guide - Database Import & React Native Compiler

## 🚨 Important: Fix Database Connection First

The backend requires a MySQL connection. Currently there's a password authentication issue.

### Step 1: Fix Database Password

1. Open `backend/.env`
2. Verify the `DB_PASSWORD` value matches your actual MySQL root password
3. Make sure there are no extra quotes or special characters

**Current value**: `DB_PASSWORD=sanjay@2006#`

If this is incorrect, update it to your actual password.

### Step 2: Import Database

#### Option A: Automated Import (Recommended)
```bash
cd backend
node scripts/importDatabase.js
```

This will:
- Connect to MySQL using your `.env` credentials
- Create the `mobiledev_portal` database
- Import all 10 tables
- Verify the setup

#### Option B: Manual Import via MySQL CLI
```bash
# Windows
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < import_all_tables.sql

# Or use the batch script
import_db.bat
```

#### Option C: MySQL Workbench
1. Open MySQL Workbench
2. Connect to localhost
3. Open `import_all_tables.sql`
4. Execute the script

### Step 3: Start Backend
```bash
cd backend
npm start
```

Expected output:
```
✅ Database connected successfully
Server running on port 5000
```

### Step 4: Start Frontend
```bash
cd frontend/frontend
npm run dev
```

### Step 5: Access React Native Playground

1. Open browser: http://localhost:5173
2. Login as admin
3. Click "RN Playground" in sidebar
4. Write React Native code
5. Click "Run" to see live preview!

---

## 📁 What Was Created

### Database Files
- `import_all_tables.sql` - Complete database schema with all tables
- `backend/sql/schema.sql` - Clean schema for programmatic import
- `backend/scripts/importDatabase.js` - Automated import script
- `import_db.bat` - Manual import helper

### Backend Files (React Native Compiler)
- `backend/src/execution/react-native/runReactNative.js` - Expo Snack integration
- `backend/src/controllers/reactNativeController.js` - API endpoints
- `backend/src/routes/reactNative.routes.js` - Routes
- `backend/src/app.js` - Updated with RN routes

### Frontend Files (React Native UI)
- `frontend/frontend/src/components/RNCodeEditor.jsx` - Monaco code editor
- `frontend/frontend/src/components/RNEmulator.jsx` - Mobile device emulator
- `frontend/frontend/src/pages/ReactNativePage.jsx` - Main playground page
- `frontend/frontend/src/api/reactNativeApi.js` - API client
- `frontend/frontend/src/pages/admin/AdminLayout.jsx` - Added RN Playground to menu

---

## 🎯 Features

### React Native Compiler
- ✅ Real-time code compilation using Expo Snack
- ✅ Live preview in iOS/Android emulator frames
- ✅ Monaco editor with syntax highlighting
- ✅ Light/Dark theme toggle
- ✅ Example templates (Basic & Interactive)
- ✅ Device switcher (iOS/Android)
- ✅ Orientation toggle (Portrait/Landscape)
- ✅ Direct link to open in Expo Snack
- ✅ QR code support for testing on real devices

### Database
- ✅ 10 tables with proper foreign keys
- ✅ Roles, Users, OAuth, Problems, Test Cases, Schedules, Sessions, Submissions, Results
- ✅ Complete schema for the coding portal

---

## 🐛 Troubleshooting

### Backend won't start - "Access denied for user 'root'"
**Solution**: 
1. Check MySQL is running: `Get-Service MySQL80`
2. Verify password in `.env`
3. Try connecting manually: `mysql -u root -p`
4. If password is wrong, update `.env` and restart

### "Cannot find module 'node-fetch'"
**Solution**:
```bash
cd backend
npm install
```

### Frontend shows blank emulator
**Solution**:
1. Make sure backend is running
2. Check browser console for errors
3. Try clicking example templates first
4. Verify API endpoint: http://localhost:5000/api/execute/react-native

### Expo Snack embed not loading
**Solution**:
- Check internet connection (Expo Snack is cloud-based)
- Wait a few seconds for compilation
- Try refreshing the page
- Check if expo.dev is accessible

---

## 📞 Need Help?

1. Check the `walkthrough.md` artifact for detailed documentation
2. Review `import_all_tables.sql` to see database structure
3. Test API endpoints manually:
   ```bash
   curl -X POST http://localhost:5000/api/execute/react-native \
     -H "Content-Type: application/json" \
     -d '{"code": "import React from \"react\";\nimport { View, Text } from \"react-native\";\n\nexport default () => <View><Text>Hello!</Text></View>"}'
   ```

---

## ✅ Success Checklist

- [ ] MySQL password fixed in `.env`
- [ ] Database imported successfully
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can login as admin
- [ ] "RN Playground" appears in sidebar
- [ ] Can load example code
- [ ] Clicking "Run" shows loading indicator
- [ ] Emulator displays React Native app
- [ ] Can switch between iOS/Android
- [ ] Can toggle orientation
- [ ] "Open in Expo" link works

Once all checked, you're ready to use the React Native compiler! 🎉
