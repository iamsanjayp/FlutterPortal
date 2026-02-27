-- Add Manual Grading columns to Submissions table
ALTER TABLE submissions
ADD COLUMN manual_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN final_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN manual_feedback TEXT,
ADD COLUMN manual_graded_by BIGINT DEFAULT NULL,
ADD COLUMN manual_graded_at DATETIME DEFAULT NULL,
ADD KEY manual_graded_by (manual_graded_by),
ADD CONSTRAINT submissions_ibfk_grader FOREIGN KEY (manual_graded_by) REFERENCES users (id);

-- Add UI Requirements column to Problems table
ALTER TABLE problems
ADD COLUMN ui_required_widgets JSON DEFAULT NULL COMMENT 'List of required widgets for Regex scoring';
