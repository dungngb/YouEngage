# UAT Test Cases — Phase 7

## A1: Task Lock (PENDING_REVIEW / APPROVED)

### TC-A1-01: Cannot edit task in PENDING_REVIEW
- **Precondition:** Task is PENDING_REVIEW (after preparer signoff)
- **Action:** Call updateTask() with new title
- **Expected:** Error "Task đang ở trạng thái Chờ duyệt — không thể chỉnh sửa"
- **Result:** PASS

### TC-A1-02: Cannot change status of PENDING_REVIEW task manually
- **Precondition:** Task is PENDING_REVIEW
- **Action:** Call updateTaskStatus() to set IN_PROGRESS
- **Expected:** Error mentioning "Chờ duyệt — không thể thay đổi trạng thái thủ công"
- **Result:** PASS

### TC-A1-03: Cannot edit task in APPROVED
- **Precondition:** Task is APPROVED (after reviewer signoff)
- **Action:** Call updateTask() with new title
- **Expected:** Error "Task đang ở trạng thái Đã duyệt — không thể chỉnh sửa"
- **Result:** PASS

### TC-A1-04: Cannot change status of APPROVED task manually
- **Precondition:** Task is APPROVED
- **Action:** Call updateTaskStatus() to set TODO
- **Expected:** Error mentioning "Đã duyệt — không thể thay đổi trạng thái thủ công"
- **Result:** PASS

### TC-A1-05: Cannot delete task in PENDING_REVIEW
- **Precondition:** Task is PENDING_REVIEW
- **Action:** Call deleteTask()
- **Expected:** Error "Không thể xóa task đang trong quy trình signoff"
- **Result:** PASS

### TC-A1-06: Cannot delete task in APPROVED
- **Precondition:** Task is APPROVED
- **Action:** Call deleteTask()
- **Expected:** Error "Không thể xóa task đang trong quy trình signoff"
- **Result:** PASS

### TC-A1-07: File upload hidden for PENDING_REVIEW task (UI)
- **Precondition:** Task is PENDING_REVIEW, user has edit rights
- **Action:** View task detail page
- **Expected:** File upload button not visible
- **Result:** PASS

### TC-A1-08: File delete hidden for PENDING_REVIEW task (UI)
- **Precondition:** Task is PENDING_REVIEW with attachments
- **Action:** View task detail page
- **Expected:** Delete button not visible on attachments
- **Result:** PASS

## A1-Reopen: Reopen Task

### TC-A1-09: Manager can reopen APPROVED task with reason
- **Precondition:** Task is APPROVED, user is Manager
- **Action:** Click "Mở lại task", enter reason, confirm
- **Expected:** Task moves to IN_PROGRESS, signoff record created, audit log entry "task.reopen"
- **Result:** PASS

### TC-A1-10: Manager can reopen PENDING_REVIEW task with reason
- **Precondition:** Task is PENDING_REVIEW, user is Manager
- **Action:** Click "Mở lại task", enter reason, confirm
- **Expected:** Task moves to IN_PROGRESS
- **Result:** PASS

### TC-A1-11: Reopen without reason fails
- **Precondition:** Task is APPROVED, user is Manager
- **Action:** Click "Mở lại task", leave reason empty, confirm
- **Expected:** Error "Vui lòng nhập lý do mở lại task"
- **Result:** PASS

### TC-A1-12: Auditor cannot reopen task
- **Precondition:** Task is APPROVED, user is Auditor
- **Action:** View task detail page
- **Expected:** Reopen button not visible
- **Result:** PASS

### TC-A1-13: Cannot reopen task in non-signoff status
- **Precondition:** Task is IN_PROGRESS
- **Action:** Call reopenTask() directly
- **Expected:** Error "Chỉ có thể mở lại task đang Chờ duyệt hoặc Đã duyệt"
- **Result:** PASS

## A2: Rework Loop

### TC-A2-01: Preparer signoff only from COMPLETED
- **Precondition:** Task is COMPLETED
- **Action:** Call preparerSignoff()
- **Expected:** Success, task moves to PENDING_REVIEW
- **Result:** PASS

### TC-A2-02: Preparer signoff from REJECTED fails
- **Precondition:** Task is REJECTED (after reviewer reject)
- **Action:** Call preparerSignoff()
- **Expected:** Error "Task phải ở trạng thái Hoàn thành... Vui lòng chuyển task về Hoàn thành sau khi rework xong."
- **Result:** PASS

### TC-A2-03: Full rework flow
- **Precondition:** Task is REJECTED
- **Action:** Change status to COMPLETED → preparer signoff → reviewer approve
- **Expected:** Task goes REJECTED → COMPLETED → PENDING_REVIEW → APPROVED
- **Result:** PASS

### TC-A2-04: REJECTED task shows guidance message (UI)
- **Precondition:** Task is REJECTED
- **Action:** View task detail page
- **Expected:** Shows "Sau khi rework xong, chuyển trạng thái về Hoàn thành" message
- **Result:** PASS

### TC-A2-05: REJECTED task allows status change to COMPLETED
- **Precondition:** Task is REJECTED
- **Action:** Use TaskStatusSelect to change to COMPLETED
- **Expected:** Status changes to COMPLETED, preparer signoff button appears
- **Result:** PASS

## B1: Planning Gate (ACTIVE → FIELDWORK)

### TC-B1-01: Cannot enter FIELDWORK without description
- **Precondition:** Engagement ACTIVE, description is empty
- **Action:** Transition to FIELDWORK
- **Expected:** Error including "Mục tiêu (description) không được để trống"
- **Result:** PASS

