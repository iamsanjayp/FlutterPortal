# 🚀 Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
```bash
cd d:\MobileDevPortal
mysql -u root -p mobiledev_portal < mobiledev_portal_manual_grading.sql
```

**Expected Output**: "Migration completed: Manual grading support added to test_session_submissions"

**Verify Migration**:
```sql
USE mobiledev_portal;
DESCRIBE test_session_submissions;
-- Should see: manual_score, manual_graded_by, manual_graded_at, manual_feedback, final_score
```

---

### 2. Backend Dependencies
```bash
cd backend
# No new dependencies needed - all existing packages support new features
npm start
```

**Verify Backend Running**:
- Server starts on port 5000
- No compilation errors
- Check console: "Server running on port 5000"

---

### 3. Frontend Dependencies
```bash
cd frontend/frontend
# No new dependencies needed
npm run dev
```

**Verify Frontend Running**:
- Dev server starts (usually port 5173)
- No compilation errors
- Can access http://localhost:5173

---

## Post-Deployment Testing

### Test 1: UI Layout Improvements ✅
1. Login as student
2. Start a Level 2A+ test
3. **Expected**:
   - Large scrollable page
   - Code editor: 500px height
   - Sample and preview images: Side-by-side, 600px each
   - All sections properly spaced
   - Can scroll to see everything

---

### Test 2: Font & Icon Rendering ✅
1. In UI test, write code with Material Icons:
```dart
Widget buildUI() {
  return Center(
    child: Icon(Icons.favorite, size: 100, color: Colors.red),
  );
}
```
2. Click "Run Preview"
3. **Expected**:
   - Preview generates successfully
   - Icon renders clearly (not boxes/missing glyphs)
   - Fonts are clean and readable

---

### Test 3: 50/50 Grading System ✅

#### Part A: Student Submission
1. Login as student, start Level 2A test
2. Write UI code
3. Click "Submit for Grading"
4. **Expected**:
   - Automated score shows immediately (0-100%)
   - Message: "Automated Score (50% of total)"
   - Note: "Final grade includes 50% manual evaluation by teacher"

#### Part B: Manual Grading
1. Login as admin
2. Navigate to "Manual Grading" in sidebar
3. **Expected**: See new admin page
4. Click filter "Pending Grading"
5. **Expected**: See ungraded submissions
6. Click "Grade" on a submission
7. **Expected**: Modal opens with:
   - Expected output (left)
   - Student output (right)
   - Student code
   - Automated score
8. Enter manual score (0-100) and optional feedback
9. Click "Submit Manual Grade"
10. **Expected**:
    - Success message
    - Final score calculated: (automated × 0.5) + (manual × 0.5)
    - Submission moves to "Graded" filter

---

### Test 4: Resource Management ✅
1. Check template directory:
```bash
cd backend/src/execution/flutter/template_ui
ls -la assets/        # Should exist
ls -la assets/images/ # Should exist
cat pubspec.yaml      # Should include "assets:" section
```

2. In UI problem, use Material Icons (no external resources):
```dart
Widget buildUI() {
  return Column(
    children: [
      Icon(Icons.home),
      Icon(Icons.person),
      Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue, Colors.purple],
          ),
        ),
      ),
    ],
  );
}
```

3. **Expected**: All icons and colors render without internet

---

### Test 5: Error Pages ✅

#### Test A: Schedule Error
1. Ensure no active test schedule (Admin → Test Slots)
2. Logout
3. Try to login as student
4. **Expected**: Professional error page with:
   - Clock icon
   - "No Active Test Session" title
   - Clear message about scheduled slots
   - Blue info box with schedule information
   - "Back to Login" button

#### Test B: Inactive Account Error
1. Admin → Users → Deactivate a student account
2. Try to login as that student
3. **Expected**: Error page with:
   - Alert icon
   - "Account Inactive" message
   - Instructions to contact admin

---

## Verification Checklist

