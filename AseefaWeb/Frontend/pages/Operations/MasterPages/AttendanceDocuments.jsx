import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../apiService';
import { toast } from 'react-toastify';
import {
    FaUpload, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile,
    FaTrash, FaTimes, FaDownload, FaFolderOpen, FaSpinner
} from 'react-icons/fa';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * AttendanceDocuments
 * Lets the user upload and preview client documents (timesheets, PO's,
 * signed sheets, etc.) scoped to whichever Client/Project or Supplier +
 * Month/Year is currently selected on the Attendance Dashboard.
 *
 * USAGE (inside AttendanceDashboard, once hasSelection is true):
 *   <AttendanceDocuments
 *       companyId={sessionStorage.getItem('CompanyID')}
 *       filterMode={filterMode}                 // 'client' | 'supplier'
 *       clientId={filterMode === 'client' ? clientID : null}
 *       projectId={filterMode === 'client' ? (projectID || null) : null}
 *       supplierId={filterMode === 'supplier' ? selectedSupplierID : null}
 *       month={month}
 *       year={year}
 *       monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
 *       uploadedBy={sessionStorage.getItem('UserId')}
 *   />
 *
 * EXPECTED BACKEND CONTRACT (thin Express routes, mssql, logic in SP —
 * same pattern as GetAttendanceAbstract / SaveAttendance):
 *
 *  GET  /api/GetAttendanceDocuments
 *       params: { CompanyID, Month, Year, ClientID (nullable), SupplierID (nullable) }
 *       → { documents: [{
 *             DocumentId, FileName, FileType,     // FileType: 'image' | 'pdf' | 'doc' | 'other'
 *             Url,                                 // direct link the browser can render/download
 *             UploadedBy, UploadedByName, UploadedAt
 *          }] }
 *
 *  POST /api/UploadAttendanceDocument           (multipart/form-data)
 *       fields: file, CompanyID, Month, Year, ClientID (nullable), SupplierID (nullable), UploadedBy
 *       → { success, document: { ...same shape as above... } }
 *
 *  DELETE /api/DeleteAttendanceDocument/:documentId
 *       → { success }
 * ─────────────────────────────────────────────────────────────────────────
 */

const primaryColor = 'rgb(45, 75, 169)';
const MAX_FILE_MB = 15;
const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];

const extOf = (name = '') => {
    const m = name.match(/\.[^.]+$/);
    return m ? m[0].toLowerCase() : '';
};

const kindOf = (doc) => {
    if (doc.FileType) return doc.FileType;
    const ext = extOf(doc.FileName);
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
    if (ext === '.pdf') return 'pdf';
    if (['.doc', '.docx', '.xls', '.xlsx'].includes(ext)) return 'doc';
    return 'other';
};

const iconFor = (doc) => {
    const kind = kindOf(doc);
    const ext = extOf(doc.FileName);
    if (kind === 'image') return null; // real thumbnail is used instead
    if (kind === 'pdf') return <FaFilePdf style={{ color: '#e53e3e' }} />;
    if (ext === '.xls' || ext === '.xlsx') return <FaFileExcel style={{ color: '#276749' }} />;
    if (ext === '.doc' || ext === '.docx') return <FaFileWord style={{ color: '#2b6cb0' }} />;
    return <FaFile style={{ color: '#718096' }} />;
};

