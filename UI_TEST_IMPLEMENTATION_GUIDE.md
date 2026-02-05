# UI Test System - Implementation Guide

## Overview
This document describes the UI-based testing system for Level 2A onwards, including the 50/50 grading split and resource management.

## Key Features Implemented

### 1. UI Test Portal Layout (✅ COMPLETED)
- **Improved Layout**: Changed from cramped 2x2 grid to scrollable vertical layout
- **Larger Code Editor**: 500px height dedicated editor space
- **Side-by-Side Comparison**: Expected output and student preview displayed side-by-side with 600px minimum height
- **Better Spacing**: All sections have proper padding and clear visual hierarchy
- **Scrollable**: Page is now scrollable to accommodate all content without cramping

### 2. 50/50 Grading Split (✅ COMPLETED)
The grading system for UI tests now splits into:
- **50% Automated**: Based on image comparison (pixel matching)
- **50% Manual**: Teacher evaluation of code quality, widget structure, best practices

#### Database Schema
New columns added to `test_session_submissions`:
- `manual_score` (INT): Manual grading score (0-100)
- `manual_graded_by` (BIGINT): Teacher/admin who graded
- `manual_graded_at` (DATETIME): When manual grading was completed
- `manual_feedback` (TEXT): Teacher's feedback/comments
- `final_score` (DECIMAL): Computed final score (automated * 0.5 + manual * 0.5)

#### Migration
Run the migration file to add manual grading support:
```sql
mysql -u root -p mobiledev_portal < mobiledev_portal_manual_grading.sql
```

#### Admin Manual Grading Interface
New admin page: **Manual Grading** (accessible from admin sidebar)
- View all UI submissions filtered by status (Pending, Graded, All)
- Side-by-side image comparison (Expected vs Student Output)
- View student code
- Assign manual score (0-100) and optional feedback
- See automated score, manual score, and computed final score

### 3. Font & Icon Rendering (✅ FIXED)
**Problem**: Fonts and Material Icons were not rendering properly in golden file screenshots.

**Solution**:
- Enhanced font loading in `template_ui/test/solution_test.dart`
- Added Material Icons font loading
- Increased render time with `pumpAndSettle(Duration(seconds: 2))`
- Better error handling for font loading issues
- Updated theme to use Material 3

**Template Location**: `backend/src/execution/flutter/template_ui/`

### 4. Resource Management for UI Tests (✅ IMPLEMENTED)
**Problem**: UIs often require images/icons from the internet, which students can't access during tests.

**Solutions Implemented**:
1. **Assets Directory**: Created `assets/` and `assets/images/` directories in UI test template
2. **Pubspec Configuration**: Updated `pubspec.yaml` to include assets
3. **Design Guidance**: UIs should be designed using:
   - Built-in Material Icons (no internet required)
   - Solid colors and gradients
   - Built-in Flutter widgets
   - Simple geometric shapes

**Best Practices for UI Design**:
- ✅ Use `Icons.xxx` from Material Icons
- ✅ Use `Colors.xxx` for solid colors
- ✅ Use `LinearGradient`, `RadialGradient` for effects
- ✅ Use Container, Card, ClipRRect for shapes
- ❌ Avoid `NetworkImage` or external URLs
- ❌ Avoid custom fonts that require downloading
- ⚠️ If images are needed, provide them as part of the problem assets

**For Problems Requiring Images**:
Teachers can upload reference images that include the images as part of the expected design. Students will replicate the layout without needing the actual image files.

### 5. Login Error Pages (✅ COMPLETED)
**Problem**: Schedule restriction errors showed as JSON responses instead of proper UI.

**Solution**: Created comprehensive error page component:
- `ErrorPage.jsx`: Reusable error page component
- Three error types: `schedule`, `unauthorized`, `inactive`
- Professional UI with icons, descriptions, and helpful messages
- Integrated into `LoginPage.jsx`

## File Structure

```
backend/
  src/
    execution/
      flutter/
        template_ui/          # UI test template
          assets/             # ✅ NEW: Asset directory
            images/           # ✅ NEW: Images directory
          fonts/              # Roboto fonts (auto-downloaded)
          lib/
            solution.dart     # Student code goes here
          test/
            solution_test.dart # ✅ UPDATED: Enhanced font/icon rendering
          pubspec.yaml        # ✅ UPDATED: Added assets config
    controllers/
      admin.controller.js   # ✅ NEW: getUISubmissions, submitManualGrade
    routes/
      admin.routes.js       # ✅ NEW: Manual grading routes

frontend/
  src/
    pages/
      UITestPage.jsx        # ✅ UPDATED: Improved layout
      ErrorPage.jsx         # ✅ NEW: Error page component
      LoginPage.jsx         # ✅ UPDATED: Uses ErrorPage
      admin/
        AdminManualGrading.jsx # ✅ NEW: Manual grading interface
        AdminLayout.jsx     # ✅ UPDATED: Added manual grading page

database/
  mobiledev_portal_manual_grading.sql # ✅ NEW: Migration for manual grading
```

