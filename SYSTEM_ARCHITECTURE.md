# UI Testing System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. Login → 2. Start Test → 3. UI Test Page → 4. Submit → 5. See Automated Score
                                  ↓
                          ┌───────────────────┐
                          │  Scrollable Page  │
                          │                   │
                          │  ┌─────────────┐ │
                          │  │ Question    │ │  <- Clear description
                          │  │ Description │ │
                          │  └─────────────┘ │
                          │                   │
                          │  ┌─────────────┐ │
                          │  │ Code Editor │ │  <- 500px height
                          │  │   (Large)   │ │
                          │  └─────────────┘ │
                          │                   │
                          │  ┌──────┬──────┐ │
                          │  │Sample│Your  │ │  <- 600px each
                          │  │ UI   │Output│ │     Side-by-side
                          │  └──────┴──────┘ │
                          └───────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        TEACHER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. Admin Login → 2. Manual Grading → 3. Review Submission → 4. Assign Score
                        ↓
                 ┌─────────────────┐
                 │  Grading Modal  │
                 │                 │
                 │  ┌────┬────┐   │
                 │  │Exp │Std │   │  <- Image comparison
                 │  │out │out │   │
                 │  └────┴────┘   │
                 │                 │
                 │  Student Code   │  <- Review code quality
                 │                 │
                 │  Auto: XX%      │  <- See automated score
                 │  Manual: [___]  │  <- Input manual score
                 │  Final: YY%     │  <- Computed result
                 └─────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      GRADING CALCULATION                         │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │         AUTOMATED SCORE (50%)               │
    │  Based on image pixel comparison            │
    │  • Layout matching                          │
    │  • Color accuracy                           │
    │  • Widget positioning                       │
    │  ↓                                           │
    │  Score: 85%                                 │
    └─────────────────────────────────────────────┘
                    ↓ × 0.5 = 42.5%
                    
    ┌─────────────────────────────────────────────┐
    │         MANUAL SCORE (50%)                  │
    │  Teacher evaluates:                         │
    │  • Code quality                             │
    │  • Widget structure                         │
    │  • Best practices                           │
    │  • Code organization                        │
    │  ↓                                           │
    │  Score: 90%                                 │
    └─────────────────────────────────────────────┘
                    ↓ × 0.5 = 45.0%
                    
    ┌─────────────────────────────────────────────┐
    │         FINAL SCORE                         │
    │  42.5% + 45.0% = 87.5%                     │
    └─────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                               │
└─────────────────────────────────────────────────────────────────┘

test_session_submissions
├── id (Primary Key)
├── test_session_id
├── user_id
├── problem_id
├── code (Student's code)
├── status (PASS/FAIL)
├── score (Automated score 0-100)         ← Existing
├── preview_image_url                     ← Existing
├── match_percent                         ← Existing
├── manual_score (Manual score 0-100)     ← NEW ✅
├── manual_graded_by (Teacher ID)         ← NEW ✅
├── manual_graded_at (Timestamp)          ← NEW ✅
├── manual_feedback (Teacher comments)    ← NEW ✅
├── final_score (Computed 0-100)          ← NEW ✅
├── created_at
└── updated_at


┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL CONFIGURATION                           │
└─────────────────────────────────────────────────────────────────┘

Level 1A, 1B, 1C
├── Assessment Type: TEST_CASE
├── Testing Method: Unit tests
└── Grading: 100% automated (pass/fail on test cases)

Level 2A, 2B, 2C, 2D onwards
├── Assessment Type: UI_COMPARE
├── Testing Method: Image comparison + code review
└── Grading: 50% automated + 50% manual


┌─────────────────────────────────────────────────────────────────┐
│                  RESOURCE MANAGEMENT                             │
└─────────────────────────────────────────────────────────────────┘

Flutter Template Structure:
template_ui/
├── assets/               ← NEW: For images ✅
│   └── images/           ← NEW: Student resources ✅
├── fonts/                ← Auto-downloaded
│   ├── Roboto-Regular.ttf
│   └── Roboto-Bold.ttf
├── lib/
│   └── solution.dart     ← Student code
├── test/
│   └── solution_test.dart ← Enhanced font loading ✅
└── pubspec.yaml          ← Assets configured ✅

Recommended UI Design:
✅ Material Icons (Icons.xxx)
✅ Solid colors (Colors.xxx)
✅ Gradients (LinearGradient, RadialGradient)
✅ Built-in widgets (Container, Card, etc.)
❌ NetworkImage (no internet)
❌ Custom external fonts


┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

Login Attempt
     ↓
┌─────────────┐
│ Check       │
│ Schedule    │
└─────────────┘
     ↓
     ├── Active Schedule → ✅ Allow Login
     │
     ├── No Schedule → ⚠️ Show Error Page
     │                    - Clock icon
     │                    - "No Active Test Session"
     │                    - Schedule information
     │                    - Back to Login button
     │
     └── Inactive Account → ⚠️ Show Error Page
                             - Alert icon
                             - "Account Inactive"
                             - Contact admin message


┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘

Student Endpoints:
POST /api/execute/flutter/ui-preview
  ↳ Generate UI preview from code
  
POST /api/execute/flutter/ui-submit
  ↳ Submit UI for automated grading
  ↳ Returns: automated score, status

Admin Endpoints (NEW):
GET  /api/admin/submissions/ui?filter=pending|graded|all
  ↳ Get UI submissions for manual grading
  
POST /api/admin/submissions/:id/manual-grade
  ↳ Submit manual grade
  ↳ Body: { manualScore: 0-100, feedback: "..." }
  ↳ Returns: { finalScore }


┌─────────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT SEQUENCE                             │
└─────────────────────────────────────────────────────────────────┘

1. Run Database Migration
   mysql -u root -p mobiledev_portal < mobiledev_portal_manual_grading.sql
   
2. Restart Backend
   cd backend && npm start
   
3. Restart Frontend
   cd frontend/frontend && npm run dev
   
4. Test Each Feature
   ✓ UI Layout (scrollable, spacious)
   ✓ Font Rendering (Material Icons)
   ✓ Automated Grading (immediate)
   ✓ Manual Grading (admin interface)
   ✓ Error Pages (professional UI)
   
5. Create Test Problems
   Level 2A with reference images
   
6. Train Teachers
   Show manual grading workflow


┌─────────────────────────────────────────────────────────────────┐
│                  SUCCESS METRICS                                 │
└─────────────────────────────────────────────────────────────────┘

✅ Students can see code and previews clearly
✅ No cramped or overlapping UI elements
✅ Fonts render correctly in all previews
✅ Students receive immediate automated feedback
✅ Teachers can efficiently grade submissions
✅ Fair grading with code quality consideration
✅ Professional error messages for users
✅ System supports asset-free UI designs