function AttendanceDocuments({
    companyId, filterMode, clientId, projectId, supplierId,
    month, year, monthLabel, uploadedBy,
}) {
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const fileInputRef = useRef(null);

    const hasScope = filterMode === 'client' ? !!clientId : !!supplierId;

    const fetchDocuments = useCallback(async () => {
        if (!hasScope) { setDocuments([]); return; }
        setLoadingDocs(true);
        try {
            const params = { CompanyID: companyId, Month: month, Year: year };
            if (filterMode === 'client') params.ClientID = clientId;
            else params.SupplierID = supplierId;

            const res = await api.get('/api/GetAttendanceDocuments', { params });
            setDocuments(res.data.documents || []);
        } catch {
            toast.error('Failed to load documents for this month.');
            setDocuments([]);
        } finally {
            setLoadingDocs(false);
        }
    }, [companyId, filterMode, clientId, supplierId, month, year, hasScope]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    const validateFile = (file) => {
        const ext = extOf(file.name);
        if (!ACCEPTED_EXT.includes(ext)) {
            toast.error(`${file.name}: unsupported file type. Allowed: ${ACCEPTED_EXT.join(', ')}`);
            return false;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.error(`${file.name}: exceeds the ${MAX_FILE_MB}MB limit.`);
            return false;
        }
        return true;
    };

    const uploadFiles = async (fileList) => {
        const files = Array.from(fileList).filter(validateFile);
        if (files.length === 0) return;

        setUploading(true);
        let succeeded = 0;
        try {
            for (const file of files) {
                const form = new FormData();
                form.append('file', file);
                form.append('CompanyID', companyId);
                form.append('Month', month);
                form.append('Year', year);
                if (filterMode === 'client') form.append('ClientID', clientId);
                else form.append('SupplierID', supplierId);
                form.append('UploadedBy', uploadedBy);

                try {
                    await api.post('/api/UploadAttendanceDocument', form, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    succeeded += 1;
                } catch {
                    toast.error(`Failed to upload ${file.name}.`);
                }
            }
            if (succeeded > 0) {
                toast.success(`Uploaded ${succeeded} document${succeeded > 1 ? 's' : ''} for ${monthLabel}.`);
                await fetchDocuments();
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files?.length) uploadFiles(e.target.files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Delete "${doc.FileName}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/DeleteAttendanceDocument/${doc.DocumentId}`);
            setDocuments(prev => prev.filter(d => d.DocumentId !== doc.DocumentId));
            if (previewDoc?.DocumentId === doc.DocumentId) setPreviewDoc(null);
            toast.success('Document deleted.');
        } catch {
            toast.error('Failed to delete document.');
        }
    };

    if (!hasScope) return null;

    return (
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <h6 className="mb-0" style={{ fontWeight: 700, color: '#2d3748' }}>
                        <FaFolderOpen className="me-2" style={{ color: primaryColor }} />
                        Documents — {monthLabel}
                        {documents.length > 0 && (
                            <span style={{
                                marginLeft: 8, background: '#e2e8f0', color: '#4a5568',
                                fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '2px 8px',
                            }}>
                                {documents.length}
                            </span>
                        )}
                    </h6>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            background: primaryColor, color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '7px 14px', fontSize: '12.5px', fontWeight: 600,
                            cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        {uploading
                            ? <><FaSpinner className="fa-spin" /> Uploading...</>
                            : <><FaUpload style={{ fontSize: '11px' }} /> Upload Document</>}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_EXT.join(',')}
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `1.5px dashed ${dragOver ? primaryColor : '#cbd5e0'}`,
                        borderRadius: '8px', padding: '14px', textAlign: 'center',
                        background: dragOver ? `${primaryColor}08` : '#fafbfc',
                        cursor: 'pointer', marginBottom: documents.length > 0 || loadingDocs ? '14px' : 0,
                        transition: 'all 0.15s',
                    }}
                >
                    <span style={{ fontSize: '12px', color: '#a0aec0' }}>
                        Drag & drop files here, or click to browse — PDF, Word, Excel, or images, up to {MAX_FILE_MB}MB each
                    </span>
                </div>

                {/* Loading */}
                {loadingDocs && (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" style={{ color: primaryColor }} />
                        <span className="ms-2 text-muted" style={{ fontSize: '13px' }}>Loading documents...</span>
                    </div>
                )}

                {/* Empty state */}
                {!loadingDocs && documents.length === 0 && (
                    <p className="text-muted text-center mb-0" style={{ fontSize: '12.5px' }}>
                        No documents uploaded for {monthLabel} yet.
                    </p>
                )}

                {/* Thumbnail grid */}
                {!loadingDocs && documents.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {documents.map(doc => {
                            const kind = kindOf(doc);
                            return (
                                <div
                                    key={doc.DocumentId}
                                    style={{
                                        width: 96, border: '1px solid #e2e8f0', borderRadius: '8px',
                                        overflow: 'hidden', background: '#fff', position: 'relative',
                                    }}
                                >
                                    <div
                                        onClick={() => setPreviewDoc(doc)}
                                        title={doc.FileName}
                                        style={{
                                            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: kind === 'image' ? '#f7f8fa' : '#f1f5f9',
                                            cursor: 'pointer', fontSize: '26px',
                                        }}
                                    >
                                        {kind === 'image'
                                            ? <img
                                                src={doc.Url}
                                                alt={doc.FileName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              />
                                            : iconFor(doc)}
                                    </div>
                                    <div style={{ padding: '5px 6px' }}>
                                        <div style={{
                                            fontSize: '10.5px', fontWeight: 600, color: '#4a5568',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }} title={doc.FileName}>
                                            {doc.FileName}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(doc)}
                                        title="Delete"
                                        style={{
                                            position: 'absolute', top: 4, right: 4,
                                            width: 18, height: 18, borderRadius: '50%', border: 'none',
                                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', fontSize: '9px', lineHeight: 1,
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview modal */}
            {previewDoc && (
                <div
                    onClick={() => setPreviewDoc(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1050, padding: '24px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: '10px', overflow: 'hidden',
                            width: '100%', maxWidth: 720, maxHeight: '85vh',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', borderBottom: '1px solid #edf0f4',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#2d3748' }}>
                                {previewDoc.FileName}
                            </span>
                            <div className="d-flex align-items-center gap-2">
                                <a
                                    href={previewDoc.Url}
                                    download={previewDoc.FileName}
                                    title="Download"
                                    style={{ color: '#718096', fontSize: '14px' }}
                                >
                                    <FaDownload />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewDoc(null)}
                                    style={{ background: 'none', border: 'none', color: '#718096', fontSize: '16px', cursor: 'pointer' }}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflow: 'auto', background: '#f7f8fa' }}>
                            {kindOf(previewDoc) === 'image' && (
                                <img
                                    src={previewDoc.Url}
                                    alt={previewDoc.FileName}
                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                />
                            )}
                            {kindOf(previewDoc) === 'pdf' && (
                                <iframe
                                    src={previewDoc.Url}
                                    title={previewDoc.FileName}
                                    style={{ width: '100%', height: '75vh', border: 'none' }}
                                />
                            )}
                            {kindOf(previewDoc) !== 'image' && kindOf(previewDoc) !== 'pdf' && (
                                <div className="text-center py-5">
                                    <div style={{ fontSize: '40px', marginBottom: 12 }}>{iconFor(previewDoc)}</div>
                                    <p className="text-muted mb-3" style={{ fontSize: '13px' }}>
                                        Preview isn't available for this file type.
                                    </p>
                                    <a
                                        href={previewDoc.Url}
                                        download={previewDoc.FileName}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            background: primaryColor, color: '#fff', borderRadius: 6,
                                            padding: '8px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                                        }}
                                    >
                                        <FaDownload style={{ fontSize: 11 }} /> Download to view
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AttendanceDocuments;