## API Endpoints

### Manual Grading
```
GET  /api/admin/submissions/ui?filter=pending|graded|all
  - Get UI submissions for manual grading
  - Filter: pending (no manual score), graded (has manual score), all

POST /api/admin/submissions/:id/manual-grade
  - Submit manual grade for a submission
  - Body: { manualScore: 0-100, feedback: "optional text" }
  - Returns: { message, finalScore }
```

## Usage Instructions

### For Teachers/Admins

#### Creating UI Test Problems
1. Navigate to **Admin Portal → Question Bank**
2. Create new problem with:
   - Level: 2A or higher
   - Assessment Type: `UI_COMPARE`
   - Description: Clear UI requirements
   - Reference Image: Upload expected UI screenshot
   - Starter Code: Provide `Widget buildUI() { ... }` template

#### Designing UI Problems
**Good UI Problem Example**:
```dart
// Design a login card with:
// - Blue gradient background (Colors.blue[700] to Colors.blue[900])
// - White rounded card (borderRadius: 20)
// - Email and password TextFields
// - Green "Login" button (Colors.green)
// - "Forgot Password?" link in grey
Widget buildUI() {
  return Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [Colors.blue[700]!, Colors.blue[900]!],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ),
    ),
    child: Center(
      child: Card(
        // Student implements this
      ),
    ),
  );
}
```

#### Manual Grading Workflow
1. Go to **Admin Portal → Manual Grading**
2. Filter by **Pending Grading** to see ungraded submissions
3. Click **Grade** on a submission
4. Review:
   - Expected output (reference image)
   - Student output (generated preview)
   - Student code
   - Automated score (image comparison)
5. Assign manual score (0-100) based on:
   - Code quality and organization
   - Proper widget usage
   - Best practices (const constructors, etc.)
   - Code readability
6. Optional: Add feedback for student
7. Click **Submit Manual Grade**
8. System calculates: `Final Score = (Automated × 0.5) + (Manual × 0.5)`

### For Students

#### UI Test Interface
1. **Question Description**: Read requirements carefully
2. **Expected Output**: Reference image showing target UI
3. **Code Editor**: Write Flutter code (500px height)
4. **Run Preview**: Generate preview to see your output
5. **Your Output**: See generated UI preview
6. **Submit for Grading**: Submit when ready
   - Automated score shown immediately
   - Note: "Final grade includes 50% manual evaluation by teacher"

#### Tips for Success
- Use Material Design widgets and icons
- Follow color specifications exactly
- Pay attention to spacing and alignment
- Use `const` constructors where possible
- Comment your code for clarity
- Test with "Run Preview" before submitting

## Troubleshooting

### UI Preview Not Generating
1. Check Docker is running: `docker ps`
2. Check Flutter runner image exists: `docker images | grep flutter-runner`
3. Check backend logs for errors
4. Verify fonts downloaded: `backend/src/execution/flutter/template_ui/fonts/`

### Fonts Not Rendering
- Fonts are auto-downloaded on first UI test run
- Manual download: Run any UI preview once, fonts will be fetched
- Check console for "Downloaded template font" messages

### Manual Grading Page Not Showing
1. Run migration: `mysql -u root -p mobiledev_portal < mobiledev_portal_manual_grading.sql`
2. Refresh admin page
3. Check browser console for errors

### Assets Not Loading
- Ensure `assets/` directory exists in template_ui
- Check `pubspec.yaml` includes assets configuration
- Restart backend after modifying template

## Future Enhancements (Optional)

1. **Asset Upload System**: Allow teachers to upload images that students can reference
2. **Widget Structure Analysis**: Automated scoring of widget tree structure
3. **Batch Grading**: Grade multiple submissions at once
4. **Grading Rubric**: Predefined criteria for consistent grading
5. **Student Feedback View**: Allow students to see teacher feedback
6. **Code Diff View**: Show differences from reference solution

## Notes

- Level 1A, 1B, 1C: Coding-based (test cases)
- Level 2A onwards: UI-based (image comparison + manual grading)
- All UI tests use the 50/50 grading split
- Teachers must manually grade within reasonable timeframe
- Students see automated score immediately, final score after manual grading
