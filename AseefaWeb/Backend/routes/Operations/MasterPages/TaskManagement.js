    const express = require('express');
    const sql = require('mssql');
    const router = express.Router();
    const dbConfig = require('../../../config/mssql');

    // ── GET /api/gettask?CompanyId=X ──
    router.get('/gettask', async (req, res) => {
        const { CompanyId } = req.query;
        if (!CompanyId) {
            return res.status(400).json({ success: false, message: 'CompanyId is required.' });
        }
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('CompanyID', sql.Int, Number(CompanyId))
                .execute('sp_GetTasks');

            const [tasks, approvalRows, monitoringRows] = result.recordsets;

            const approvalByTask = {};
            approvalRows.forEach(r => {
                (approvalByTask[r.TaskID] ||= []).push(r); // already ordered by ApprovalOrder from SP
            });

            const monitoringByTask = {};
            monitoringRows.forEach(r => {
                (monitoringByTask[r.TaskID] ||= []).push(r.EmployeeID);
            });

            const shaped = tasks.map(t => ({
                ...t,
                ApprovalMembers: (approvalByTask[t.TaskID] || [])
                    .sort((a, b) => a.ApprovalOrder - b.ApprovalOrder)
                    .map(r => r.EmployeeID),
                MonitoringMembers: monitoringByTask[t.TaskID] || [],
            }));

            // Frontend does response.data directly as the array, so return it bare
            res.json(shaped);
        } catch (err) {
            console.error('gettask error:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
        }
    });

    // ── POST /api/insertupdatetask  (INSERT if TaskID=0, else UPDATE) ──
    router.post('/insertupdatetask', async (req, res) => {
        const {
            TaskID, Title, StartDateTime, EndDateTime, AssignTo, Priority,
            ProgressMetricType, ProgressMetricValue,
            ApprovalMembers, MonitoringMembers,
            CreatedBy, CompanyId,
        } = req.body;

        if (!Title || !StartDateTime || !EndDateTime || !Priority || !ProgressMetricType || !CompanyId) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        try {
            const pool = await sql.connect(dbConfig);
            const r = pool.request();
            r.input('TaskID', sql.Int, Number(TaskID) || 0);
            r.input('CompanyID', sql.Int, Number(CompanyId));
            r.input('Title', sql.NVarChar(200), Title);
            r.input('StartDateTime', sql.DateTime, new Date(StartDateTime));
            r.input('EndDateTime', sql.DateTime, new Date(EndDateTime));
            r.input('AssignTo', sql.Int, AssignTo ? Number(AssignTo) : null);
            r.input('Priority', sql.NVarChar(20), Priority);
            r.input('ProgressMetricType', sql.NVarChar(20), ProgressMetricType);
            r.input('ProgressMetricValue', sql.NVarChar(50), ProgressMetricValue != null ? String(ProgressMetricValue) : null);
            r.input('ApprovalMembersJSON', sql.NVarChar(sql.MAX), JSON.stringify(ApprovalMembers || []));
            r.input('MonitoringMembersJSON', sql.NVarChar(sql.MAX), JSON.stringify(MonitoringMembers || []));

            if (!TaskID || Number(TaskID) === 0) {
                r.input('CreatedBy', sql.Int, Number(CreatedBy));
            } else {
                r.input('ModifiedBy', sql.Int, Number(CreatedBy)); // frontend reuses CreatedBy field on update too
            }

            const result = await r.execute('sp_InsertUpdateTask');
            const newTaskID = result.recordset?.[0]?.TaskID;

            res.json({ success: true, TaskID: newTaskID });
        } catch (err) {
            console.error('insertupdatetask error:', err);
            res.status(500).json({ success: false, message: err.message || 'Save failed.' });
        }
    });

    // ── DELETE /api/deletetask  { TaskID, DeletedBy } ──
    router.delete('/deletetask', async (req, res) => {
        const { TaskID, DeletedBy } = req.body;
        if (!TaskID || !DeletedBy) {
            return res.status(400).json({ success: false, message: 'TaskID and DeletedBy are required.' });
        }
        try {
            const pool = await sql.connect(dbConfig);
            await pool.request()
                .input('TaskID', sql.Int, Number(TaskID))
                .input('DeletedBy', sql.Int, Number(DeletedBy))
                .execute('sp_DeleteTask');

            res.json({ success: true });
        } catch (err) {
            console.error('deletetask error:', err);
            res.status(500).json({ success: false, message: err.message || 'Delete failed.' });
        }
    });

    router.get('/GetEmployees/:CompanyId', async (req, res) => {
    const { CompanyId } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
        .input('CompanyID', sql.Int, Number(CompanyId))
        .query(`
            SELECT UserId AS EmployeeID, Name AS EmployeeName
            FROM UserTable
            WHERE CompanyID = @CompanyID
            AND IsDeleted = 0
            AND IsHavenWorker = 1
            ORDER BY Name
        `);
        res.json({ success: true, employees: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
    });
    // ── GET /api/GetTaskApprovers/:CompanyId ──
// Returns only employees who have ever been designated as an ApprovalMember
// on at least one task — this is the eligible pool for attendance approvals too.
router.get('/GetTaskApprovers/:CompanyId', async (req, res) => {
  const { CompanyId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, Number(CompanyId))
      .query(`
        SELECT DISTINCT u.UserId AS EmployeeID, u.Name AS EmployeeName
        FROM TaskApprovalMembers tam
        INNER JOIN UserTable u ON u.UserId = tam.EmployeeID
        WHERE u.CompanyID = @CompanyID
          AND u.IsDeleted = 0
        ORDER BY u.Name
      `);
    res.json({ success: true, approvers: result.recordset || [] });
  } catch (err) {
    console.error('GetTaskApprovers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

    module.exports = router;