### Files Created ✅
- [ ] `mobiledev_portal_manual_grading.sql` - Database migration
- [ ] `frontend/frontend/src/pages/ErrorPage.jsx` - Error page component
- [ ] `frontend/frontend/src/pages/admin/AdminManualGrading.jsx` - Manual grading UI
- [ ] `UI_TEST_IMPLEMENTATION_GUIDE.md` - Comprehensive documentation
- [ ] `UPDATE_SUMMARY.md` - Summary of changes
- [ ] `DEPLOYMENT_CHECKLIST.md` - This file

### Files Modified ✅
- [ ] `frontend/frontend/src/pages/UITestPage.jsx` - Improved layout
- [ ] `frontend/frontend/src/pages/LoginPage.jsx` - Uses ErrorPage
- [ ] `frontend/frontend/src/pages/admin/AdminLayout.jsx` - Added manual grading page
- [ ] `backend/src/execution/flutter/template_ui/test/solution_test.dart` - Enhanced font loading
- [ ] `backend/src/execution/flutter/template_ui/pubspec.yaml` - Added assets
- [ ] `backend/src/execution/flutter/runFlutter.js` - Creates asset directories
- [ ] `backend/src/controllers/admin.controller.js` - Manual grading endpoints
- [ ] `backend/src/routes/admin.routes.js` - Manual grading routes

### Features Working ✅
- [ ] UI layout is spacious and scrollable
- [ ] Fonts and icons render correctly
- [ ] Students see automated score immediately (50%)
- [ ] Admin can assign manual scores (50%)
- [ ] Final score calculated correctly
- [ ] Assets directory exists in template
- [ ] Error pages display for login restrictions
- [ ] Manual grading page accessible in admin panel

---

## Troubleshooting

### Issue: "Column 'manual_score' doesn't exist"
**Solution**: Run database migration
```bash
mysql -u root -p mobiledev_portal < mobiledev_portal_manual_grading.sql
```

### Issue: Fonts still not rendering
**Solution**: 
1. Delete `backend/src/execution/flutter/template_ui/fonts/` directory
2. Restart backend
3. Run any UI preview - fonts will re-download automatically

### Issue: Manual Grading page shows 404
**Solution**:
1. Clear browser cache
2. Restart frontend dev server
3. Check browser console for errors

### Issue: UI preview not generating
**Solution**:
1. Check Docker is running: `docker ps`
2. Check Flutter runner image: `docker images | grep flutter-runner`
3. Check backend logs for detailed error
4. Look in `backend/src/execution/flutter/failed_runs/` for preserved failed runs

### Issue: Assets not loading in UI
**Solution**:
1. Verify assets directory exists: `backend/src/execution/flutter/template_ui/assets/`
2. Check pubspec.yaml includes assets configuration
3. Restart backend server

---

## Success Criteria

All features working when:
- ✅ Students can comfortably code, preview, and compare UIs
- ✅ Fonts and icons display correctly in previews
- ✅ Students see automated score immediately after submission
- ✅ Teachers can manually grade with image comparison
- ✅ Final scores calculated as 50/50 split
- ✅ Error pages show instead of JSON for login issues
- ✅ No external resources needed for UI designs

---

## Next Steps After Deployment

1. **Create Sample UI Problems**:
   - Design 3-5 UI problems for Level 2A
   - Upload reference images
   - Write clear descriptions

2. **Train Teachers**:
   - Show manual grading workflow
   - Explain grading criteria
   - Demonstrate image comparison

3. **Test with Students**:
   - Run pilot test with small group
   - Gather feedback on layout and usability
   - Adjust as needed

4. **Monitor System**:
   - Check failed_runs/ directory for errors
   - Monitor database for orphaned records
   - Track grading turnaround time

---

## Support Contacts

For issues:
1. Check this deployment checklist first
2. Review `UI_TEST_IMPLEMENTATION_GUIDE.md` for detailed info
3. Check browser console and backend logs
4. Review database migration status

---

**Deployment complete! All features implemented and ready for testing.** 🎉