### TC-B1-02: Cannot enter FIELDWORK without scope
- **Precondition:** Engagement ACTIVE, scope is empty
- **Action:** Transition to FIELDWORK
- **Expected:** Error including "Phạm vi (scope) không được để trống"
- **Result:** PASS

### TC-B1-03: Cannot enter FIELDWORK without manager member
- **Precondition:** Engagement ACTIVE, no manager-role members
- **Action:** Transition to FIELDWORK
- **Expected:** Error including "phải có ít nhất 1 thành viên với vai trò Manager"
- **Result:** PASS

### TC-B1-04: Cannot enter FIELDWORK without auditor member
- **Precondition:** Engagement ACTIVE, no auditor-role members
- **Action:** Transition to FIELDWORK
- **Expected:** Error including "phải có ít nhất 1 Auditor"
- **Result:** PASS

### TC-B1-05: Cannot enter FIELDWORK without tasks
- **Precondition:** Engagement ACTIVE, no tasks
- **Action:** Transition to FIELDWORK
- **Expected:** Error including "phải có ít nhất 1 task"
- **Result:** PASS

### TC-B1-06: Multiple validation errors shown together
- **Precondition:** Engagement ACTIVE, missing description + scope + tasks
- **Action:** Transition to FIELDWORK
- **Expected:** Error with all 3 issues listed
- **Result:** PASS

### TC-B1-07: Successful ACTIVE → FIELDWORK with all conditions met
- **Precondition:** Engagement ACTIVE, has description, scope, manager, auditor, ≥1 task
- **Action:** Transition to FIELDWORK
- **Expected:** Success
- **Result:** PASS

## B2: Report Issuance Gate (FINAL → ISSUED)

### TC-B2-01: Cannot issue report when engagement not REPORTING
- **Precondition:** Report FINAL, engagement is FIELDWORK
- **Action:** Transition report to ISSUED
- **Expected:** Error including "Engagement phải ở trạng thái REPORTING"
- **Result:** PASS

### TC-B2-02: Cannot issue report when tasks not all APPROVED
- **Precondition:** Report FINAL, engagement REPORTING, 1 task still IN_PROGRESS
- **Action:** Transition report to ISSUED
- **Expected:** Error including "task chưa được duyệt"
- **Result:** PASS

### TC-B2-03: Cannot issue report when no tasks exist
- **Precondition:** Report FINAL, engagement REPORTING, 0 tasks
- **Action:** Transition report to ISSUED
- **Expected:** Error including "phải có ít nhất 1 task"
- **Result:** PASS

### TC-B2-04: Successful report issuance with all conditions met
- **Precondition:** Report FINAL, engagement REPORTING, all tasks APPROVED
- **Action:** Transition report to ISSUED
- **Expected:** Success, report permanently locked
- **Result:** PASS

## B3: Rollback Reason

### TC-B3-01: Engagement backward transition requires reason
- **Precondition:** Engagement FIELDWORK
- **Action:** Click "Quay về" → leave reason empty → confirm
- **Expected:** Error "Vui lòng nhập lý do"
- **Result:** PASS

### TC-B3-02: Engagement backward transition with reason succeeds
- **Precondition:** Engagement FIELDWORK
- **Action:** Click "Quay về" → enter reason → confirm
- **Expected:** Success, audit log shows `engagement.status_rollback` with reason
- **Result:** PASS

### TC-B3-03: Report backward transition requires reason
- **Precondition:** Report REVIEW
- **Action:** Click "← Bản nháp" → leave reason empty → confirm
- **Expected:** Error "Vui lòng nhập lý do"
- **Result:** PASS

### TC-B3-04: Report backward transition with reason succeeds
- **Precondition:** Report REVIEW
- **Action:** Click "← Bản nháp" → enter reason → confirm
- **Expected:** Success, audit log shows `report.status_rollback` with reason
- **Result:** PASS

### TC-B3-05: Forward transitions do not require reason
- **Precondition:** Engagement DRAFT
- **Action:** Click "Bắt đầu chuẩn bị"
- **Expected:** Success without reason prompt
- **Result:** PASS

## C: Audit Log

### TC-C-01: task.reopen appears in activity log
- **Precondition:** Manager reopens an APPROVED task
- **Action:** View activity log
- **Expected:** Shows "Mở lại task" with reason in details
- **Result:** PASS

### TC-C-02: engagement.status_rollback appears in activity log
- **Precondition:** Manager rolls back engagement from FIELDWORK to ACTIVE
- **Action:** View activity log
- **Expected:** Shows "Quay lại trạng thái engagement" with reason
- **Result:** PASS

### TC-C-03: report.status_rollback appears in activity log
- **Precondition:** Manager rolls back report from REVIEW to DRAFT
- **Action:** View activity log
- **Expected:** Shows "Quay lại trạng thái báo cáo" with reason
- **Result:** PASS

---

## Summary

| Category | Tests | Pass | Fail |
|----------|-------|------|------|
| A1: Task Lock | 8 | 8 | 0 |
| A1-Reopen | 5 | 5 | 0 |
| A2: Rework Loop | 5 | 5 | 0 |
| B1: Planning Gate | 7 | 7 | 0 |
| B2: Report Gate | 4 | 4 | 0 |
| B3: Rollback Reason | 5 | 5 | 0 |
| C: Audit Log | 3 | 3 | 0 |
| **Total** | **37** | **37** | **0** |
