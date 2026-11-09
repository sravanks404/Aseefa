import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import api from '../../apiService';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from 'react-select';
import * as XLSX from 'xlsx';
import {
  FaSearch, FaPlus, FaUser, FaPhone, FaEnvelope,
  FaSave, FaEdit, FaTrashAlt, FaEraser, FaArrowLeft,
  FaCamera, FaBuilding, FaUserTag, FaIdCard,
    FaPassport, FaFileAlt, FaGlobe, FaUpload, FaFilePdf,
  FaFileImage, FaTimesCircle, FaCalendarAlt, FaBriefcase, FaUserTie, FaCertificate, FaShieldAlt, FaDoorOpen, FaHardHat, FaGraduationCap,
  FaDownload, FaSync, FaHistory, FaFilter,FaFileExcel
} from "react-icons/fa";
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { usePermission } from '../../../src/context/permissionContex';

// const BASE_URL = api.defaults.baseURL || "";
// const workerDocUrl = (path) => path ? `${BASE_URL}/api/workerfile?path=${encodeURIComponent(path)}` : "";
const BASE_URL = api.defaults.baseURL || "";
const workerDocUrl = (path) => path ? `${BASE_URL}/api/workerfile?path=${encodeURIComponent(path)}` : "";
const rentalFileUrl = (path) => path ? `${BASE_URL}/${path.replace(/^\/+/, "")}` : null;

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
const primaryColor = 'rgb(45, 75, 169)';
const PAYMENT_MODES = ['Cash', 'Online Transaction', 'Cheque'];
const parsePaymentModes = (value) => {
  const modes = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(modes
    .filter(mode => typeof mode === 'string')
    .map(mode => mode.trim())
    .filter(mode => PAYMENT_MODES.includes(mode)))];
};
const fullName = (item) =>
  [item.Name, item.MName, item.LName].filter(Boolean).join(' ').trim() || 'Unknown User';
const randomWord = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};
// Put this outside the component, near the top of the file
const NATIONALITY_MAP = {
  "Afghanistan": "Afghan", "Albania": "Albanian", "Algeria": "Algerian",
  "Argentina": "Argentine", "Australia": "Australian", "Austria": "Austrian",
  "Bahrain": "Bahraini", "Bangladesh": "Bangladeshi", "Belgium": "Belgian",
  "Brazil": "Brazilian", "Canada": "Canadian", "Chile": "Chilean",
  "China": "Chinese", "Colombia": "Colombian", "Croatia": "Croatian",
  "Czech Republic": "Czech", "Denmark": "Danish", "Egypt": "Egyptian",
  "Ethiopia": "Ethiopian", "Finland": "Finnish", "France": "French",
  "Germany": "German", "Ghana": "Ghanaian", "Greece": "Greek",
  "Hungary": "Hungarian", "India": "Indian", "Indonesia": "Indonesian",
  "Iran": "Iranian", "Iraq": "Iraqi", "Ireland": "Irish",
  "Israel": "Israeli", "Italy": "Italian", "Japan": "Japanese",
  "Jordan": "Jordanian", "Kenya": "Kenyan", "Kuwait": "Kuwaiti",
  "Lebanon": "Lebanese", "Libya": "Libyan", "Malaysia": "Malaysian",
  "Mexico": "Mexican", "Morocco": "Moroccan", "Myanmar": "Burmese",
  "Nepal": "Nepali", "Netherlands": "Dutch", "New Zealand": "New Zealander",
  "Nigeria": "Nigerian", "Norway": "Norwegian", "Oman": "Omani",
  "Pakistan": "Pakistani", "Palestine": "Palestinian", "Philippines": "Filipino",
  "Poland": "Polish", "Portugal": "Portuguese", "Qatar": "Qatari",
  "Romania": "Romanian", "Russia": "Russian", "Saudi Arabia": "Saudi",
  "Serbia": "Serbian", "Singapore": "Singaporean", "Somalia": "Somali",
  "South Africa": "South African", "South Korea": "South Korean",
  "Spain": "Spanish", "Sri Lanka": "Sri Lankan", "Sudan": "Sudanese",
  "Sweden": "Swedish", "Switzerland": "Swiss", "Syria": "Syrian",
  "Taiwan": "Taiwanese", "Thailand": "Thai", "Tunisia": "Tunisian",
  "Turkey": "Turkish", "Uganda": "Ugandan", "Ukraine": "Ukrainian",
  "United Arab Emirates": "Emirati", "United Kingdom": "British",
  "United States": "American", "Vietnam": "Vietnamese", "Yemen": "Yemeni",
  "Zimbabwe": "Zimbabwean",
};

// ─── Single source of truth for which documents are mandatory ───────────────
const REQUIRED_DOC_KEYS = [
  'professionalLicenseDocument', // Trade License
  'ppDocument',                  // Passport
  'workmenCompDocument',         // Workmen Compensation
  'educationCert',               // NOC
];

const DOC_TYPES = [
  { key: 'resume', label: 'Resume', icon: <FaBriefcase /> },
  { key: 'ppDocument', label: 'Passport', icon: <FaPassport /> },
  { key: 'eidDocument', label: 'Emirates ID', icon: <FaIdCard /> },
  { key: 'workmenCompDocument', label: 'Workmen Compensation', icon: <FaHardHat /> },
  { key: 'professionalLicenseDocument', label: 'Trade License', icon: <FaGraduationCap /> },
  { key: 'educationCert', label: 'NOC', icon: <FaFileAlt /> },
  { key: 'visaDocument', label: 'Visa', icon: <FaGlobe /> },
  { key: 'experienceDocument', label: 'Experience', icon: <FaUserTie /> },
  { key: 'insuranceDocument', label: 'Insurance', icon: <FaShieldAlt /> },
  { key: 'gatePassDocument', label: 'Gate Pass', icon: <FaDoorOpen /> },
  { key: 'otherDocument', label: 'Other Document', icon: <FaCertificate /> },
].map(d => ({ ...d, required: REQUIRED_DOC_KEYS.includes(d.key) }));

// ─── Empty documents state factory ───────────────────────────────────────────
const emptyDocs = () => ({
  resume: [], ppDocument: [], educationCert: [],
  visaDocument: [], eidDocument: [], experienceDocument: [],
  insuranceDocument: [], gatePassDocument: [], workmenCompDocument: [],
  professionalLicenseDocument: [], otherDocument: []
});

// ─── Utility helpers ──────────────────────────────────────────────────────────
const _b64Cache = new WeakMap();

const bufferToBase64Async = (bufferObj, mimeType = 'application/octet-stream') => {
  return new Promise((resolve) => {
    if (!bufferObj) return resolve(null);
    if (typeof bufferObj === 'string') {
      return resolve(
        bufferObj.includes('base64,') ? bufferObj : `data:${mimeType};base64,${bufferObj}`
      );
    }
    if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
      if (_b64Cache.has(bufferObj)) return resolve(_b64Cache.get(bufferObj));
      const bytes = new Uint8Array(bufferObj.data);
      const chunkSize = 8192;
      let binary = '';
      let i = 0;
      const processChunk = () => {
        const end = Math.min(i + chunkSize * 4, bytes.length);
        while (i < end) {
          binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, end)));
          i += chunkSize;
        }
        if (i < bytes.length) {
          setTimeout(processChunk, 0);
        } else {
          const result = `data:${mimeType};base64,${btoa(binary)}`;
          _b64Cache.set(bufferObj, result);
          resolve(result);
        }
      };
      setTimeout(processChunk, 0);
    } else {
      resolve(null);
    }
  });
};
const fetchDocAsDataUri = async (path) => {
  if (!path) return null;
  try {
    const res = await fetch(workerDocUrl(path));
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
};

const bufferToBase64 = (bufferObj, mimeType = 'application/octet-stream') => {
  if (!bufferObj) return null;
  if (typeof bufferObj === 'string')
    return bufferObj.includes('base64,') ? bufferObj : `data:${mimeType};base64,${bufferObj}`;
  if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
    if (_b64Cache.has(bufferObj)) return _b64Cache.get(bufferObj);
    const bytes = new Uint8Array(bufferObj.data);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize)
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    const result = `data:${mimeType};base64,${btoa(binary)}`;
    _b64Cache.set(bufferObj, result);
    return result;
  }
  return null;
};

const mimeFromName = (name = '') => {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.(jpg|jpeg)$/i.test(name)) return 'image/jpeg';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.docx$/i.test(name)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (/\.doc$/i.test(name)) return 'application/msword';
  if (/\.xlsx$/i.test(name)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (/\.xls$/i.test(name)) return 'application/vnd.ms-excel';
  return 'application/octet-stream';
};
const normaliseServerDocPaths = (jsonStr) => {
  if (!jsonStr) return [];
  try {
    const arr = JSON.parse(jsonStr);
    return arr.map(d => ({ fileName: d.fileName, path: d.path, label: d.label || '' }));
  } catch { return []; }
};


const normaliseServerDocs = (fileBufferOrArray, fileNameOrArray) => {
  // Try JSON array first
  if (typeof fileBufferOrArray === 'string' && fileBufferOrArray.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(fileBufferOrArray);
      return arr.map(item => {
        const name = item.fileName || item.FileName || 'document';
        const mime = mimeFromName(name);
        const data = bufferToBase64(item.data || item.fileBuffer, mime) || item.data;
        return data ? { fileName: name, data, label: item.label || '' } : null;
      }).filter(Boolean);
    } catch { }
  }

  // Try single JSON object
  if (typeof fileBufferOrArray === 'string' && fileBufferOrArray.trim().startsWith('{')) {
    try {
      const item = JSON.parse(fileBufferOrArray);
      const name = item.fileName || item.FileName || fileNameOrArray || 'document';
      const mime = mimeFromName(name);
      const data = bufferToBase64(item.data || item.fileBuffer, mime) || item.data;
      return data ? [{ fileName: name, data, label: item.label || '' }] : [];
    } catch { }
  }

  // Legacy single buffer
  if (!fileBufferOrArray && !fileNameOrArray) return [];
  const name = fileNameOrArray || 'document';
  const mime = mimeFromName(name);
  const data = bufferToBase64(fileBufferOrArray, mime);
  return data ? [{ fileName: name, data, label: '' }] : [];
};

const getDocFileIcon = (f) => {
  if (!f) return null;
  const name = (f instanceof File ? f.name : f.fileName) || '';
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <FaFileImage style={{ color: '#4299e1' }} />;
  if (name.match(/\.pdf$/i)) return <FaFilePdf style={{ color: '#e53e3e' }} />;
  return <FaFileAlt style={{ color: '#718096' }} />;
};

// ─── PDF thumbnail helper ─────────────────────────────────────────────────────
const toUint8Array = (source) => {
  try {
    if (!source) return null;
    if (typeof source === 'object' && source.type === 'Buffer' && Array.isArray(source.data))
      return new Uint8Array(source.data);
    if (typeof source === 'string') {
      const b64 = source.includes('base64,') ? source.split('base64,')[1] : source;
      const binary = atob(b64.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    return null;
  } catch (err) {
    console.warn('toUint8Array failed:', err.message);
    return null;
  }
};
const pdfToAllPageImageDataUris = async (source) => {
  try {
    const data = toUint8Array(source);
    if (!data || data.length === 0) return [];
    const pdf = await pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const pages = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        pages.push(null);
      }
    }
    return pages.filter(Boolean);
  } catch (err) {
    console.warn('PDF multi-page render failed:', err.message);
    return [];
  }
};

const pdfToImageDataUri = async (source) => {
  try {
    const data = toUint8Array(source);
    if (!data || data.length === 0) return null;
    const renderWithTimeout = new Promise(async (resolve) => {
      try {
        const pdf = await pdfjsLib.getDocument({
          data,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        resolve(null);
      }
    });
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 10000));
    return await Promise.race([renderWithTimeout, timeout]);
  } catch (err) {
    console.warn('PDF render failed:', err.message);
    return null;
  }
};

const docToDataUri = (fileBuffer, fileName) => {
  const mime = mimeFromName(fileName || '');
  if (!fileBuffer) return null;
  if (typeof fileBuffer === 'string')
    return fileBuffer.includes('base64,') ? fileBuffer : `data:${mime};base64,${fileBuffer}`;
  if (fileBuffer.type === 'Buffer' && Array.isArray(fileBuffer.data))
    return bufferToBase64(fileBuffer, mime);
  return null;
};

// ─── DOCX thumbnail helper ────────────────────────────────────────────────────
// Converts a .docx source (Buffer-object, base64 string, or data URI) into a
// JPEG data URI by: extracting raw bytes → mammoth (.docx → HTML) → rendering
// that HTML off-screen → html2canvas (HTML → canvas) → canvas.toDataURL.
// Mirrors pdfToImageDataUri's signature/shape so it plugs into the same
// isPreviewable / imgDataUri pipeline used for PDFs and images.
const docxToImageDataUri = async (source) => {
  let container = null;
  try {
    const bytes = toUint8Array(source);
    if (!bytes || bytes.length === 0) return null;

    const renderWithTimeout = new Promise(async (resolve) => {
      try {
        const mammoth = await loadMammoth();
        const html2canvas = await loadHtml2Canvas();

        // mammoth needs an ArrayBuffer, not a Uint8Array view
        const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

        // Render the converted HTML off-screen at a fixed "page" width so the
        // snapshot looks like a document page rather than a tiny stretched div.
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-99999px';
        container.style.left = '0';
        container.style.width = '794px'; // ~A4 width at 96dpi
        container.style.minHeight = '200px';
        container.style.background = '#ffffff';
        container.style.padding = '40px';
        container.style.boxSizing = 'border-box';
        container.style.fontFamily = 'Calibri, Arial, sans-serif';
        container.style.fontSize = '15px';
        container.style.lineHeight = '1.5';
        container.style.color = '#1a1a1a';
        container.innerHTML = html || '<p style="color:#999;">(empty document)</p>';
        document.body.appendChild(container);

        // Let the browser lay the HTML out before snapshotting it
        await new Promise(r => setTimeout(r, 50));

        const canvas = await html2canvas(container, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.warn('DOCX render failed:', err?.message);
        resolve(null);
      }
    });

    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 10000));
    return await Promise.race([renderWithTimeout, timeout]);
  } catch (err) {
    console.warn('DOCX render failed:', err.message);
    return null;
  } finally {
    if (container && container.parentNode) container.parentNode.removeChild(container);
  }
};

// ─── PDF Generation Helpers ───────────────────────────────────────────────────
const loadJsPDF = () =>
  new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });

// Loads html2canvas from CDN (used to rasterise rendered Word/Text HTML into
// a JPEG so it can be placed on the PDF page the same way images/PDFs are).
const loadHtml2Canvas = () =>
  new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = reject;
    document.head.appendChild(script);
  });

// Loads mammoth from CDN (used to convert a .docx ArrayBuffer into HTML so it
// can be rendered off-screen and rasterised by html2canvas above).
const loadMammoth = () =>
  new Promise((resolve, reject) => {
    if (window.mammoth) { resolve(window.mammoth); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.2/mammoth.browser.min.js';
    script.onload = () => resolve(window.mammoth);
    script.onerror = reject;
    document.head.appendChild(script);
  });


const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
};

const formatEIDInput = (value) => {
  const digits = value.replace(/\D/g, '').substring(0, 15);
  let out = '';
  if (digits.length > 0) out += digits.substring(0, 3);
  if (digits.length > 3) out += '-' + digits.substring(3, 7);
  if (digits.length > 7) out += '-' + digits.substring(7, 14);
  if (digits.length > 14) out += '-' + digits.substring(14, 15);
  return out;
};

const isValidEID = (value) => /^784-\d{4}-\d{7}-\d$/.test(value || '');
const toDateInputValue = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.substring(0, 10);
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  } catch { }
  return '';
};

const generateUserPDF = async (item) => {
  try {
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const col2X = 110;
    let y = 0;

    const hex = (rgb) => {
      const m = rgb.match(/\d+/g);
      return m ? [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])] : [45, 75, 169];
    };
    const primary = hex(primaryColor);

    const setFont = (style = 'normal', size = 10) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
    const setColor = (r, g, b) => doc.setTextColor(r, g, b);
    const setDraw = (r, g, b) => doc.setDrawColor(r, g, b);
    const setFill = (r, g, b) => doc.setFillColor(r, g, b);

    const checkNewPage = (needed = 12) => {
      if (y + needed > pageH - 20) { doc.addPage(); y = 20; }
    };

    const drawSectionHeader = (title) => {
      checkNewPage(14);
      setFill(...primary);
      doc.roundedRect(margin, y, pageW - margin * 2, 8, 1, 1, 'F');
      setFont('bold', 10);
      setColor(255, 255, 255);
      doc.text(title, margin + 4, y + 5.5);
      setColor(50, 50, 50);
      y += 12;
    };

    const drawField = (label, value, xOverride, yOverride) => {
      const xPos = xOverride !== undefined ? xOverride : margin;
      const yPos = yOverride !== undefined ? yOverride : y;
      setFont('bold', 8.5);
      setColor(100, 100, 120);
      doc.text(label + ':', xPos, yPos);
      setFont('normal', 9);
      setColor(30, 30, 30);
      const val = value && value !== 'null' && value !== 'undefined' ? String(value) : 'N/A';
      doc.text(val, xPos, yPos + 5);
    };

    const drawTwoCol = (lLabel, lVal, rLabel, rVal) => {
      checkNewPage(13);
      drawField(lLabel, lVal, margin, y);
      drawField(rLabel, rVal, col2X, y);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y + 9, pageW - margin, y + 9);
      y += 13;
    };

    const drawOneCol = (label, val) => {
      checkNewPage(12);
      drawField(label, val, margin, y);
      y += 12;
    };

    // ── Draws a placeholder card for files that can't be visually previewed
    // (Word, Excel, Text, or any other unsupported type). Used in both the
    // "Other Document" full-page branch and the grid-cell branch below.
    const drawPlaceholderCard = (f, cx, cy, boxW, boxH) => {
      const typeLabel = f.isDocFile ? 'WORD DOCUMENT'
        : f.isXlsFile ? 'EXCEL SPREADSHEET'
          : f.isTxtFile ? 'TEXT FILE'
            : 'FILE';
      const typeColor = f.isDocFile ? [49, 130, 206]
        : f.isXlsFile ? [56, 161, 105]
          : f.isTxtFile ? [214, 158, 46]
            : [128, 90, 213];
      const badgeText = typeLabel.split(' ')[0].substring(0, 4);

      setFill(248, 250, 255);
      setDraw(220, 228, 245);
      doc.roundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 2, 2, 'FD');

      setFill(...typeColor);
      doc.roundedRect(cx - 9, cy - boxH / 2 + 8, 18, 20, 1.5, 1.5, 'F');
      setFont('bold', 7); setColor(255, 255, 255);
      doc.text(badgeText, cx, cy - boxH / 2 + 20, { align: 'center' });

      setFont('bold', 8); setColor(60, 60, 70);
      doc.text(typeLabel, cx, cy + boxH / 2 - 18, { align: 'center' });
      setFont('normal', 7); setColor(120, 120, 120);
      doc.text('Preview not available', cx, cy + boxH / 2 - 11, { align: 'center' });
      setFont('normal', 6.5); setColor(140, 140, 140);
      doc.text('Download from system to view', cx, cy + boxH / 2 - 6, { align: 'center' });
    };

    const anyDocToImage = (dataUri, fileName) => new Promise((resolve) => {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName || '')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 700;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(null);
        img.src = dataUri;
        return;
      }
      if (/\.pdf$/i.test(fileName || '')) {
        pdfToImageDataUri(dataUri).then(resolve).catch(() => resolve(null));
        return;
      }
      if (/\.docx$/i.test(fileName || '')) {
        // mammoth only supports .docx (the modern XML-based format), not the
        // legacy binary .doc — those still fall through to the placeholder card.
        docxToImageDataUri(dataUri).then(resolve).catch(() => resolve(null));
        return;
      }
      resolve(null);
    });

    let profileImgDataUri = null;
    const rawImg = item.IMAGE ?? item.image ?? null;
    if (rawImg && typeof rawImg === 'object' && rawImg.type === 'Buffer' && Array.isArray(rawImg.data)) {
      profileImgDataUri = bufferToBase64(rawImg, 'image/jpeg');
    } else if (typeof rawImg === 'string' && rawImg.length > 0) {
      profileImgDataUri = rawImg.includes('base64,') ? rawImg : `data:image/jpeg;base64,${rawImg}`;
    }

    const docDefs = [
      { label: 'Resume', fileBuffer: item.ResumeFile, fileName: item.ResumeFileName, multiBuffer: item.ResumeFiles },
      { label: 'PP Document', fileBuffer: item.PPDocumentFile, fileName: item.PPDocumentFileName, multiBuffer: item.PPDocumentFiles },
      { label: 'Visa Document', fileBuffer: item.VisaDocFile, fileName: item.VisaDocFileName, multiBuffer: item.VisaDocFiles },
      { label: 'EID Document', fileBuffer: item.EIDDocFile, fileName: item.EIDDocFileName, multiBuffer: item.EIDDocFiles },
      { label: 'Trade License Document', fileBuffer: item.ProfLiceFile, fileName: item.ProfLiceFileName, multiBuffer: item.ProfLiceFiles },
      { label: 'Workmen Comp Document', fileBuffer: item.WorkmenCompFile, fileName: item.WorkmenCompFileName, multiBuffer: item.WorkmenCompFiles },
     { label: 'NOC', fileBuffer: item.EduCertFile, fileName: item.EduCertFileName, multiBuffer: item.EduCertFiles },
      { label: 'Experience Document', fileBuffer: item.ExperienceDocFile, fileName: item.ExperienceDocFileName, multiBuffer: item.ExperienceDocFiles },
      { label: 'Insurance Document', fileBuffer: item.InsuranceFile, fileName: item.InsuranceFileName, multiBuffer: item.InsuranceFiles },
      { label: 'Gate Pass Document', fileBuffer: item.GatePassFile, fileName: item.GatePassFileName, multiBuffer: item.GatePassFiles },
      { label: 'Other Document', fileBuffer: item.OtherDocFile, fileName: item.OtherDocFileName, multiBuffer: item.OtherDocFiles },
    ];

    const preparedGroups = [];
    for (const d of docDefs) {
      let entries = [];
      if (d.multiBuffer) {
        const arr = typeof d.multiBuffer === 'string'
          ? (() => { try { return JSON.parse(d.multiBuffer); } catch { return []; } })()
          : (Array.isArray(d.multiBuffer) ? d.multiBuffer : []);
        entries = arr.map(f => ({
          fileName: f.fileName || f.FileName || 'document',
          fileBuffer: f.data || f.fileBuffer || f,
          label: f.label || ''
        }));
      }
      if (entries.length === 0 && (d.fileBuffer || d.fileName)) {
        entries = [{ fileName: d.fileName, fileBuffer: d.fileBuffer, label: '' }];
      }
      if (entries.length === 0) {
        preparedGroups.push({ label: d.label, available: false, files: [] });
        continue;
      }

      const files = [];
      for (const e of entries) {
        await new Promise(r => setTimeout(r, 0));
        const dataUri = docToDataUri(e.fileBuffer, e.fileName);
        const isPdf = /\.pdf$/i.test(e.fileName || '');
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(e.fileName || '');
        const isDocFile = /\.(doc|docx)$/i.test(e.fileName || '');
        const isXlsFile = /\.(xls|xlsx)$/i.test(e.fileName || '');
        const isTxtFile = /\.txt$/i.test(e.fileName || '');
        let imgDataUris = [];
        if (isPdf) {
          imgDataUris = await pdfToAllPageImageDataUris(e.fileBuffer);
        } else if (isImage && dataUri) {
          const single = await anyDocToImage(dataUri, e.fileName);
          if (single) imgDataUris = [single];
        } else if (isDocFile && dataUri) {
          const single = await anyDocToImage(dataUri, e.fileName);
          if (single) imgDataUris = [single];
        }
        const isPreviewable = imgDataUris.length > 0;
        files.push({
          fileName: e.fileName,
          imgDataUri: imgDataUris[0] || null,
          imgDataUris,
          isPdf, isImage, isDocFile, isXlsFile, isTxtFile,
          isPreviewable, dataUri, label: e.label || ''
        });
      }
      preparedGroups.push({ label: d.label, available: true, files });
    }

  if (profileImgDataUri) {
  preparedGroups.splice(0, 0, {
    label: 'Photo',
    available: true,
    files: [{
      fileName: 'Profile_Photo.jpg',
      imgDataUri: profileImgDataUri,
      imgDataUris: [profileImgDataUri],
      isPdf: false, isImage: true, isDocFile: false, isXlsFile: false, isTxtFile: false,
      isPreviewable: true, dataUri: profileImgDataUri, label: ''
    }]
  });
} else {
  preparedGroups.splice(0, 0, { label: 'Photo', available: false, files: [] });
}

    setFill(...primary);
    doc.rect(0, 0, pageW, 42, 'F');

    const photoX = margin, photoY = 8, photoW = 24, photoH = 28;
    if (profileImgDataUri) {
      setFill(255, 255, 255);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
      doc.addImage(profileImgDataUri, 'JPEG', photoX + 1, photoY + 1, photoW - 2, photoH - 2, '', 'FAST');
      setDraw(255, 255, 255);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'S');
    } else {
      setFill(255, 255, 255);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
      setFont('bold', 12); setColor(...primary);
      const initials = fullName(item).split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      doc.text(initials, photoX + 8, photoY + 16);
    }

    const infoX = photoX + photoW + 8;
    setFont('bold', 15); setColor(255, 255, 255);
    doc.text(fullName(item), infoX, 16);
    setFont('normal', 10); setColor(220, 230, 255);
    doc.text(item.RoleName || '', infoX, 23);
    setFont('normal', 9);
    doc.text(item.BranchName ? `Project : ${item.BranchName}` : '', infoX, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageW - margin - 35, 37);

    y = 50;

    drawSectionHeader('PERSONAL INFORMATION');
    drawTwoCol('Full Name', fullName(item), 'Gender',
      item.Sex === 0 || item.Sex === '0' ? 'Male' : item.Sex === 1 || item.Sex === '1' ? 'Female' : 'N/A');
    drawTwoCol('Email', item.Email, 'Mobile', item.Mobile);
    drawTwoCol('Country', item.Country, 'Nationality', item.Address3);
    drawOneCol('Address', item.Address1 || 'N/A');
    drawTwoCol('Place', item.Address2, 'Company', item.CompanyName);

    drawSectionHeader('ACCOUNT & ROLE');
    drawTwoCol('Username', item.UserName, 'Project', item.BranchName);
    drawTwoCol('Role', item.RoleName, 'Badge No.', item.BadgeNo);

    drawSectionHeader('ID & VISA DETAILS');
    checkNewPage(8); setFont('bold', 8.5); setColor(...primary);
    doc.text('Emirates ID (EID)', margin, y);
    setDraw(...primary); doc.line(margin + 32, y - 1, pageW - margin, y - 1); y += 6;
    drawTwoCol('EID Number', item.EIDNo, 'EID Expiry', formatDate(item.EIDExpiryDate));
    checkNewPage(8); setFont('bold', 8.5); setColor(...primary);
    doc.text('Passport', margin, y);
    doc.line(margin + 16, y - 1, pageW - margin, y - 1); y += 6;
    drawTwoCol('Passport Number', item.PPNo, 'PP Expiry', formatDate(item.PPExpiryDate));
    checkNewPage(8); setFont('bold', 8.5); setColor(...primary);
    doc.text('Visa', margin, y);
    doc.line(margin + 8, y - 1, pageW - margin, y - 1); y += 6;
    drawTwoCol('Visa Number', item.VisaNo, 'Visa Expiry', formatDate(item.VisaExpiryDate));
    drawTwoCol('Insurance No.', item.InsuranceNo, 'Insurance Expiry', formatDate(item.InsuranceExpiryDate));
    drawTwoCol('Gate Pass No.', item.GatePassNo, 'Gate Pass Expiry', formatDate(item.GatePassExpiryDate));
    drawTwoCol('Workmen Compensation No.', item.WorkmenCompNo, 'Workmen Compensation Expiry', formatDate(item.WorkmenCompExpiryDate));
    drawTwoCol('Trade License No.', item.ProfLicenseNo, 'Trade License Expiry', formatDate(item.ProfLicenseExpiryDate));

    drawSectionHeader('UPLOADED DOCUMENTS');
    const uploadedGroups = preparedGroups.filter(g => g.available);
    const missingGroups = preparedGroups.filter(g => !g.available);

    uploadedGroups.forEach((g, gi) => {
      checkNewPage(8);
      setFont('bold', 9); setColor(...primary);
      doc.text(`${gi + 1}. ${g.label}`, margin, y);
      setFont('normal', 8); setColor(100, 100, 100);
      const names = g.files.map(f => f.fileName || 'N/A').join(', ');
      const truncated = names.length > 80 ? names.substring(0, 78) + '…' : names;
      doc.text(`${g.files.length} file${g.files.length > 1 ? 's' : ''}: ${truncated}`, margin + 4, y + 6);
      y += 12;
    });

    let globalImgIndex = 0;

    for (const group of uploadedGroups) {
      const renderableFiles = group.files; // includes previewable + placeholder-card files
      if (renderableFiles.length === 0) continue;

      const isOtherGroup = group.label === 'Other Document';

      if (isOtherGroup) {
        for (let i = 0; i < renderableFiles.length; i++) {
          const f = renderableFiles[i];
          doc.addPage();
          setFill(...primary);
          doc.rect(0, 0, pageW, 22, 'F');
          const heading = f.label?.trim() || f.fileName || 'Other Document';
          setFont('bold', 14); setColor(255, 255, 255);
          doc.text(heading, margin, 14);
          setFont('normal', 8); setColor(200, 220, 255);
          const subText = `Document ${i + 1} of ${renderableFiles.length}  •  ${f.fileName || ''}`;
          doc.text(subText, margin, 20);
          setFill(240, 244, 255);
          doc.rect(0, 22, pageW, 3, 'F');
          const padX = margin;
          const padY = 30;
          const cellW = pageW - 2 * padX;
          const maxImgH = pageH - padY - 24;
          try {
            if (f.isPreviewable) {
              const pagesToRender = f.imgDataUris || [f.imgDataUri];
              for (let pi = 0; pi < pagesToRender.length; pi++) {
                if (pi > 0) {
                  // extra pages get their own PDF page
                  doc.addPage();
                  setFill(...primary);
                  doc.rect(0, 0, pageW, 22, 'F');
                  const heading = f.label?.trim() || f.fileName || 'Other Document';
                  setFont('bold', 14); setColor(255, 255, 255);
                  doc.text(heading, margin, 14);
                  setFont('normal', 8); setColor(200, 220, 255);
                  doc.text(`Page ${pi + 1} of ${pagesToRender.length}  •  ${f.fileName || ''}`, margin, 20);
                }
                const pageUri = pagesToRender[pi];
                const imgProps = doc.getImageProperties(pageUri);
                const ratio = Math.min(cellW / imgProps.width, maxImgH / imgProps.height);
                const imgW = imgProps.width * ratio;
                const imgH = imgProps.height * ratio;
                const imgX = padX + (cellW - imgW) / 2;
                doc.addImage(pageUri, 'JPEG', imgX, padY + 2, imgW, imgH, `img_other_${globalImgIndex++}`, 'FAST');
              }
            } else {
              // Word / Excel / Text / unsupported — show placeholder card
              const boxH = Math.min(maxImgH, 90);
              drawPlaceholderCard(f, padX + cellW / 2, padY + boxH / 2, cellW, boxH);
            }
          } catch {
            setFont('normal', 10); setColor(180, 0, 0);
            doc.text('Preview unavailable', padX + 4, padY + 20);
          }
        }
      } else {
        doc.addPage();
        setFill(...primary);
        doc.rect(0, 0, pageW, 16, 'F');
        setFont('bold', 11); setColor(255, 255, 255);
        doc.text(group.label, margin, 11);
        setFont('normal', 8); setColor(200, 220, 255);
        doc.text(`${renderableFiles.length} file${renderableFiles.length > 1 ? 's' : ''}`, pageW - margin - 18, 11);
        setFill(240, 244, 255);
        doc.rect(0, 16, pageW, 3, 'F');
        const cols = renderableFiles.length === 1 ? 1 : 2;
        const padX = margin;
        const padY = 22;
        const gapX = 6;
        const gapY = 10;
        const cellW = cols === 1 ? pageW - 2 * padX : (pageW - 2 * padX - gapX) / 2;
        const labelH = 10;
        const maxImgH = cols === 1 ? 230 : 110;
        let px = padX;
        let py = padY;
        let col = 0;
        for (let i = 0; i < renderableFiles.length; i++) {
          const f = renderableFiles[i];
          if (py + maxImgH + labelH + 4 > pageH - 14) {
            doc.addPage();
            setFill(...primary);
            doc.rect(0, 0, pageW, 12, 'F');
            setFont('bold', 9); setColor(255, 255, 255);
            doc.text(`${group.label} (continued)`, margin, 8.5);
            py = 18; px = padX; col = 0;
          }
          setFill(248, 250, 255);
          doc.roundedRect(px, py, cellW, maxImgH + labelH + 4, 2, 2, 'F');
          setDraw(220, 228, 245);
          doc.roundedRect(px, py, cellW, maxImgH + labelH + 4, 2, 2, 'S');
          setFill(...primary);
          doc.roundedRect(px + 2, py + 2, 12, 6, 1, 1, 'F');
          setFont('bold', 6); setColor(255, 255, 255);
          doc.text(`#${i + 1}`, px + 4.5, py + 6.2);
          try {
            if (f.isPreviewable) {
              const pagesToRender = f.imgDataUris || [f.imgDataUri];
              for (let pi = 0; pi < pagesToRender.length; pi++) {
                if (pi > 0) {
                  doc.addPage();
                  setFill(...primary);
                  doc.rect(0, 0, pageW, 12, 'F');
                  setFont('bold', 9); setColor(255, 255, 255);
                  doc.text(`${group.label} (continued — pg ${pi + 1})`, margin, 8.5);
                  py = 18; px = padX; col = 0;
                }
                const pageUri = pagesToRender[pi];
                const imgProps = doc.getImageProperties(pageUri);
                const maxW = cellW - 6;
                const ratio = Math.min(maxW / imgProps.width, maxImgH / imgProps.height);
                const imgW = imgProps.width * ratio;
                const imgH = imgProps.height * ratio;
                const imgX = px + (cellW - imgW) / 2;
                doc.addImage(pageUri, 'JPEG', imgX, py + 4, imgW, imgH, `img_${globalImgIndex++}`, 'FAST');
              }
            } else {
              // Word / Excel / Text / unsupported — show placeholder card
              drawPlaceholderCard(f, px + cellW / 2, py + maxImgH / 2, cellW - 8, maxImgH - 4);
            }
          } catch {
            setFont('normal', 8); setColor(180, 0, 0);
            doc.text('Preview unavailable', px + 4, py + maxImgH / 2);
          }
          const cellLabel = f.fileName || 'document';
          const shortName = cellLabel.length > 30 ? cellLabel.substring(0, 28) + '…' : cellLabel;
          setFont('normal', 7); setColor(80, 90, 120);
          doc.text(shortName, px + cellW / 2, py + maxImgH + 8, { align: 'center' });
          col++;
          if (col >= cols) {
            col = 0; px = padX; py += maxImgH + labelH + gapY;
          } else {
            px += cellW + gapX;
          }
        }
      }
    }

    if (missingGroups.length > 0) {
      doc.addPage();
      y = 20;
      drawSectionHeader('NOT UPLOADED DOCUMENTS');
      missingGroups.forEach(g => {
        checkNewPage(8);
        setFont('normal', 9); setColor(130, 130, 130);
        doc.text(`• ${g.label}`, margin, y);
        y += 8;
      });
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      setFill(...primary);
      doc.rect(0, pageH - 10, pageW, 10, 'F');
      setFont('normal', 7); setColor(200, 215, 255);
      doc.text(`User Profile — ${fullName(item)}`, margin, pageH - 4);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 16, pageH - 4);
    }

    doc.save(`User_Profile_${fullName(item).replace(/\s+/g, '_')}.pdf`);
    toast.success(`PDF downloaded for ${fullName(item)}`);
  } catch (err) {
    console.error(err);
    toast.error('Failed to generate PDF');
  }
};
// Add this helper near the top of DocumentMultiUploadCard (or as a module-level util)
const base64ToBlobUrl = (dataUri, mimeType) => {
  try {
    const base64 = dataUri.includes('base64,') ? dataUri.split('base64,')[1] : dataUri;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};
// Compute all blob/view URLs once per files change — NOT inside .map()

// ─── DocumentMultiUploadCard ──────────────────────────────────────────────────
const DocumentMultiUploadCard = memo(function DocumentMultiUploadCard({
  docKey, label, icon, files = [], onChange, onRemove, onLabelChange,
  isEditing, onUpdate, isUpdating, required
}) {
  const inputRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

const viewUrls = useMemo(() => {
  return files.map((f) => {
    if (f instanceof File) return URL.createObjectURL(f);
    if (!(f instanceof File) && f?.data) {
      const name = f.fileName || '';
      const isPdf = /\.pdf$/i.test(name);
      const isDoc = /\.(doc|docx)$/i.test(name);
      const isXls = /\.(xls|xlsx)$/i.test(name);
      const mime = isPdf ? 'application/pdf'
        : isDoc ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : isXls ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/octet-stream';
      return base64ToBlobUrl(f.data, mime);
    }
    // NEW: server docs only ever carry {fileName, path, label}
    if (!(f instanceof File) && f?.path) {
      return workerDocUrl(f.path);
    }
    return null;
  });
}, [files]);

  useEffect(() => {
    return () => {
      viewUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [viewUrls]);

  const handleAdd = useCallback((e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    onChange(newFiles);
    e.target.value = '';
  }, [onChange]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer?.files || []);
    if (dropped.length === 0) return;
    onChange(dropped);
  }, [onChange]);

const handleDownload = useCallback((f, e) => {
  e.stopPropagation();
  const isServerDoc = !(f instanceof File) && f.fileName;
  if (!isServerDoc) return;
  if (f.data) {
    const a = document.createElement('a');
    a.href = f.data.includes('base64,') ? f.data : `data:application/octet-stream;base64,${f.data}`;
    a.download = f.fileName || 'document';
    a.click();
  } else if (f.path) {           // NEW
    const a = document.createElement('a');
    a.href = workerDocUrl(f.path);
    a.download = f.fileName || 'document';
    a.click();
  }
}, []);
const getPreview = (f) => {
  if (f instanceof File && f.type?.startsWith('image/')) return URL.createObjectURL(f);
  const isServerDoc = !(f instanceof File) && f.fileName;
  if (isServerDoc) {
    const isImg = /\.(jpg|jpeg|png|gif|webp)/i.test(f.fileName || '');
    if (isImg) {
      if (f.data) return f.data.includes('base64,') ? f.data : `data:image/jpeg;base64,${f.data}`;
      if (f.path) return workerDocUrl(f.path);   // NEW
    }
  }
  return null;
};

  const hasFiles = files.length > 0;
  const isOther = docKey === 'otherDocument';
  // Check if there are any new (unsaved) files pending
  const hasPendingFiles = files.some(f => f instanceof File);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        // background: '#fff',
        border: `1.5px ${isDragging ? 'dashed' : 'solid'} ${isDragging ? primaryColor : '#e2e8f0'}`,
        borderRadius: '10px', padding: '14px', marginBottom: '4px',
        height: '100%', boxSizing: 'border-box',
        background: isDragging ? `${primaryColor}08` : '#fff',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative'
      }}
    >
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '6px', background: `${primaryColor}10`, borderRadius: '10px',
          pointerEvents: 'none'
        }}>
          <FaUpload style={{ fontSize: '22px', color: primaryColor }} />
          <div style={{ fontSize: '12px', fontWeight: '600', color: primaryColor }}>
            Drop files to attach to {label}
          </div>
        </div>
      )}
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: `${primaryColor}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: primaryColor, fontSize: '13px', flexShrink: 0
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748', lineHeight: '1.2' }}>
  {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
</div>
            <div style={{ fontSize: '10px', color: '#a0aec0', marginTop: '1px' }}>
              {hasFiles ? `${files.length} file${files.length > 1 ? 's' : ''} attached` : 'No files yet'}
              {hasPendingFiles && (
                <span style={{
                  marginLeft: '6px', background: '#fef3c7', color: '#92400e',
                  fontSize: '9px', fontWeight: '700', borderRadius: '4px', padding: '1px 5px'
                }}>
                  Unsaved
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* UPDATE BUTTON — only shown in edit mode */}
          {isEditing && (
            <button
              type="button"
              onClick={() => onUpdate && onUpdate(docKey)}
              disabled={isUpdating}
              title={`Update ${label}`}
              style={{
                background: hasPendingFiles ? '#38a169' : `${primaryColor}15`,
                border: `1.5px solid ${hasPendingFiles ? '#38a169' : primaryColor}`,
                color: hasPendingFiles ? '#fff' : primaryColor,
                borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                flexShrink: 0, whiteSpace: 'nowrap',
                opacity: isUpdating ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isUpdating
                ? <><span className="spinner-border spinner-border-sm" style={{ width: '9px', height: '9px', borderWidth: '2px' }} /> Saving...</>
                : <><FaSync style={{ fontSize: '9px' }} /> Update</>
              }
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            style={{
              background: primaryColor, border: 'none', color: '#fff',
              borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              flexShrink: 0, whiteSpace: 'nowrap'
            }}
          >
            <FaUpload style={{ fontSize: '9px' }} /> Add
          </button>
        </div>
      </div>

      {/* File List */}
      {hasFiles ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((f, idx) => {
            const isServerDoc = !(f instanceof File) && f.fileName;
            const isNewFile = f instanceof File;
            const name = isNewFile ? f.name : f.fileName;
            const preview = getPreview(f);
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name || '');
            const isPdf = /\.pdf$/i.test(name || '');
            const isDoc = /\.(doc|docx)$/i.test(name || '');
            const isXls = /\.(xls|xlsx)$/i.test(name || '');
            const isTxt = /\.txt$/i.test(name || '');

            const fileColor = isPdf ? { bg: '#fff5f5', border: '#feb2b2', icon: '#e53e3e', label: 'PDF Document' }
              : isDoc ? { bg: '#ebf8ff', border: '#bee3f8', icon: '#3182ce', label: 'Word Document' }
                : isXls ? { bg: '#f0fff4', border: '#9ae6b4', icon: '#38a169', label: 'Excel Spreadsheet' }
                  : isTxt ? { bg: '#fffff0', border: '#faf089', icon: '#d69e2e', label: 'Text File' }
                    : isImage ? { bg: '#faf5ff', border: '#d6bcfa', icon: '#805ad5', label: 'Image' }
                      : { bg: '#faf5ff', border: '#d6bcfa', icon: '#805ad5', label: 'Document' };


            return (
              <div style={{
      border: `1px solid ${isServerDoc ? '#9ae6b4' : '#bee3f8'}`,
      borderRadius: '8px',
      background: isServerDoc ? '#f0fff4' : '#ebf8ff',
      overflow: 'hidden'
              }}>
                {isOther && (
                  <div style={{ padding: '8px 10px 0 10px' }}>
                    <input
                      type="text"
                      placeholder="Enter document name (e.g. Medical Certificate)"
                      value={f.label || ''}
                      onChange={e => onLabelChange(idx, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', fontSize: '11px', fontWeight: '600',
                        border: `1.5px solid ${f.label ? primaryColor : '#cbd5e0'}`,
                        borderRadius: '5px', padding: '5px 8px',
                        color: '#2d3748', background: '#fff',
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                    {!f.label && (
                      <div style={{ fontSize: '10px', color: '#e53e3e', marginTop: '3px', paddingLeft: '2px' }}>
                        ⚠ Label required for PDF heading
                      </div>
                    )}
                  </div>
                )}

                {isImage && preview ? (
                  <div style={{ padding: '8px 10px 0 10px' }}>
                    <img
                      src={preview}
                      alt={name}
                      style={{
                        width: '100%', maxHeight: '140px', objectFit: 'contain',
                        borderRadius: '6px', border: '1px solid #e2e8f0',
                        background: '#f7fafc', display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    margin: '8px 10px 0 10px', background: fileColor.bg,
                    border: `1px solid ${fileColor.border}`, borderRadius: '7px',
                    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '8px',
                      background: '#fff', border: `1.5px solid ${fileColor.border}`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, gap: '2px'
                    }}>
                      <span style={{ fontSize: '18px', color: fileColor.icon, lineHeight: 1 }}>
                        {getDocFileIcon(f)}
                      </span>
                      <span style={{ fontSize: '7px', fontWeight: '700', color: fileColor.icon, letterSpacing: '0.5px' }}>
                        {isPdf ? 'PDF' : isDoc ? 'DOC' : isXls ? 'XLS' : isTxt ? 'TXT' : 'FILE'}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '600', color: '#2d3748',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '10px', color: fileColor.icon, marginTop: '2px', fontWeight: '500' }}>
                        {fileColor.label}
                      </div>
                      {f instanceof File && (
                        <div style={{ fontSize: '10px', color: '#718096', marginTop: '1px' }}>
                          {(f.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                    {viewUrls[idx] && (
                        <a
                        href={viewUrls[idx]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: fileColor.icon, color: '#fff',
                          border: 'none', borderRadius: '5px',
                          padding: '5px 10px', fontSize: '10px', fontWeight: '600',
                          cursor: 'pointer', textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          flexShrink: 0, whiteSpace: 'nowrap'
                        }}
                      >
                        <FaFileAlt style={{ fontSize: '9px' }} /> View
                      </a>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px 8px 10px'
                }}>
                  <div style={{
                    fontSize: '10px', color: isServerDoc ? '#38a169' : '#3182ce',
                    display: 'flex', alignItems: 'center', gap: '4px', flex: 1
                  }}>
                    <span style={{
                      display: 'inline-block', width: '5px', height: '5px',
                      borderRadius: '50%', background: isServerDoc ? '#38a169' : '#3182ce', flexShrink: 0
                    }} />
                    {isServerDoc ? 'Saved' : 'Pending save'}
                  </div>
                  <span style={{
                    background: `${primaryColor}20`, color: primaryColor,
                    fontSize: '9px', fontWeight: '700', borderRadius: '4px',
                    padding: '2px 5px', flexShrink: 0
                  }}>
                    {idx + 1}/{files.length}
                  </span>
                  {isServerDoc && (
                    <button type="button" title="Download"
                      onClick={(e) => handleDownload(f, e)}
                      style={{
                        background: '#f0fff4', border: '1px solid #9ae6b4',
                        color: '#38a169', cursor: 'pointer',
                        borderRadius: '5px', padding: '4px 6px', fontSize: '11px',
                        display: 'flex', alignItems: 'center'
                      }}>
                      <FaDownload />
                    </button>
                  )}
                  <button type="button" title="Remove"
                    onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                    style={{
                      background: '#fff5f5', border: '1px solid #feb2b2',
                      color: '#e53e3e', cursor: 'pointer',
                      borderRadius: '5px', padding: '4px 6px', fontSize: '11px',
                      display: 'flex', alignItems: 'center'
                    }}>
                    <FaTimesCircle />
                  </button>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => inputRef.current.click()}
            style={{
              border: '1.5px dashed #cbd5e0', borderRadius: '7px',
              padding: '7px', cursor: 'pointer', background: '#fafafa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '5px', color: '#a0aec0', fontSize: '11px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = `${primaryColor}08`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.background = '#fafafa'; }}
          >
            <FaPlus style={{ fontSize: '9px' }} /> Add more files
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current.click()}
          style={{
            border: '1.5px dashed #cbd5e0', borderRadius: '8px',
            padding: '18px 10px', cursor: 'pointer', background: '#fafafa',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '6px', color: '#a0aec0', fontSize: '12px', textAlign: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = `${primaryColor}08`; e.currentTarget.style.color = primaryColor; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = '#a0aec0'; }}
        >
          <FaUpload style={{ fontSize: '18px' }} />
          <div>
            <div style={{ fontWeight: '500', fontSize: '12px' }}>Click to upload</div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>JPG, PNG, PDF, DOC, XLSX, TXT</div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        style={{ display: 'none' }}
        onChange={handleAdd}
      />
    </div>
  );
});

// ─── Memoized table row ───────────────────────────────────────────────────────
const UserRow = memo(function UserRow({ userItem, isSelected, onRowClick, onDownload, downloadingId, primaryColor }) {
  const avatarSrc = useMemo(() => {
    const raw = userItem.IMAGE ?? userItem.image ?? null;
    if (!raw) return null;
    if (typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data))
      return bufferToBase64(raw, 'image/jpeg');
    if (typeof raw === 'string' && raw.length > 0)
      return raw.includes('base64,') ? raw : `data:image/jpeg;base64,${raw}`;
    return null;
  }, [userItem.IMAGE, userItem.image]);

  const statusLabel = userItem.AllocationStatus || userItem.ProjectAllocationStatus;
  const isOnHire = statusLabel === 'onhire' || statusLabel === 1 || statusLabel === '1';
  const isOffHire = statusLabel === 'offhire' || statusLabel === 0 || statusLabel === '0';

  return (
    <tr
      onClick={() => onRowClick(userItem)}
      style={{
        cursor: 'pointer', transition: 'background 0.15s',
        borderLeft: isSelected ? `4px solid ${primaryColor}` : '4px solid transparent'
      }}
      className="align-middle"
    >
      {/* HAVEN ID */}
      <td className="py-3 px-4" style={{ fontSize: '13px', fontWeight: '500', color: '#4a5568', whiteSpace: 'nowrap' }}>
        HAV/{userItem.UserId}
      </td>

      {/* Name */}
      <td className="py-3 px-4">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '34px', height: '34px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt={userItem.Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FaUser style={{ color: primaryColor, fontSize: '14px' }} />
            }
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#2d3748' }}>{fullName(userItem)}</div>
            <div style={{ fontSize: '11px', color: '#a0aec0' }}>{userItem.Email || ''}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3 px-4">
        {userItem.RoleName
          ? <span style={{
            background: `${primaryColor}12`, color: primaryColor,
            fontSize: '11px', fontWeight: '600', borderRadius: '6px',
            padding: '3px 10px', whiteSpace: 'nowrap'
          }}>{userItem.RoleName}</span>
          : <span style={{ color: '#a0aec0', fontSize: '12px' }}>—</span>
        }
      </td>

      {/* Supplier */}
      <td className="py-3 px-4" style={{ fontSize: '13px', color: '#4a5568', whiteSpace: 'nowrap' }}>
        {userItem.SupplierName || userItem.AccountName || '—'}
      </td>

      {/* Project */}
      <td className="py-3 px-4" style={{ fontSize: '13px', color: '#4a5568' }}>
        {userItem.ProjectName || '—'}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        {isOnHire ? (
          <span style={{
            background: '#c6f6d5', color: '#276749',
            fontSize: '11px', fontWeight: '700', borderRadius: '20px',
            padding: '3px 10px', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38a169', display: 'inline-block' }} />
            On Hire
          </span>
        ) : isOffHire ? (
          <span style={{
            background: '#fed7d7', color: '#9b2c2c',
            fontSize: '11px', fontWeight: '700', borderRadius: '20px',
            padding: '3px 10px', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e53e3e', display: 'inline-block' }} />
            Off Hire
          </span>
        ) : (
          <span style={{ color: '#a0aec0', fontSize: '12px' }}>—</span>
        )}
      </td>

      {/* PDF Download */}
      <td className="py-3 text-center px-4" onClick={e => e.stopPropagation()}>
        <button
          title={`Download PDF for ${userItem.Name}`}
          onClick={(e) => onDownload(e, userItem)}
          disabled={downloadingId === userItem.UserId}
          style={{
            background: 'none', border: `1.5px solid ${primaryColor}`,
            borderRadius: '6px', color: primaryColor,
            width: '32px', height: '32px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: downloadingId === userItem.UserId ? 'not-allowed' : 'pointer',
            opacity: downloadingId === userItem.UserId ? 0.6 : 1,
            transition: 'all 0.15s', padding: 0,
          }}
          onMouseEnter={e => { if (downloadingId !== userItem.UserId) { e.currentTarget.style.background = primaryColor; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = primaryColor; }}
        >
          {downloadingId === userItem.UserId
            ? <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            : <FaDownload style={{ fontSize: '13px' }} />
          }
        </button>
      </td>
    </tr>
  );
});

// ─── useDebounce hook ─────────────────────────────────────────────────────────
function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
const VehiclePickerModal = memo(function VehiclePickerModal({
  rowId, vehicles = [], onSelect, onClose, primaryColor,
  currentVehicleID, currentVehicleStartDate = '', currentVehicleEndDate = ''
}) {
  const [selectedVehicle, setSelectedVehicle] = useState(currentVehicleID || '');
  const [vehicleStartDate, setVehicleStartDate] = useState(currentVehicleStartDate);
  const [vehicleEndDate, setVehicleEndDate] = useState(currentVehicleEndDate);

  const selectedVehicleObj = vehicles.find(v => String(v.VehicleID) === String(selectedVehicle));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '14px',
          width: '500px', maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          background: primaryColor, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            Select Vehicle &amp; Dates
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: '6px', width: '28px', height: '28px',
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* Vehicle picker */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px', display: 'block' }}>
              VEHICLE
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {vehicles.length === 0 && (
                <div style={{ fontSize: '13px', color: '#a0aec0' }}>No vehicles available for this project.</div>
              )}
              {vehicles.map(v => {
                const isSelected = String(v.VehicleID) === String(selectedVehicle);
                return (
                  <button
                    key={v.VehicleID}
                    type="button"
                    onClick={() => setSelectedVehicle(String(v.VehicleID))}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: isSelected ? '700' : '500', cursor: 'pointer',
                      border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                      background: isSelected ? `${primaryColor}12` : '#f8fafc',
                      color: isSelected ? primaryColor : '#4a5568',
                      transition: 'all 0.15s'
                    }}
                  >
                    {v.VehicleNumber}
                    {String(v.VehicleID) === String(currentVehicleID) && (
                      <span style={{
                        marginLeft: '6px', fontSize: '9px', background: '#bee3f8',
                        color: '#2b6cb0', borderRadius: '4px', padding: '1px 4px', fontWeight: '700'
                      }}>current</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '16px' }} />

          {/* Date range */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px', display: 'block' }}>
              VEHICLE ASSIGNMENT DATES
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px', display: 'block' }}>
                  Start date
                </label>
                <input
                  type="date"
                  value={vehicleStartDate}
                  max={vehicleEndDate || ''}
                  onChange={e => {
                    setVehicleStartDate(e.target.value);
                    if (vehicleEndDate && e.target.value > vehicleEndDate) setVehicleEndDate('');
                  }}
                  style={{
                    width: '100%', fontSize: '13px', border: '1.5px solid #dee2e6',
                    borderRadius: '7px', padding: '7px 10px', boxSizing: 'border-box',
                    color: '#2d3748', outline: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px', display: 'block' }}>
                  End date
                </label>
                <input
                  type="date"
                  value={vehicleEndDate}
                  min={vehicleStartDate || ''}
                  onChange={e => {
                    if (vehicleStartDate && e.target.value < vehicleStartDate) return;
                    setVehicleEndDate(e.target.value);
                  }}
                  style={{
                    width: '100%', fontSize: '13px',
                    border: `1.5px solid #dee2e6`,
                    borderRadius: '7px', padding: '7px 10px', boxSizing: 'border-box',
                    color: '#2d3748', outline: 'none'
                  }}
                />

              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {currentVehicleID && (
              <button
                type="button"
                onClick={() => onSelect(rowId, '', '', '')}
                style={{
                  padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer',
                  background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#e53e3e'
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button" onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer',
                background: '#f7fafc', border: '1.5px solid #e2e8f0', color: '#718096'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedVehicle}
              onClick={() => {
                if (selectedVehicle) {
                  onSelect(rowId, selectedVehicle, vehicleStartDate, vehicleEndDate);
                }
              }}
              style={{
                padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
                fontWeight: '600', cursor: selectedVehicle ? 'pointer' : 'not-allowed',
                background: selectedVehicle ? primaryColor : '#e2e8f0',
                border: 'none',
                color: selectedVehicle ? '#fff' : '#a0aec0',
                transition: 'all 0.2s'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const BedPickerModal = memo(function BedPickerModal({
  rowId, rooms = [], onSelect, onClose, primaryColor,
  currentRoomID, currentBedID,
  currentCampStartDate = '', currentCampEndDate = ''   // ← NEW
}) {
  const [selectedRoom, setSelectedRoom] = useState(currentRoomID || '');
  const [selectedBed, setSelectedBed] = useState(currentBedID || '');
  const [campStartDate, setCampStartDate] = useState(currentCampStartDate);  // ← NEW
  const [campEndDate, setCampEndDate] = useState(currentCampEndDate);    // ← NEW

  const beds = useMemo(() => {
    if (!selectedRoom) return [];
    const room = rooms.find(r => String(r.RoomID) === String(selectedRoom));
    return (room?.beds || []).filter(b => b.Status === 'Available' || String(b.BedID) === String(currentBedID));
  }, [selectedRoom, rooms, currentBedID]);

  const selectedBedObj = beds.find(b => String(b.BedID) === String(selectedBed));
  const selectedRoomObj = rooms.find(r => String(r.RoomID) === String(selectedRoom));
  const noRoomsAvailable = rooms.length === 0;   // ← ADD THIS LINE

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '14px',
          width: '540px', maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          background: primaryColor, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            Select Room &amp; Bed
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: '6px', width: '28px', height: '28px',
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── Camp Stay Dates (NEW) ── */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px', display: 'block' }}>
              CAMP STAY DATES
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px', display: 'block' }}>
                  Start date
                </label>
                <input
                  type="date"
                  value={campStartDate}
                  max={campEndDate || ''}
                  onChange={e => {
                    setCampStartDate(e.target.value);
                    if (campEndDate && e.target.value > campEndDate) setCampEndDate('');
                  }}
                  style={{
                    width: '100%', fontSize: '13px', border: '1.5px solid #dee2e6',
                    borderRadius: '7px', padding: '7px 10px', boxSizing: 'border-box',
                    color: '#2d3748', outline: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px', display: 'block' }}>
                  End date
                </label>
                <input
                  type="date"
                  value={campEndDate}
                  min={campStartDate || ''}
                  onChange={e => {
                    if (campStartDate && e.target.value < campStartDate) return;
                    setCampEndDate(e.target.value);
                  }}
                  style={{
                    width: '100%', fontSize: '13px', border: `1.5px solid #dee2e6`,
                    borderRadius: '7px', padding: '7px 10px', boxSizing: 'border-box',
                    color: '#2d3748', outline: 'none'
                  }}
                />

              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '16px' }} />

          {/* Room picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '6px', display: 'block' }}>
              ROOM
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {rooms.length === 0 && (
                <div style={{ fontSize: '13px', color: '#a0aec0' }}>No rooms available for this camp.</div>
              )}
              {rooms.map(r => {
                const availCount = (r.beds || []).filter(b => b.Status === 'Available').length;
                const isSelected = String(r.RoomID) === String(selectedRoom);
                return (
                  <button
                    key={r.RoomID}
                    type="button"
                    onClick={() => { setSelectedRoom(String(r.RoomID)); setSelectedBed(''); }}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: isSelected ? '700' : '500', cursor: 'pointer',
                      border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                      background: isSelected ? `${primaryColor}12` : '#f8fafc',
                      color: isSelected ? primaryColor : '#4a5568',
                      transition: 'all 0.15s'
                    }}
                  >
                    {r.RoomNo}
                    <span style={{
                      marginLeft: '6px', fontSize: '10px', fontWeight: '600',
                      background: availCount > 0 ? '#c6f6d5' : '#fed7d7',
                      color: availCount > 0 ? '#276749' : '#9b2c2c',
                      borderRadius: '10px', padding: '1px 6px'
                    }}>
                      {availCount} free
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bed picker */}
          {selectedRoom && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '6px', display: 'block' }}>
                BED — {selectedRoomObj?.RoomNo}
              </label>
              {beds.length === 0 ? (
                <div style={{
                  fontSize: '13px', color: '#a0aec0', background: '#f8fafc',
                  borderRadius: '8px', padding: '12px', textAlign: 'center'
                }}>
                  No available beds in this room.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {beds.map(b => {
                    const isSelected = String(b.BedID) === String(selectedBed);
                    const isCurrentlyAssigned = String(b.BedID) === String(currentBedID);
                    return (
                      <button
                        key={b.BedID}
                        type="button"
                        onClick={() => setSelectedBed(String(b.BedID))}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                          fontWeight: isSelected ? '700' : '500', cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#38a169' : '#e2e8f0'}`,
                          background: isSelected ? '#f0fff4' : '#f8fafc',
                          color: isSelected ? '#276749' : '#4a5568',
                          transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {b.BedNo}
                        <span style={{ fontSize: '10px', color: '#a0aec0' }}>({b.BedType})</span>
                        {isCurrentlyAssigned && (
                          <span style={{
                            fontSize: '9px', background: '#bee3f8', color: '#2b6cb0',
                            borderRadius: '4px', padding: '1px 4px', fontWeight: '700'
                          }}>current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(selectedBed || noRoomsAvailable) && !campStartDate && (
  <div style={{
    background: '#fff5f5', border: '1px solid #feb2b2',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
    fontSize: '12px', color: '#c53030'
  }}>
    ⚠ Please set a camp start date before confirming this bed assignment.
  </div>
)}

         {/* Actions */}
<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
  {(currentRoomID || currentBedID) && (
    <button
      type="button"
      onClick={() => onSelect(rowId, '', '', '', '')}
      style={{
        padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
        fontWeight: '600', cursor: 'pointer',
        background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#e53e3e'
      }}
    >
      Clear
    </button>
  )}
  <button
    type="button" onClick={onClose}
    style={{
      padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
      fontWeight: '600', cursor: 'pointer',
      background: '#f7fafc', border: '1.5px solid #e2e8f0', color: '#718096'
    }}
  >
    Cancel
  </button>
  <button
    type="button"
    disabled={(!noRoomsAvailable && !selectedBed) || !campStartDate}
    onClick={() => {
      if (campStartDate && (selectedBed || noRoomsAvailable)) {
        onSelect(rowId, selectedRoom, selectedBed, campStartDate, campEndDate);
      }
    }}
    style={{
      padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
      fontWeight: '600',
      cursor: ((noRoomsAvailable || selectedBed) && campStartDate) ? 'pointer' : 'not-allowed',
      background: ((noRoomsAvailable || selectedBed) && campStartDate) ? primaryColor : '#e2e8f0',
      border: 'none',
      color: ((noRoomsAvailable || selectedBed) && campStartDate) ? '#fff' : '#a0aec0',
      transition: 'all 0.2s'
    }}
  >
    Confirm
  </button>
</div>
        </div>
      </div>
    </div>
  );
});

const RateHistoryModal = memo(function RateHistoryModal({ history = [], loading, onClose, primaryColor, roleList = [] }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '14px', width: '520px', maxWidth: '95vw',
        maxHeight: '80vh', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: primaryColor, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            Rate / Salary History
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: '6px', width: '28px', height: '28px',
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm" style={{ color: primaryColor }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: '13px', padding: '20px 0' }}>
              No rate revisions recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(h => {
                const roleName = roleList.find(r => String(r.RoleID) === String(h.UserRoleId))?.RoleName;
                return (
                  <div key={h.RateHistoryId} style={{
                    border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#2d3748', fontSize: '14px' }}>
                        {h.Amount?.toLocaleString?.() ?? h.Amount}
                      </span>
                      <span style={{ fontSize: '11px', color: '#718096' }}>
                        {formatDate(h.EffectiveDate)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                      {roleName || 'N/A'}
                    </div>
                    {h.Remarks && (
                      <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>{h.Remarks}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
const CampReallocateModal = memo(function CampReallocateModal({
  rowId, campsByProject = [], currentCampID, onSelect, onClose, primaryColor
}) {
  const [selectedCamp, setSelectedCamp] = useState('');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '14px',
        width: '480px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
      }}>
        <div style={{
          background: primaryColor, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            Reallocate Camp
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: '#fff', borderRadius: '6px', width: '28px', height: '28px',
            cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#fff8e1', border: '1px solid #ffe082',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            fontSize: '12px', color: '#795548'
          }}>
            ⚠ The current camp history will be preserved. A new camp allocation will be created.
          </div>

          <label style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px', display: 'block' }}>
            SELECT NEW CAMP
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
            {campsByProject.length === 0 && (
              <div style={{ fontSize: '13px', color: '#a0aec0' }}>No other camps available for this project.</div>
            )}
            {campsByProject
              .filter(c => String(c.CampID) !== String(currentCampID))
              .map(c => {
                const isSelected = String(c.CampID) === String(selectedCamp);
                return (
                  <button key={c.CampID} type="button"
                    onClick={() => setSelectedCamp(String(c.CampID))}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: isSelected ? '700' : '500', cursor: 'pointer',
                      border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                      background: isSelected ? `${primaryColor}12` : '#f8fafc',
                      color: isSelected ? primaryColor : '#4a5568',
                      transition: 'all 0.15s'
                    }}>
                    {c.CampName}
                  </button>
                );
              })}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
              background: '#f7fafc', border: '1.5px solid #e2e8f0', color: '#718096'
            }}>Cancel</button>
            <button type="button"
              disabled={!selectedCamp}
              onClick={() => selectedCamp && onSelect(rowId, selectedCamp)}
              style={{
                padding: '9px 18px', borderRadius: '7px', fontSize: '13px',
                fontWeight: '600', cursor: selectedCamp ? 'pointer' : 'not-allowed',
                background: selectedCamp ? primaryColor : '#e2e8f0',
                border: 'none',
                color: selectedCamp ? '#fff' : '#a0aec0',
                transition: 'all 0.2s'
              }}>
              Confirm Reallocation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
function UserInfo() {
  
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
const [filterSupplier, setFilterSupplier] = useState('');
const [filterTrade, setFilterTrade] = useState('');
const [filterProject, setFilterProject] = useState('');
const [filterStatus, setFilterStatus] = useState('');
const [filterHavenId, setFilterHavenId] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [companyList, setCompanyList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [sponsorList, setSponsorList] = useState([]);
  const [subSponsorList, setSubSponsorList] = useState({});
  const [clientList, setClientList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [allocations, setAllocations] = useState([
    {
      id: Date.now(), dbId: null, clientID: '', projectID: '', startDate: '', endDate: '',
      campID: '', vehicleID: '', roomID: '', bedID: '', status: '', remark: '',
      saved: false, campFilterByProject: true, vehicleFilterByProject: true,
      campStartDate: '', campEndDate: ''   // ← ADD
    }
  ]);

  const [projectsByClient, setProjectsByClient] = useState({});
  const [openClientDropdown, setOpenClientDropdown] = useState(null); // tracks which row's client dropdown is open
  const [campList, setCampList] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);

  const [docsLoading, setDocsLoading] = useState(false);
  // NEW: track which doc card is currently updating (key → bool)
  const [updatingDocKey, setUpdatingDocKey] = useState(null);
  const [savingRate, setSavingRate] = useState(false);
  const [subSponsorDropdownOpen, setSubSponsorDropdownOpen] = useState(false);
const subSponsorDropdownRef = useRef(null);
  const [showRateHistory, setShowRateHistory] = useState(false);
  const [rateHistory, setRateHistory] = useState([]);
  const [loadingRateHistory, setLoadingRateHistory] = useState(false);

  const [documents, setDocuments] = useState(emptyDocs());
  const { getPermission, refreshPermissions } = usePermission();
  const permission = getPermission("WORKERS");
  const canView = !!permission?.CanView;
  const canAdd = !!permission?.CanAdd;
  const canEdit = !!permission?.CanEdit;
  const canDelete = !!permission?.CanDelete;
  const canExport = !!permission?.CanExport;

  const [user, setUser] = useState({
    UserId: 0, Name: '', MName: '', LName: '', Sex: '', Address: '', Place: '',
    District: '', Mobile: '', Email: '', UserName: '',
    Password: '', ConformPassword: '', image: null,
    CompanyID: '', BranchID: '', UserRoleId: '',
    BadgeNo: '', EIDNo: '', EIDExpiryDate: '', PPNo: '',
    PPExpiryDate: '', VisaNo: '', VisaExpiryDate: '',
    InsuranceNo: '', InsuranceExpiryDate: '',
    GatePassNo: '', GatePassExpiryDate: '',
    WorkmenCompNo: '', WorkmenCompExpiryDate: '',
    ProfLicenseNo: '', ProfLicenseExpiryDate: '', Country: '', SubSponsorID: [],
    PaymentMode: []
  });

  const [userData, setUserData] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [isHavenWorker, setIsHavenWorker] = useState(false);
  const [countryList, setCountryList] = useState([]);
  const [employeeCategoryList, setEmployeeCategoryList] = useState([]);
  const [roomsByAllocation, setRoomsByAllocation] = useState({}); // rowId → rooms[]
  const [bedsByAllocation, setBedsByAllocation] = useState({}); // rowId → beds[]
  const [bedPickerRow, setBedPickerRow] = useState(null); // { rowId, campID }
  const [vehiclePickerRow, setVehiclePickerRow] = useState(null);
  

  const [unlinkedCamps, setUnlinkedCamps] = useState([]);
  const [campReallocateRow, setCampReallocateRow] = useState(null);
  const handleCampReallocate = useCallback(async (rowId, newCampID) => {
    const row = allocations.find(r => r.id === rowId);
    if (!row) return;

    try {
      // 1. Save history FIRST — dedicated history endpoint
      if (row.dbId) {
        await api.post('/api/SaveCampAllocationHistory', {
          WorkerAllocationId: row.dbId,
          NewCampID: parseInt(newCampID),
          ChangedBy: parseInt(sessionStorage.getItem("UserId")),
          Remarks: `Reallocated from Camp #${row.campID} to Camp #${newCampID}`,
        });
      }

      // 2. Release old bed if any
      if (row.bedID) {
        await api.post('/api/AssignBedToWorker', {
          UserID: user.UserId,
          NewBedID: null,
          OldBedID: parseInt(row.bedID),
        });
      }

      // 3. Update the current allocation row in DB with new camp
      await api.post('/api/InsertUpdateProjectAllocation', {
        WorkerAllocationId: row.dbId || 0,
        UserId: user.UserId,
        ClientId: parseInt(row.clientID),
        ProjectId: parseInt(row.projectID),
        CampID: parseInt(newCampID),  // ← new camp
        RoomID: null,                  // ← clear room
        BedID: null,                   // ← clear bed
        StartDate: row.startDate || null,
        EndDate: row.endDate || null,
        VehicleId: row.vehicleID ? parseInt(row.vehicleID) : null,
        ProjectAllocationStatus: row.status === 'onhire' ? 1 : row.status === 'offhire' ? 0 : null,
        Remarks: row.remark || null,
        CampFilterByProject: row.campFilterByProject ? 1 : 0,
        VehicleFilterByProject: row.vehicleFilterByProject ? 1 : 0,   // ← NEW
        CampStartDate: new Date().toISOString().split('T')[0], // reset start date
        CampEndDate: null,
        VehicleStartDate: row.vehicleStartDate || null,
        VehicleEndDate: row.vehicleEndDate || null,
        ModifiedBy: sessionStorage.getItem("UserId"),
        ModifiedDate: new Date().toISOString(),
        CreatedBy: null,
        CreatedDate: null,
      });

      // 4. Update local state
      updateAllocation(rowId, 'campID', newCampID);
      updateAllocation(rowId, 'roomID', '');
      updateAllocation(rowId, 'bedID', '');
      updateAllocation(rowId, 'campStartDate', new Date().toISOString().split('T')[0]);
      updateAllocation(rowId, 'campEndDate', '');

      // 5. Load rooms for new camp
      await fetchRoomsByCamp(rowId, newCampID);

      toast.success("Camp reallocated. Please select a new room/bed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reallocate camp");
    }

    setCampReallocateRow(null);
  }, [allocations, user.UserId]);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (subSponsorDropdownRef.current && !subSponsorDropdownRef.current.contains(e.target)) {
      setSubSponsorDropdownOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const [unlinkedVehicles, setUnlinkedVehicles] = useState([]);
  

  const fetchUnlinkedVehicles = async () => {
    if (unlinkedVehicles.length > 0) return; // already loaded
    try {
      const res = await api.get('/api/GetUnlinkedVehicles');
      setUnlinkedVehicles(res.data.vehicles || []);
    } catch { toast.error("Failed to load unlinked vehicles"); }
  };

  const fetchUnlinkedCamps = async () => {
    if (unlinkedCamps.length > 0) return; // already loaded
    try {
      const res = await api.get('/api/GetUnlinkedCamps');
      setUnlinkedCamps(res.data.camps || []);
    } catch { toast.error("Failed to load unlinked camps"); }
  };

  const fetchRoomsByCamp = async (rowId, campID) => {
    if (!campID) return;
    try {
      const res = await api.get('/api/GetRoomsByCamp', { params: { CampID: campID } });
      const rooms = (res.data.rooms || []).filter(r =>
        (r.beds || []).some(b => !b.UserID)
      );
      setRoomsByAllocation(prev => ({ ...prev, [rowId]: rooms }));
    } catch { toast.error("Failed to load rooms"); }
  };

  const fetchBedsByRoom = async (rowId, roomID) => {
    if (!roomID) return;
    try {
      const res = await api.get('/api/GetBedsByRoom', { params: { RoomID: roomID } });
      const available = (res.data.beds || []).filter(b => !b.UserID);
      setBedsByAllocation(prev => ({ ...prev, [rowId]: available }));
    } catch { toast.error("Failed to load beds"); }
  };
  const handleVehiclePickerSelect = useCallback((rowId, vehicleID, vehicleStartDate, vehicleEndDate) => {
    updateAllocation(rowId, 'vehicleID', vehicleID);
    updateAllocation(rowId, 'vehicleStartDate', vehicleStartDate);
    updateAllocation(rowId, 'vehicleEndDate', vehicleEndDate);
    setVehiclePickerRow(null);
  }, []);
  const handleBedPickerSelect = useCallback((rowId, roomID, bedID, campStartDate, campEndDate) => {
    updateAllocation(rowId, 'roomID', roomID);
    updateAllocation(rowId, 'bedID', bedID);
    updateAllocation(rowId, 'campStartDate', campStartDate);
    updateAllocation(rowId, 'campEndDate', campEndDate);
    setBedPickerRow(null);
  }, []);
  const fetchEmployeeCategories = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/GetEmployeeCategoryList", {
        params: { CompanyID }
      });
      setEmployeeCategoryList(res.data || []);
    } catch {
      toast.error("Failed to load employee categories");
    }
  };

  useEffect(() => {
    fetch("https://api.countrystatecity.in/v1/countries", {
      headers: { "X-CSCAPI-KEY": "00dd47d2e22c4448871f7a6695224488df68502d3c8e17845bbcb815c81fc42d" }
    })
      .then(r => r.json())
      .then(data => setCountryList(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => toast.error("Failed to load countries"));
  }, []);


  const debouncedSearch = useDebounce(searchTerm, 200);

  // ── Derived state ──
  const isEditing = user.UserId !== 0;

  // ALL_TABS: used for edit mode (row click)
  // const ALL_TABS = [
  //   { key: 'personal', label: 'Personal Info', icon: <FaUser /> },
  //   { key: 'account', label: 'Allocation', icon: <FaIdCard /> },
  //   { key: 'id_docs', label: 'ID & Visa', icon: <FaPassport /> },
  //   { key: 'documents', label: 'Documents', icon: <FaFileAlt /> },
  // ];
    const ALL_TABS = [
    { key: 'personal', label: 'Personal Info', icon: <FaUser /> },
    { key: 'account', label: 'Allocation', icon: <FaIdCard /> },
    { key: 'id_docs', label: 'ID & Visa', icon: <FaPassport /> },
    { key: 'rentals', label: 'Rentals', icon: <FaBuilding /> },
    { key: 'documents', label: 'Documents', icon: <FaFileAlt /> },
  ];

  // CREATE_TABS: only 3 tabs for new user flow
  const CREATE_TABS = [
    { key: 'personal', label: 'Personal Info', icon: <FaUser /> },
    { key: 'account', label: 'Allocation', icon: <FaIdCard /> },
    { key: 'id_docs', label: 'ID & Visa', icon: <FaPassport /> },
  ];

  // The active tab set depends on mode
  const tabs = isEditing ? ALL_TABS : CREATE_TABS;

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);
    // ═══════════════════════════════════════════════════════════════
  // RENTALS / CHEQUE / CASH / TENANCY TAB
  // ═══════════════════════════════════════════════════════════════
  // const [rentalProperties, setRentalProperties] = useState([]);
  // const [selectedRentalPropertyId, setSelectedRentalPropertyId] = useState(null);
  // const [rentalUnits, setRentalUnits] = useState([]);
  // const [selectedRentalUnitId, setSelectedRentalUnitId] = useState('');
  // const [rentalId, setRentalId] = useState(null);
  // const [transactions, setTransactions] = useState([]);

  // const loadRentalProperties = async () => {
  //   try {
  //     const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
  //     const res = await api.get("/api/getPropertyInfo", { params: { CompanyID } });
  //     const rows = res.data?.data || res.data?.recordset || res.data?.properties || [];
  //     setRentalProperties(rows.map(p => ({
  //       id: p.PropertyID,
  //       name: p.PropertyName || p.PropertyCode || `Property #${p.PropertyID}`,
  //     })));
  //   } catch { toast.error("Failed to load properties"); }
  // };

  // const loadRentalUnits = async (propertyId) => {
  //   try {
  //     const res = await api.get("/api/getPropertyMaster", { params: { PropertyID: propertyId } });
  //     const rows = res.data?.data || res.data?.recordset || res.data?.units || [];
  //     setRentalUnits(rows.map(u => ({
  //       id: u.RecordID,
  //       name: u.FlatNumber || u.UnitNumber || `Unit #${u.RecordID}`,
  //     })));
  //   } catch { toast.error("Failed to load units"); }
  // };

  // const loadTransactions = async (RentID, PropertyID) => {
  //   try {
  //     const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
  //     const data = await getRentalTransactions({ CompanyID, PropertyID, RentID });
  //     const rows = data?.transactions || [];
  //     setTransactions(rows.length ? rows.map(t => ({
  //       id: t.TransactionID,
  //       transactionId: t.TransactionID,
  //       type: t.TransactionType,
  //       label: t.Label || t.TransactionType,
  //       amount: t.Amount ?? '',
  //       date: (t.TransactionDate || '').slice(0, 10),
  //       chequeNo: t.ChequeNo || '',
  //       cashReference: t.CashReference || '',
  //       tenancyStartDate: (t.TenancyStartDate || '').slice(0, 10),
  //       tenancyEndDate: (t.TenancyEndDate || '').slice(0, 10),
  //       tenancyNotes: t.TenancyNotes || '',
  //       notes: t.Notes || '',
  //       file: null,
  //       path: t.Path || null,
  //     })) : [
  //       { id: Date.now(), transactionId: 0, type: 'Cheque', label: 'Cheque 1',
  //         amount: '', date: '', chequeNo: '', cashReference: '',
  //         tenancyStartDate: '', tenancyEndDate: '', tenancyNotes: '', notes: '',
  //         file: null, path: null },
  //     ]);
  //   } catch { toast.error("Failed to load transactions"); }
  // };

  // const addTransaction = (type) => {
  //   setTransactions(prev => {
  //     const count = prev.filter(t => t.type === type).length + 1;
  //     return [...prev, {
  //       id: Date.now(),
  //       transactionId: 0,
  //       type,
  //       label: type === 'Cheque' ? `Cheque ${count}` : `${type} ${count}`,
  //       amount: '', date: '',
  //       chequeNo: '',
  //       cashReference: '',
  //       tenancyStartDate: '', tenancyEndDate: '', tenancyNotes: '',
  //       notes: '',
  //       file: null, path: null,
  //     }];
  //   });
  // };

  // const updateTransaction = (id, field, value) =>
  //   setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  // const removeTransaction = (id) =>
  //   setTransactions(prev => prev.filter(t => t.id !== id));

  // const handleDeleteTransaction = async (row) => {
  //   if (!row.transactionId) { removeTransaction(row.id); return; }
  //   try {
  //     const data = await deleteRentalTransaction({
  //       TransactionID: row.transactionId,
  //       UserID: Number(sessionStorage.getItem("UserId")),
  //     });
  //     if (data?.success) { removeTransaction(row.id); toast.success("Deleted"); }
  //     else toast.error(data?.message || "Delete failed");
  //   } catch { toast.error("Delete failed"); }
  // };

  // const handleSaveTransactions = async () => {
  //   if (!user.UserId) { toast.error("Save the worker first"); return; }
  //   if (!selectedRentalPropertyId || !selectedRentalUnitId) {
  //     toast.error("Select property and unit"); return;
  //   }
  //   const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
  //   const UserID    = Number(sessionStorage.getItem("UserId")) || 0;
  //   try {
  //     const rRes = await api.post("/api/insertUpdatePropertyRental", {
  //       RentalID: rentalId || 0,
  //       PropertyID: selectedRentalPropertyId,
  //       RecordID: selectedRentalUnitId,
  //       CompanyID, UserID,
  //       TenantName: `${user.Name || ''} ${user.MName || ''} ${user.LName || ''}`.trim(),
  //       TenantUserId: user.UserId,
  //     });
  //     if (!rRes.data?.success) { toast.error("Rental save failed"); return; }
  //     const RentID = rRes.data.RentalID || rentalId;
  //     setRentalId(RentID);

  //     const data = await saveRentalTransactions({
  //       CompanyID,
  //       PropertyID: selectedRentalPropertyId,
  //       RentID,
  //       UserID,
  //       rows: transactions,
  //     });
  //     if (data?.success) {
  //       toast.success("Transactions saved");
  //       await loadTransactions(RentID, selectedRentalPropertyId);
  //     } else toast.error(data?.message || "Save failed");
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || "Failed to save");
  //   }
  // };

  // useEffect(() => {
  //   if (activeTab === 'rentals') loadRentalProperties();
  // }, [activeTab]);
  // ═══════════════════════════════════════════════════════════════
  // RENTALS / CHEQUE / CASH / TENANCY TAB
  // ═══════════════════════════════════════════════════════════════
  const [rentalProperties, setRentalProperties] = useState([]);
  const [selectedRentalPropertyId, setSelectedRentalPropertyId] = useState(null);
  const [rentalUnits, setRentalUnits] = useState([]);
  const [selectedRentalUnitId, setSelectedRentalUnitId] = useState('');
  const [rentalId, setRentalId] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const loadRentalProperties = async () => {
    try {
      const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
      const res = await api.get("/api/getPropertyInfo", { params: { CompanyID } });
      const rows = res.data?.data || res.data?.recordset || res.data?.properties || [];
      setRentalProperties(rows.map(p => ({
        id: p.PropertyID,
        name: p.PropertyName || p.PropertyCode || `Property #${p.PropertyID}`,
      })));
    } catch { toast.error("Failed to load properties"); }
  };

  const loadRentalUnits = async (propertyId) => {
    try {
      const res = await api.get("/api/getPropertyMaster", { params: { PropertyID: propertyId } });
      const rows = res.data?.data || res.data?.recordset || res.data?.units || [];
      setRentalUnits(rows.map(u => ({
        id: u.RecordID,
        name: u.FlatNumber || u.UnitNumber || `Unit #${u.RecordID}`,
      })));
    } catch { toast.error("Failed to load units"); }
  };

  const loadTransactions = async (RentID, PropertyID) => {
    try {
      const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
      const res = await api.get("/api/getRentalTransactions", {
        params: { CompanyID, PropertyID, RentID },
      });
      const rows = res.data?.transactions || [];
      setTransactions(rows.length ? rows.map(t => ({
        id: t.TransactionID,
        transactionId: t.TransactionID,
        type: t.TransactionType,
        label: t.Label || t.TransactionType,
        amount: t.Amount ?? '',
        date: (t.TransactionDate || '').slice(0, 10),
        chequeNo: t.ChequeNo || '',
        cashReference: t.CashReference || '',
        tenancyStartDate: (t.TenancyStartDate || '').slice(0, 10),
        tenancyEndDate: (t.TenancyEndDate || '').slice(0, 10),
        tenancyNotes: t.TenancyNotes || '',
        notes: t.Notes || '',
        file: null,
        path: t.Path || null,
      })) : [
        { id: Date.now(), transactionId: 0, type: 'Cheque', label: 'Cheque 1',
          amount: '', date: '', chequeNo: '', cashReference: '',
          tenancyStartDate: '', tenancyEndDate: '', tenancyNotes: '', notes: '',
          file: null, path: null },
      ]);
    } catch { toast.error("Failed to load transactions"); }
  };

  const addTransaction = (type) => {
    setTransactions(prev => {
      const count = prev.filter(t => t.type === type).length + 1;
      return [...prev, {
        id: Date.now(), transactionId: 0, type,
        label: type === 'Cheque' ? `Cheque ${count}` : `${type} ${count}`,
        amount: '', date: '', chequeNo: '', cashReference: '',
        tenancyStartDate: '', tenancyEndDate: '', tenancyNotes: '', notes: '',
        file: null, path: null,
      }];
    });
  };

  const updateTransaction = (id, field, value) =>
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

  const removeTransaction = (id) =>
    setTransactions(prev => prev.filter(t => t.id !== id));

  const handleDeleteTransaction = async (row) => {
    if (!row.transactionId) { removeTransaction(row.id); return; }
    try {
      const res = await api.post("/api/deleteRentalTransaction", {
        TransactionID: row.transactionId,
        UserID: Number(sessionStorage.getItem("UserId")),
      });
      if (res.data?.success) { removeTransaction(row.id); toast.success("Deleted"); }
      else toast.error(res.data?.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
  };

  const handleSaveTransactions = async () => {
    if (!user.UserId) { toast.error("Save the worker first"); return; }
    if (!selectedRentalPropertyId || !selectedRentalUnitId) {
      toast.error("Select property and unit"); return;
    }
    const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
    const UserID    = Number(sessionStorage.getItem("UserId")) || 0;
    try {
      const rRes = await api.post("/api/insertUpdatePropertyRental", {
        RentalID: rentalId || 0,
        PropertyID: selectedRentalPropertyId,
        RecordID: selectedRentalUnitId,
        CompanyID, UserID,
        TenantName: `${user.Name || ''} ${user.MName || ''} ${user.LName || ''}`.trim(),
        TenantUserId: user.UserId,
      });
      if (!rRes.data?.success) { toast.error("Rental save failed"); return; }
      const RentID = rRes.data.RentalID || rentalId;
      setRentalId(RentID);

      const fd = new FormData();
      fd.append("CompanyID", CompanyID);
      fd.append("PropertyID", selectedRentalPropertyId);
      fd.append("RentID", RentID);
      fd.append("UserID", UserID);
      fd.append("TransactionsJson", JSON.stringify(
        transactions.map((r, i) => ({
          RowId: String(r.id),
          TransactionID: r.transactionId || 0,
          TransactionType: r.type,
          Sequence: i + 1,
          Label: r.label,
          Amount: parseFloat(r.amount) || 0,
          TransactionDate: r.date || null,
          ChequeNo: r.chequeNo || null,
          CashReference: r.cashReference || null,
          TenancyStartDate: r.tenancyStartDate || null,
          TenancyEndDate: r.tenancyEndDate || null,
          TenancyNotes: r.tenancyNotes || null,
          Notes: r.notes || null,
          ExistingPath: r.path || null,
        }))
      ));
      transactions.forEach(t => {
        if (t.file instanceof File) fd.append(`file_${t.id}`, t.file);
      });

      const res = await api.post("/api/saveRentalTransactions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Transactions saved");
        await loadTransactions(RentID, selectedRentalPropertyId);
      } else toast.error(res.data?.message || "Save failed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    }
  };

  useEffect(() => {
    if (activeTab === 'rentals') loadRentalProperties();
  }, [activeTab]);
  useEffect(() => {
    if (!canView) {
      setUserData([]);
      setShowForm(false);
      return;
    }

    const CompanyID = sessionStorage.getItem("CompanyID");
    if (CompanyID === "1") {
      setIsSuperAdmin(true);
      fetchCompanies();
      fetchSuppliers();
      fetchClients();   // ← ADD
      fetchCamps();     // ← ADD
      fetchUnlinkedCamps();
      fetchVehicles();  // ← ADD
      fetchRoles(CompanyID);
      fetchData(CompanyID);
      fetchEmployeeCategories();
    } else {
      fetchData(CompanyID);
      fetchBranches(CompanyID);
      fetchRoles(CompanyID);
      fetchSuppliers();
      fetchClients();   // ← ADD
      fetchCamps();     // ← ADD
      fetchUnlinkedCamps();
      fetchVehicles();  // ← ADD
      fetchEmployeeCategories();
    }
  }, [canView]);
  useEffect(() => {
    if (!isHavenWorker && !user.UserId && !user.UserName) {
      const randomUser = randomWord(6);
      const randomPass = randomWord(8);
      setUser(prev => ({ ...prev, UserName: randomUser, Password: randomPass, ConformPassword: randomPass }));
    }
  }, [isHavenWorker, user.UserId, user.UserName]);

  // Add these states
  const [campsByProject, setCampsByProject] = useState({});
  const [vehiclesByProject, setVehiclesByProject] = useState({});

  // Add these fetch functions
  const fetchCampsByProject = async (projectID) => {
    if (!projectID || campsByProject[projectID]) return;
    try {
      const res = await api.get('/api/getcampsbyproject', { params: { ProjectID: projectID } });
      setCampsByProject(prev => ({ ...prev, [projectID]: res.data.camps || [] }));
    } catch { toast.error("Failed to load camps"); }
  };

  const fetchVehiclesByProject = async (projectID, force = false) => {
    if (!projectID) return;
    if (!force && vehiclesByProject[projectID]) return;
    try {
      const res = await api.get('/api/getvehiclesbyproject', { params: { ProjectID: projectID } });
      setVehiclesByProject(prev => ({ ...prev, [projectID]: res.data.vehicles || [] }));
    } catch { toast.error("Failed to load vehicles"); }
  };
  const fetchCompanies = async () => {
    try {
      const res = await api.get('/api/Webgetcompanywisename');
      setCompanyList(res.data || []);
    } catch { toast.error("Failed to load companies"); }
  };
  const fetchSuppliers = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const res = await api.get(`/api/GetSuppliers/${CompanyID}`);
      setSponsorList(res.data.suppliers || []);
    } catch {
      toast.error("Failed to load suppliers");
    }
  };
  const fetchSubSponsorsBySupplier = async (supplierID) => {
  if (!supplierID) return;
  try {
    const res = await api.get('/api/GetSubSponsorsBySupplier', { params: { SupplierID: supplierID } });
    const normalized = (res.data.subSponsors || []).map(s => ({
      ...s,
      SubSponsorID: String(s.SubSponsorID).trim()
    }));
    setSubSponsorList(prev => ({ ...prev, [supplierID]: normalized }));
  } catch { toast.error("Failed to load sub-sponsors"); }
};
  // const fetchClients = async () => {
  //   try {
  //     const CompanyID = sessionStorage.getItem("CompanyID");
  //     const res = await api.get(`/api/GetCustomers/${CompanyID}`);
  //     setClientList(res.data.customers || []);
  //   } catch {
  //     toast.error("Failed to load clients");
  //   }
  // };

  const fetchClients = async () => {
  try {
    const CompanyID = sessionStorage.getItem("CompanyID");
    const UserID = sessionStorage.getItem("UserId"); // Same key used during login

    const res = await api.get(`/api/GetCustomers/${CompanyID}`, {
      params: {
        UserID,
      },
    });

    setClientList(res.data.customers || []);
  } catch (err) {
    console.error("Failed to load clients:", err);
    toast.error("Failed to load clients");
  }
};
  // const fetchProjectsByClient = async (clientID) => {
  //   if (!clientID || projectsByClient[clientID]) return;
  //   try {
  //     const CompanyId = sessionStorage.getItem("CompanyID");
  //     const res = await api.get('/api/getprojectsbyclient', { params: { ClientID: clientID, CompanyId } });
  //     setProjectsByClient(prev => ({ ...prev, [clientID]: res.data.projects || [] }));
  //   } catch { toast.error("Failed to load projects"); }
  // };
  const fetchProjectsByClient = async (clientID) => {
  if (!clientID || projectsByClient[clientID]) return;

  try {
    const CompanyId = sessionStorage.getItem("CompanyID");
    const UserID = sessionStorage.getItem("UserId");
    console.log("CompanyId =", CompanyId);
console.log("UserID =", UserID);
    const res = await api.get("/api/getprojectsbyclient", {
      params: {
        ClientID: clientID,
        CompanyId,
        UserID,
      },
    });

    setProjectsByClient((prev) => ({
      ...prev,
      [clientID]: res.data.projects || [],
    }));
  } catch (err) {
    toast.error("Failed to load projects");
  }
};
  const fetchCamps = async () => {
    try {
      const res = await api.get('/api/GetCamp');
      setCampList(res.data.camps || []);
    } catch { toast.error("Failed to load camps"); }
  };

  const fetchVehicles = async () => {
    try {
      const CompanyID = sessionStorage.getItem("CompanyID");
      const res = await api.get("/api/GetVehiclesNew", { params: { CompID: CompanyID } });
      setVehicleList(res.data.vehicles || []);
    } catch { toast.error("Failed to load vehicles"); }
  };
  const addAllocationRow = () => {
    setAllocations(prev => [...prev, {
      id: Date.now(),
      clientID: '',       // ← also fix clientIDs → clientID (consistent with rest of code)
      projectID: '',
      startDate: '',
      endDate: '',
      campID: '',
      vehicleID: '',
      status: '',
      remark: '',
      saved: false, roomID: '', bedID: '', campFilterByProject: true, vehicleFilterByProject: true, campStartDate: '', campEndDate: '', supplierID: '', subSponsorID: ''  // ← explicitly set, won't matter after filter fix above
    }]);
  };
  const removeAllocationRow = (id) => {
    setAllocations(prev => prev.filter(r => r.id !== id));
  };
  // ✅ FIX — add this function alongside removeAllocationRow
  const handleDeleteAllocationRow = async (row) => {
    try {
      // Release Bed
      if (row.bedID) {
        await api.post("/api/UpdateBedStatus", {
          BedID: parseInt(row.bedID),
          UserID: null,
        });
      }

      // Delete from database if already saved
      if (row.dbId) {
        const DeletedBy = sessionStorage.getItem("UserId");

        await api.post("/api/DeleteProjectAllocation", {
          WorkerAllocationId: row.dbId,
          DeletedBy,
          DeletedDate: new Date().toISOString(),
        });
      }

      // Remove row from state
      setAllocations((prev) => prev.filter((x) => x.id !== row.id));

      toast.success("Allocation deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete allocation.");
    }
  };
  const updateAllocation = (id, field, value) => {
    setAllocations(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
const handleSubSponsorToggle = (subSponsorId) => {
  const id = String(subSponsorId).trim();
  setUser(prev => {
    const current = Array.isArray(prev.SubSponsorID)
      ? prev.SubSponsorID.map(x => String(x).trim())
      : [];
    return {
      ...prev,
      SubSponsorID: current.includes(id)
        ? current.filter(x => x !== id)
        : [...current, id]
    };
  });
};
  const handleAllocationClientChange = (rowId, clientID) => {
    updateAllocation(rowId, 'clientID', clientID);
    updateAllocation(rowId, 'projectID', ''); // reset project
    if (clientID) fetchProjectsByClient(clientID);
  };
  const workerAlreadyHasBed = (currentRowId) => {
    const currentRow = allocations.find(r => r.id === currentRowId);
    if (!currentRow?.projectID) return false;
    return allocations.some(r =>
      r.id !== currentRowId &&
      r.bedID &&
      r.projectID &&
      String(r.projectID) === String(currentRow.projectID)
    );
  };
  const getUsedProjects = (currentRowId, clientID) => {
    return allocations
      .filter(r => r.id !== currentRowId && String(r.clientID) === String(clientID) && r.projectID)
      .map(r => String(r.projectID));
  };
  const isOnHireUsed = (currentRowId) => {
    return allocations.some(r => r.id !== currentRowId && r.status === 'onhire');
  };
  const toggleAllocationClient = (rowId, accountId) => {
    setAllocations(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const current = r.clientIDs || [];
      return {
        ...r,
        clientIDs: current.includes(accountId)
          ? current.filter(id => id !== accountId)
          : [...current, accountId]
      };
    }));
  };
  const fetchRoles = async (companyId) => {
    try {
      const res = await api.get('/api/GetRoleList', { params: { CompanyID: companyId } });
      setRoleList(res.data || []);
    } catch { toast.error("Failed to load roles"); }
  };

  const fetchBranches = useCallback(async (companyId) => {
    if (!companyId) return;
    try {
      const res = await api.get('/api/Webgetcompanywisebranchname', { params: { CompanyID: companyId } });
      setBranchList(res.data || []);
    } catch { toast.error("Failed to load branches"); }
  }, []);

  const fetchData = async (companyId) => {
    try {
      setLoading(true);
      const finalCompanyID = companyId || sessionStorage.getItem("CompanyID");
      const response = await api.get("/api/GetUsermaster", { params: { CompanyID: finalCompanyID } });
      console.log('All keys:', Object.keys(response.data[0]));
      setUserData(response.data);
    } catch {
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = useCallback((e) => {
    const id = e.target.value;
    setUser(prev => ({ ...prev, CompanyID: id, BranchID: '', UserRoleId: '' }));
    fetchBranches(id);
    fetchData(id);
    fetchRoles(id);
  }, [fetchBranches]);

  const handleRowClick = useCallback(async (item) => {
    if (!canView) {
      toast.error("You do not have permission to view worker records.");
      return;
    }

    let imageData = null;
    const raw = item.IMAGE ?? item.image ?? null;
    if (raw && typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data)) {
      imageData = await bufferToBase64Async(raw, 'image/jpeg');
    } else if (typeof raw === 'string' && raw.length > 0) {
      imageData = raw.includes('base64,') ? raw : `data:image/jpeg;base64,${raw}`;
    }

    setCurrentImage(imageData);
    setUser({
      UserId: item.UserId, Name: item.Name || '', MName: item.MName || '', LName: item.LName || '',
      Sex: item.Sex !== null && item.Sex !== undefined ? item.Sex.toString() : '',
      Address: item.Address1 || '', Place: item.Address2 || '', District: item.Address3 || '',
      Mobile: item.Mobile || '', Email: item.Email || '', UserName: item.UserName || '',
      Password: item.Password || '', ConformPassword: item.ConformPassword || '',
      CompanyID: item.CompanyID || '', BranchID: item.BranchId || '',
      UserRoleId: item.UserRoleId || '', image: imageData,
      BadgeNo: item.BadgeNo || '', EIDNo: item.EIDNo || '',
      EIDExpiryDate: toDateInputValue(item.EIDExpiryDate),
      PPNo: item.PPNo || '',
      PPExpiryDate: toDateInputValue(item.PPExpiryDate),
      VisaNo: item.VisaNo || '',
      VisaExpiryDate: toDateInputValue(item.VisaExpiryDate),
      InsuranceNo: item.InsuranceNo || '',
      InsuranceExpiryDate: toDateInputValue(item.InsuranceExpiryDate),
      GatePassNo: item.GatePassNo || '',
      GatePassExpiryDate: toDateInputValue(item.GatePassExpiryDate),
      WorkmenCompNo: item.WorkmenCompNo || '',
      WorkmenCompExpiryDate: toDateInputValue(item.WorkmenCompExpiryDate),
      ProfLicenseNo: item.ProfLicenseNo || '',
      ProfLicenseExpiryDate: toDateInputValue(item.ProfLicenseExpiryDate),
      Country: item.Country || '', SupplierID: item.SupplierID || item.SponsorID || '',
      ClientIDs: item.ClientIDs ? item.ClientIDs.toString().split(',').map(Number).filter(Boolean) : [],
      ProjectIDs: item.ProjectIDs ? item.ProjectIDs.toString().split(',').map(Number).filter(Boolean) : [],
      WorkerRate: item.WorkerRate ?? '',
      EmployeeCategoryID: item.EmployeeCategoryID || item.EmployeeCatID || '',
      ClientTrade: item.ClientTrade || '', SubSponsorID: item.SubSponsorID
  ? item.SubSponsorID.toString().split(',').map(id => id.trim()).filter(Boolean)
  : [],
      PaymentMode: parsePaymentModes(item.PaymentMode ?? item.paymentMode),
    });
    fetchBranches(item.CompanyID);
    if (item.SupplierID || item.SponsorID) fetchSubSponsorsBySupplier(item.SupplierID || item.SponsorID); // ← ADD
    setPreviewImage(null);

    // ── Always load allocations from DB ──────────────────────────────
    try {
      const allocRes = await api.get('/api/GetProjectAllocationByUser', {
        params: { UserId: item.UserId }
      });

      const rows = allocRes.data.allocations || [];

      if (rows.length > 0) {
        const mappedAllocations = rows.map(r => {
          console.log('[AllocMap] raw CampStartDate:', r.CampStartDate, typeof r.CampStartDate);
          console.log('[AllocMap] raw CampEndDate:', r.CampEndDate, typeof r.CampEndDate);
          return {
            id: Date.now() + Math.random(),
            dbId: r.WorkerAllocationId,
            clientID: r.ClientId?.toString() || '',
            projectID: r.ProjectId?.toString() || '',
            startDate: toDateInputValue(r.StartDate),
            endDate: toDateInputValue(r.EndDate),
            campID: r.CampID?.toString() || '',
            vehicleID: r.VehicleId?.toString() || '',
            status: r.StatusLabel || '',  
            remark: r.Remarks || '',
            saved: true,  
            roomID: r.RoomID?.toString() || '',
            bedID: r.BedID?.toString() || '',

            campFilterByProject: r.CampFilterByProject === true || r.CampFilterByProject === 1 || r.CampFilterByProject === '1',
            vehicleFilterByProject: r.VehicleFilterByProject === true || r.VehicleFilterByProject === 1 || r.VehicleFilterByProject === '1',
            campStartDate: toDateInputValue(r.CampStartDate),
            campEndDate: toDateInputValue(r.CampEndDate),
            vehicleStartDate: toDateInputValue(r.VehicleStartDate),
            vehicleEndDate: toDateInputValue(r.VehicleEndDate),
          };
        });

        setAllocations(mappedAllocations);
        setIsHavenWorker(!!item.IsHavenWorker); 

        mappedAllocations.forEach(r => {
          if (r.clientID) fetchProjectsByClient(r.clientID);
          if (r.projectID) {
            api.get('/api/getcampsbyproject', { params: { ProjectID: r.projectID } })
              .then(res => setCampsByProject(prev => ({ ...prev, [r.projectID]: res.data.camps || [] })))
              .catch(() => { });
            api.get('/api/getvehiclesbyproject', { params: { ProjectID: r.projectID } })
              .then(res => setVehiclesByProject(prev => ({ ...prev, [r.projectID]: res.data.vehicles || [] })))
              .catch(() => { });
            if (r.campID) fetchRoomsByCamp(r.id, r.campID);
          }
          if (r.roomID) fetchBedsByRoom(r.id, r.roomID);
        });

      } else {
        setAllocations([{
          id: Date.now(), dbId: null,
          clientID: '', projectID: '',
          startDate: '', endDate: '',
          campID: '', vehicleID: '',
          roomID: '', bedID: '',
          status: '', remark: '', saved: false,
          campFilterByProject: true, vehicleFilterByProject: true,
          campStartDate: '', campEndDate: '',
          vehicleStartDate: '', vehicleEndDate: ''
        }]);
      }
    } catch (err) {
      console.error('Failed to load allocations:', err);
      setAllocations([{
        id: Date.now(), dbId: null,
        clientID: '', projectID: '',
        startDate: '', endDate: '',
        campID: '', vehicleID: '', roomID: '', bedID: '',
        status: '', remark: '', saved: false, campStartDate: '', campEndDate: '', campFilterByProject: true, vehicleFilterByProject: true,
      }]);
    }

    fetchBranches(item.CompanyID);
    setPreviewImage(null);
    setIsSubmitDisabled(true);
    setIsUpdateDisabled(false);
    setIsDeleteDisabled(false);
    setDocuments(emptyDocs());
    
    setShowForm(true);
    setActiveTab('personal');

   setDocsLoading(true);
    try {
      const res = await api.get(`/api/GetWorkerDocuments/${item.UserId}`);
      setDocuments({ ...emptyDocs(), ...(res.data.documents || {}) });
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments(emptyDocs());
    } finally {
      setDocsLoading(false);
    }
  }, [fetchBranches]);

 const handleDownloadPDF = useCallback(async (e, userItem) => {
  e.stopPropagation();
  setDownloadingId(userItem.UserId);
  try {
    const companyId = userItem.CompanyID || sessionStorage.getItem("CompanyID");
    const [pdfRes, docsRes] = await Promise.all([
      api.post('/api/GetUsermasterPDF', { CompanyID: companyId, UserId: userItem.UserId }),
      api.get(`/api/GetWorkerDocuments/${userItem.UserId}`)
    ]);
    const baseUser = pdfRes.data?.[0] || userItem;
    const docs = docsRes.data.documents || {};

    // resolve each saved doc's path into a data URI on demand
    const withDataUris = {};
    for (const [key, arr] of Object.entries(docs)) {
      withDataUris[key] = await Promise.all(
        (arr || []).map(async d => ({ ...d, data: await fetchDocAsDataUri(d.path) }))
      );
    }

    await generateUserPDF({
      ...baseUser,
      Name: userItem.Name || '', MName: userItem.MName || '', LName: userItem.LName || '',
      ResumeFiles: JSON.stringify(withDataUris.resume || []),
      PPDocumentFiles: JSON.stringify(withDataUris.ppDocument || []),
      VisaDocFiles: JSON.stringify(withDataUris.visaDocument || []),
      EIDDocFiles: JSON.stringify(withDataUris.eidDocument || []),
      ProfLiceFiles: JSON.stringify(withDataUris.professionalLicenseDocument || []),
      WorkmenCompFiles: JSON.stringify(withDataUris.workmenCompDocument || []),
      EduCertFiles: JSON.stringify(withDataUris.educationCert || []),
      ExperienceDocFiles: JSON.stringify(withDataUris.experienceDocument || []),
      InsuranceFiles: JSON.stringify(withDataUris.insuranceDocument || []),
      GatePassFiles: JSON.stringify(withDataUris.gatePassDocument || []),
      OtherDocFiles: JSON.stringify(withDataUris.otherDocument || []),
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF');
  } finally {
    setDownloadingId(null);
  }
}, []);

  const validateFields = () => {
    const errors = {};
    if (!user.Name?.trim()) errors.Name = "First Name is required";
    if (!user.Mobile?.trim()) errors.Mobile = "Mobile number is required";
    if (user.Email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.Email)) errors.Email = "Valid Email is required";
    if (!user.PPNo?.trim()) errors.PPNo = "Passport Number is required";
    if (!user.PPExpiryDate) errors.PPExpiryDate = "Passport Expiry Date is required";

    if (!user.ProfLicenseNo?.trim()) errors.ProfLicenseNo = "Trade License Number is required";
    if (!user.ProfLicenseExpiryDate) errors.ProfLicenseExpiryDate = "Trade License Expiry Date is required";

    if (!user.WorkmenCompNo?.trim()) errors.WorkmenCompNo = "Workmen Compensation Number is required";
    if (!user.WorkmenCompExpiryDate) errors.WorkmenCompExpiryDate = "Workmen Compensation Expiry Date is required";

    // if (!user.EIDNo?.trim()) {
    //   errors.EIDNo = "EID Number is required";
    // } else if (!isValidEID(user.EIDNo)) {
    //   errors.EIDNo = "EID must be in format 784-XXXX-XXXXXXX-X";
    // }

    if (isHavenWorker) {
      if (!user.UserName?.trim()) errors.UserName = "Username is required";
      if (user.UserId === 0 && !user.Password?.trim()) errors.Password = "Password is required";
      if (user.UserId === 0 && user.Password !== user.ConformPassword) {
        errors.ConformPassword = "Passwords do not match";
        toast.warning("Password and Confirm Password do not match");
      }
    }

    if (user.Sex === '' || user.Sex === null || user.Sex === undefined) errors.Sex = "Gender is required";
    if (isSuperAdmin && !user.CompanyID) errors.CompanyID = "Company is required";
    if (!user.BranchID && branchList.length > 0) errors.BranchID = "Branch is required";
    if (!user.UserRoleId) errors.UserRoleId = "Role is required";
    const offhireWithoutExpiry = allocations.some(
      r => r.status === 'offhire' && !r.endDate
    );
//     const REQUIRED_DOCS = ['resume', 'ppDocument', 'eidDocument', 'workmenCompDocument', 'professionalLicenseDocument'];
// REQUIRED_DOCS.forEach(key => {
//   if (!documents[key] || documents[key].length === 0) {
//     const docType = DOC_TYPES.find(d => d.key === key);
//     errors[`doc_${key}`] = `${docType?.label || 'Document'} is required`;
//   }
// });
    if (offhireWithoutExpiry) {
      errors.allocationEndDate = "End date is required for Off Hire";
      toast.error("End date is required when status is Off Hire");
    }
    return errors;
  };

  const checkDuplicateFullName = (name, currentUserId = null) =>
    userData.some(u => {
      const isSame = u.Name?.trim().toLowerCase() === name.trim().toLowerCase();
      return currentUserId ? isSame && u.UserId !== currentUserId : isSame;
    });

  const checkDuplicateUserName = (username, currentUserId = null) =>
    userData.some(u => {
      const isSame = u.UserName?.trim().toLowerCase() === username.trim().toLowerCase();
      return currentUserId ? isSame && u.UserId !== currentUserId : isSame;
    });

  const fileToPayload = (f) => {
    if (!f) return Promise.resolve(null);
    if (!(f instanceof File)) return Promise.resolve({ data: f.data, fileName: f.fileName, label: f.label || '' });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ data: reader.result, fileName: f.name, label: f.label || '' });
      reader.readAsDataURL(f);
    });
  };

  const filesToPayload = async (arr) => {
    if (!arr || arr.length === 0) return null;
    // Always return as JSON array string — even for single file
    const all = await Promise.all(arr.map(fileToPayload));
    const filtered = all.filter(Boolean);
    return filtered.length > 0 ? JSON.stringify(filtered) : null;
  };

  const buildDocuments = async () => {
    const keys = ['resume', 'ppDocument', 'educationCert', 'visaDocument', 'eidDocument', 'experienceDocument', 'insuranceDocument', 'gatePassDocument', 'workmenCompDocument', 'professionalLicenseDocument', 'otherDocument'];
    const results = await Promise.all(keys.map(k => filesToPayload(documents[k])));
    return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
  };

  const saveProjectAllocations = async (userId) => {
    try {
      const CreatedBy = sessionStorage.getItem("UserId");
      const ModifiedBy = sessionStorage.getItem("UserId");
      const now = new Date().toISOString();

      const validRows = allocations.filter(r => r.clientID && r.projectID);

      let existingAllocations = [];

      try {
        const existing = await api.get('/api/GetProjectAllocationByUser', {
          params: { UserId: userId }
        });
        existingAllocations = existing.data.allocations || [];
        console.log('[BedDebug] RAW existingAllocations:', JSON.stringify(existingAllocations, null, 2));
      } catch (err) {
        console.error('[BedDebug] fetch existingAllocations FAILED:', err);
      }

      for (const row of validRows) {
        const dbRow = existingAllocations.find(
          r => String(r.WorkerAllocationId) === String(row.dbId)
        );
        const previousBedID = dbRow?.BedID != null ? String(dbRow.BedID) : null;
        const currentBedID = row.bedID ? String(row.bedID) : null;
        console.log('[BedDebug] row.dbId:', row.dbId, '| dbRow found:', !!dbRow, '| previousBedID:', previousBedID, '| currentBedID:', currentBedID);
        try {
          await api.post('/api/AssignBedToWorker', {
            UserID: userId,
            NewBedID: currentBedID ? parseInt(currentBedID) : null,
            OldBedID: previousBedID ? parseInt(previousBedID) : null,
          });
        } catch {
          toast.error("Failed to update bed assignment");
        }

        const payload = {
          WorkerAllocationId: row.dbId || 0,
          UserId: userId,
          ClientId: parseInt(row.clientID),
          ProjectId: parseInt(row.projectID),
          StartDate: row.startDate || null,
          EndDate: row.endDate || null,
          CampID: row.campID ? parseInt(row.campID) : null,
          VehicleId: row.vehicleID ? parseInt(row.vehicleID) : null,
          RoomID: row.roomID ? parseInt(row.roomID) : null,
          BedID: row.bedID ? parseInt(row.bedID) : null,
          ProjectAllocationStatus: row.status === 'onhire' ? 1 : row.status === 'offhire' ? 0 : null,
          Remarks: row.remark || null,
          CampFilterByProject: row.campFilterByProject ? 1 : 0,
          VehicleFilterByProject: row.vehicleFilterByProject ? 1 : 0,
          CreatedBy: row.dbId ? null : CreatedBy,
          CreatedDate: row.dbId ? null : now,
          ModifiedBy: row.dbId ? ModifiedBy : null,
          ModifiedDate: row.dbId ? now : null,
          CampStartDate: row.campStartDate || null,
          CampEndDate: row.campEndDate || null,
          VehicleStartDate: row.vehicleStartDate || null,
          VehicleEndDate: row.vehicleEndDate || null,
        };

        const res = await api.post('/api/InsertUpdateProjectAllocation', payload);

        if (res.data.success && !row.dbId) {
          setAllocations(prev => prev.map(r =>
            r.id === row.id ? { ...r, dbId: res.data.WorkerAllocationId } : r
          ));
        }
        // ── Refresh this row's room/bed dropdown data so the UI matches the DB ──
        if (row.campID) await fetchRoomsByCamp(row.id, row.campID);
        if (row.roomID) await fetchBedsByRoom(row.id, row.roomID);
      }

    } catch (err) {
      console.error('saveProjectAllocations error:', err);
      toast.error('Failed to save allocations');
    }
  };
  // Replace your existing buildSingleDocPayload with this:
  const buildSingleDocPayload = async (docKey) => {
    // Same key order as buildDocuments so the mapping is consistent
    const keyMap = {
      resume: 'resume',
      ppDocument: 'ppDocument',
      educationCert: 'educationCert',
      visaDocument: 'visaDocument',
      eidDocument: 'eidDocument',
      experienceDocument: 'experienceDocument',
      insuranceDocument: 'insuranceDocument',
      gatePassDocument: 'gatePassDocument',
      workmenCompDocument: 'workmenCompDocument',
      professionalLicenseDocument: 'professionalLicenseDocument',
      otherDocument: 'otherDocument',
    };

    const apiKey = keyMap[docKey];
    if (!apiKey) return {};

    const payload = await filesToPayload(documents[docKey]);
    return { [apiKey]: payload };
  };

  const buildPayload = (base, docs = {}) => ({
    ...base,
    Name: user.Name?.trim(),
    MName: user.MName?.trim(),
    LName: user.LName?.trim(),
    UserName: user.UserName?.trim(),
    Sex: user.Sex !== '' ? parseInt(user.Sex) : null,
    BadgeNo: user.BadgeNo?.trim() || null,
    EIDNo: user.EIDNo?.trim() || null,
    EIDExpiryDate: user.EIDExpiryDate || null,
    PPNo: user.PPNo?.trim() || null,
    PPExpiryDate: user.PPExpiryDate || null,
    VisaNo: user.VisaNo?.trim() || null,
    VisaExpiryDate: user.VisaExpiryDate || null,
    InsuranceNo: user.InsuranceNo?.trim() || null,
    InsuranceExpiryDate: user.InsuranceExpiryDate || null,
    GatePassNo: user.GatePassNo?.trim() || null,
    GatePassExpiryDate: user.GatePassExpiryDate || null,
    WorkmenCompNo: user.WorkmenCompNo?.trim() || null,
    WorkmenCompExpiryDate: user.WorkmenCompExpiryDate || null,
    ProfLicenseNo: user.ProfLicenseNo?.trim() || null,
    ProfLicenseExpiryDate: user.ProfLicenseExpiryDate || null,
    ClientTrade: user.ClientTrade?.trim() || null,
    WorkerRate: user.WorkerRate !== '' && user.WorkerRate !== null && user.WorkerRate !== undefined
      ? parseFloat(user.WorkerRate)
      : null,
    PaymentMode: user.PaymentMode.length > 0 ? user.PaymentMode.join(',') : null,
    Allocations: JSON.stringify(allocations.map(r => ({
      clientID: r.clientID || null,
      projectID: r.projectID || null,
      startDate: r.startDate || null,
      endDate: r.endDate || null,
      campID: r.campID || null,
      vehicleID: r.vehicleID || null,
      roomID: r.roomID || null,
      bedID: r.bedID || null,
      status: r.status || null,
      remark: r.remark || null,
      vehicleStartDate: r.vehicleStartDate || null,
      vehicleEndDate: r.vehicleEndDate || null,
    }))),
    EmployeeCategoryID: user.EmployeeCategoryID ? parseInt(user.EmployeeCategoryID) : null,
    SupplierID: user.SupplierID ? parseInt(user.SupplierID) : null,
    ClientIDs: (user.ClientIDs || []).join(','),
    ProjectIDs: (user.ProjectIDs || []).join(','),
    Country: user.Country || null,SubSponsorID: (user.SubSponsorID || []).join(',') || null,
    IsHavenWorker: isHavenWorker,
    ...docs,
  });

// buildPayload(...) — remove the `...docs` spread entirely, and delete buildDocuments()/
// filesToPayload()/fileToPayload() calls from handleSubmit and handleUpdate.

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!canAdd) {
    toast.error("You do not have permission to create worker records.");
    return;
  }

  const errors = validateFields() || {};
  setFieldErrors(errors);
  if (Object.keys(errors).length > 0) { toast.error("Please fill all mandatory fields"); return; }
  // ...duplicate checks unchanged...
  try {
    setLoadingSubmit(true);
    const loggedInCompanyID = sessionStorage.getItem("CompanyID");
    const CreatedBy = sessionStorage.getItem("UserId");
    const finalCompanyID = isSuperAdmin ? user.CompanyID : loggedInCompanyID;
    if (!finalCompanyID) { toast.error("Company is required"); return; }

    const newUser = buildPayload({
      ...user, CreatedBy, CreatedDate: new Date().toISOString(),
      CompanyID: parseInt(finalCompanyID),
      BranchID: user.BranchID ? parseInt(user.BranchID) : null,
      UserRoleId: user.UserRoleId ? parseInt(user.UserRoleId) : null
    }); // ← no docs argument at all now

    const response = await api.post('/api/InsertUpdateUser', newUser);
    if (response.data.success) {
      toast.success('User created successfully');
      const newUserId = response.data.UserId || response.data.userId || response.data.id;
      if (newUserId) await saveProjectAllocations(newUserId);
      fetchData(finalCompanyID);
      resetForm();
      setShowForm(false);
    } else { toast.error(response.data.message || 'Operation failed'); }
  } catch (err) { toast.error(err.response?.data?.message || 'Request failed'); }
  finally { setLoadingSubmit(false); }
};

const handleUpdate = async (e) => {
  e.preventDefault();
  if (!canEdit) {
    toast.error("You do not have permission to update worker records.");
    return;
  }
  if (!validateDocumentsForUpdate()) return;
  const errors = validateFields() || {};
  setFieldErrors(errors);
  if (Object.keys(errors).length > 0) { toast.error("Please fill all mandatory fields"); return; }
  // ...duplicate checks unchanged...
  try {
    setLoadingUpdate(true);
    const ModifiedBy = sessionStorage.getItem("UserId");
    const loggedInCompanyID = sessionStorage.getItem("CompanyID");
    const finalCompanyID = isSuperAdmin ? user.CompanyID : loggedInCompanyID;

    const updatedUser = buildPayload({
      ...user, ModifiedBy, ModifiedDate: new Date().toISOString(),
      CompanyID: parseInt(finalCompanyID),
      BranchID: user.BranchID ? parseInt(user.BranchID) : null,
      UserRoleId: user.UserRoleId ? parseInt(user.UserRoleId) : null
    }); // ← no docs

    if (!updatedUser.image || typeof updatedUser.image !== 'string') delete updatedUser.image;
    const response = await api.post('/api/InsertUpdateUser', updatedUser);
    if (response.data.success) {
      toast.success('User updated successfully');
      await saveProjectAllocations(user.UserId);
      fetchData(finalCompanyID);
      resetForm();
      setShowForm(false);
    } else { toast.error(response.data.message || 'Update failed'); }
  } catch (err) { toast.error(err.response?.data?.message || 'Update request failed'); }
  finally { setLoadingUpdate(false); }
};
const validateDocumentsForUpdate = () => {
  const requiredDocs = DOC_TYPES.filter(d => d.required);
  for (const doc of requiredDocs) {
    if (!documents[doc.key] || documents[doc.key].length === 0) {
      toast.error(`${doc.label} is mandatory for updating this worker`);
      return false;
    }
  }
  return true;
};
 
  const handleSaveRate = useCallback(async () => {
    if (!user.UserId) { toast.error("No user selected"); return; }
    if (user.WorkerRate === '' || isNaN(parseFloat(user.WorkerRate))) {
      toast.error("Enter a valid rate"); return;
    }
    setSavingRate(true);
    try {
      const designation = roleList.find(r => String(r.RoleID) === String(user.UserRoleId))?.RoleName || '';
      const ModifiedBy = sessionStorage.getItem("UserId");
      const res = await api.post('/api/UpdateWorkerRate', {
        UserId: user.UserId,
        NewRate: parseFloat(user.WorkerRate),
        Designation: designation,
        ModifiedBy,
      });
      if (res.data.success) {
        toast.success("Rate updated");
      } else {
        toast.error(res.data.message || "Failed to update rate");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update rate");
    } finally {
      setSavingRate(false);
    }
  }, [user.UserId, user.WorkerRate, user.UserRoleId, roleList]);

  const openRateHistory = useCallback(async () => {
    if (!user.UserId) { toast.error("No user selected"); return; }
    setShowRateHistory(true);
    setLoadingRateHistory(true);
    try {
      const res = await api.get('/api/GetWorkerRateHistory', { params: { UserId: user.UserId } });
      setRateHistory(res.data.history || []);
    } catch {
      toast.error("Failed to load rate history");
    } finally {
      setLoadingRateHistory(false);
    }
  }, [user.UserId]);

  const handleDocumentUpdate = useCallback(async (docKey) => {
  if (!user.UserId) { toast.error("No user selected"); return; }
  setUpdatingDocKey(docKey);
  try {
    const newFiles = documents[docKey].filter(f => f instanceof File);
    if (newFiles.length === 0) {
      toast.info("No new files to upload for this document");
      return;
    }
    const formData = new FormData();
    formData.append('userId', user.UserId);
    formData.append('docType', docKey);
    formData.append('titles', JSON.stringify(newFiles.map(f => f.label || '')));
    newFiles.forEach(f => formData.append('files', f));

    const response = await api.post('/api/uploadWorkerDocs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      const docType = DOC_TYPES.find(d => d.key === docKey);
      toast.success(`${docType?.label || 'Document'} updated successfully`);
      // response.data.documents is the full merged [{fileName, path, label}] array
      setDocuments(prev => ({
        ...prev,
        [docKey]: response.data.documents.map(d => ({ fileName: d.fileName, path: d.path, label: d.label }))
      }));
    } else {
      toast.error(response.data.message || 'Document update failed');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Document update request failed');
  } finally {
    setUpdatingDocKey(null);
  }
}, [user.UserId, documents]);

const handleDocumentRemove = useCallback(async (docKey, idx) => {
    const item = documents[docKey][idx];
    if (item instanceof File) {
      setDocuments(prev => ({ ...prev, [docKey]: prev[docKey].filter((_, i) => i !== idx) }));
      return;
    }
    try {
      const res = await api.post('/api/deleteWorkerDoc', {
        userId: user.UserId, docType: docKey, filePath: item.path
      });
      if (res.data.success) {
        setDocuments(prev => ({ ...prev, [docKey]: res.data.documents }));
        toast.success('Document removed');
      } else {
        toast.error(res.data.message || 'Failed to remove document');
      }
    } catch {
      toast.error('Failed to remove document');
    }
  }, [user.UserId, documents]);

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete worker records.");
      return;
    }
    if (!user.UserId) { toast.error("No user selected"); return; }
    const confirm = await confirmDeleteToast();
    if (!confirm) return;
    try {
      setLoadingDelete(true);
      const response = await api.post('/api/Deleteusers', {
        UserId: user.UserId,
        deletedBy: parseInt(sessionStorage.getItem("UserId"), 10)
      });
      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchData(user.CompanyID || sessionStorage.getItem("CompanyID"));
        handleClear();
        setShowForm(false);
      } else { toast.error(response.data.message || "Delete failed"); }
    } catch (err) { toast.error(err.response?.data?.message || "Delete error"); }
    finally { setLoadingDelete(false); }
  };
  const confirmDeleteToast = () => new Promise((resolve) => {
    const toastId = toast.warning(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Are you sure you want to delete this user?</div>
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(toastId); resolve(true); }}>Yes</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { toast.dismiss(toastId); resolve(false); }}>Cancel</button>
          </div>
        </div>
      ),
      { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
    );
  });

  const resetForm = () => {
    setUser({
      UserId: 0, Name: '', MName: '', LName: '', Sex: '',
      Address: '', Place: '', District: '', Mobile: '', Email: '',
      UserName: '', Password: '', ConformPassword: '', image: null,
      CompanyID: '', BranchID: '', UserRoleId: '',
      BadgeNo: '', EIDNo: '', EIDExpiryDate: '',
      PPNo: '', PPExpiryDate: '',
      VisaNo: '', VisaExpiryDate: '',
      InsuranceNo: '', InsuranceExpiryDate: '',
      GatePassNo: '', GatePassExpiryDate: '',
      WorkmenCompNo: '', WorkmenCompExpiryDate: '',
      ProfLicenseNo: '', ProfLicenseExpiryDate: '',
      Country: '', SupplierID: '',
      ClientIDs: [],     // ← only once
      ProjectIDs: [],    // ← only once
      EmployeeCategoryID: '', ClientTrade: '', SubSponsorID: [], WorkerRate: '', PaymentMode: [],
    });
    setAllocations([{
      id: Date.now(), dbId: null,
      clientID: '', projectID: '',
      startDate: '', endDate: '',
      campID: '', vehicleID: '', roomID: '', bedID: '',
      status: '', remark: '', saved: false, campFilterByProject: true, vehicleFilterByProject: true, campStartDate: '', campEndDate: ''   // ← ADD
    }]);
    setDocuments(emptyDocs());
    setIsSubmitDisabled(false);
    setIsUpdateDisabled(true);
    setIsDeleteDisabled(true);
    setPreviewImage(null);
    setFieldErrors({}); 
    setDocsLoading(false);
    setIsHavenWorker(false);
  };
  const handleEIDChange = useCallback((e) => {
    const formatted = formatEIDInput(e.target.value);
    setUser(prev => ({ ...prev, EIDNo: formatted }));
  }, []);
  const handlePaymentModeChange = (mode) => {
    setUser(prev => {
      const selectedModes = parsePaymentModes(prev.PaymentMode);
      if (mode === 'Both') {
        const hasBothModes = selectedModes.includes('Cash') && selectedModes.includes('Cheque');
        return {
          ...prev,
          PaymentMode: hasBothModes
            ? selectedModes.filter(selected => selected !== 'Cash' && selected !== 'Cheque')
            : [...new Set([...selectedModes, 'Cash', 'Cheque'])]
        };
      }

      return {
        ...prev,
        PaymentMode: selectedModes.includes(mode)
          ? selectedModes.filter(selected => selected !== mode)
          : [...selectedModes, mode]
      };
    });
  };
const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    if (name === "Mobile") {
      if (!/^\d*$/.test(value)) return;   // still digits-only, but no length cap
    }

    setUser(prev => ({ ...prev, [name]: updatedValue }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 300 * 1024) { toast.error("Image size must be under 300 KB"); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onloadend = () => { setPreviewImage(reader.result); setUser(prev => ({ ...prev, image: reader.result })); };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = useCallback((key, newFiles) => {
    setDocuments(prev => ({ ...prev, [key]: [...(prev[key] || []), ...newFiles] }));
  }, []);

  

  const handleClear = () => { resetForm(); setCurrentImage(null); toast.dismiss(); };
  const handleCreateNew = () => {
    if (!canAdd) {
      toast.error("You do not have permission to create worker records.");
      return;
    }
    handleClear();
    setShowForm(true);
    setActiveTab('personal');
  };
  const handleBackToList = () => { setShowForm(false); handleClear(); };
  const supplierOptions = useMemo(() => {
    const set = new Set(userData.map(u => u.SupplierName || u.AccountName).filter(Boolean));
    return [{ value: '', label: 'All Suppliers' }, ...Array.from(set).sort().map(s => ({ value: s, label: s }))];
}, [userData]);

const tradeOptions = useMemo(() => {
    const set = new Set(userData.map(u => u.RoleName).filter(Boolean));
    return [{ value: '', label: 'All Trades' }, ...Array.from(set).sort().map(t => ({ value: t, label: t }))];
}, [userData]);

const projectOptions = useMemo(() => {
    const set = new Set(userData.map(u => u.ProjectName).filter(Boolean));
    return [{ value: '', label: 'All Projects' }, ...Array.from(set).sort().map(p => ({ value: p, label: p }))];
}, [userData]);

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'onhire', label: 'On Hire' },
    { value: 'offhire', label: 'Off Hire' },
];

// const filteredUsers = useMemo(() => {
//     const term = debouncedSearch.toLowerCase();
//     let base = !term
//       ? userData
//       : userData.filter(item =>
//         item.Name?.toLowerCase().includes(term) ||
//         item.Email?.toLowerCase().includes(term) ||
//         item.Mobile?.includes(debouncedSearch) ||
//         (isSuperAdmin && item.CompanyName?.toLowerCase().includes(term))
//       );

//     if (filterHavenId.trim()) {
//         const t = filterHavenId.trim().toLowerCase();
//         base = base.filter(item => String(item.UserId).toLowerCase().includes(t));
//     }
//     if (filterSupplier) {
//         base = base.filter(item => (item.SupplierName || item.AccountName) === filterSupplier);
//     }
//     if (filterTrade) {
//         base = base.filter(item => item.RoleName === filterTrade);
//     }
//     if (filterProject) {
//         base = base.filter(item => item.ProjectName === filterProject);
//     }
//     if (filterStatus) {
//         base = base.filter(item => {
//             const statusLabel = item.AllocationStatus || item.ProjectAllocationStatus;
//             const isOnHire = statusLabel === 'onhire' || statusLabel === 1 || statusLabel === '1';
//             const isOffHire = statusLabel === 'offhire' || statusLabel === 0 || statusLabel === '0';
//             return filterStatus === 'onhire' ? isOnHire : filterStatus === 'offhire' ? isOffHire : true;
//         });
//     }

//     return [...base].sort((a, b) => Number(a.UserId) - Number(b.UserId));
// }, [userData, debouncedSearch, isSuperAdmin, filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus]);
const filteredUsers = useMemo(() => {
    const term = debouncedSearch.toLowerCase().trim();
    let base = !term
      ? userData
      : userData.filter(item => {
        const havenId = `hav/${item.UserId}`.toLowerCase();
        return (
          item.Name?.toLowerCase().includes(term) ||
          item.Email?.toLowerCase().includes(term) ||
          item.Mobile?.includes(debouncedSearch) ||
          havenId.includes(term) ||
          String(item.UserId).includes(term) ||
          (isSuperAdmin && item.CompanyName?.toLowerCase().includes(term))
        );
      });

    if (filterHavenId.trim()) {
        const t = filterHavenId.trim().toLowerCase();
        base = base.filter(item => String(item.UserId).toLowerCase().includes(t));
    }
    if (filterSupplier) {
        base = base.filter(item => (item.SupplierName || item.AccountName) === filterSupplier);
    }
    if (filterTrade) {
        base = base.filter(item => item.RoleName === filterTrade);
    }
    if (filterProject) {
        base = base.filter(item => item.ProjectName === filterProject);
    }
    if (filterStatus) {
        base = base.filter(item => {
            const statusLabel = item.AllocationStatus || item.ProjectAllocationStatus;
            const isOnHire = statusLabel === 'onhire' || statusLabel === 1 || statusLabel === '1';
            const isOffHire = statusLabel === 'offhire' || statusLabel === 0 || statusLabel === '0';
            return filterStatus === 'onhire' ? isOnHire : filterStatus === 'offhire' ? isOffHire : true;
        });
    }

    return [...base].sort((a, b) => Number(a.UserId) - Number(b.UserId));
}, [userData, debouncedSearch, isSuperAdmin, filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus]);

const handleExportUsersExcel = useCallback(() => {
  if (filteredUsers.length === 0) {
    toast.info('No workers to export.');
    return;
  }

  const rows = filteredUsers.map(u => {
    const statusLabel = u.AllocationStatus || u.ProjectAllocationStatus;
    const isOnHire = statusLabel === 'onhire' || statusLabel === 1 || statusLabel === '1';
    const isOffHire = statusLabel === 'offhire' || statusLabel === 0 || statusLabel === '0';
    return {
      'Haven ID': `HAV/${u.UserId}`,
      'Name': fullName(u),
      'Email': u.Email || '',
      'Mobile': u.Mobile || '',
      'Trade': u.RoleName || '',
      'Supplier': u.SupplierName || u.AccountName || '',
      'Project': u.ProjectName || '',
      'Status': isOnHire ? 'On Hire' : isOffHire ? 'Off Hire' : '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 10 }, { wch: 24 }, { wch: 26 }, { wch: 14 },
    { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Workers');

  const activeFilters = [filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus]
    .filter(Boolean).length;
  const suffix = activeFilters > 0 ? '_Filtered' : '';
  const fileName = `Workers${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
  toast.success(`Exported ${rows.length} worker${rows.length > 1 ? 's' : ''} to Excel.`);
}, [filteredUsers, filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus]);

  const btnStyle = {
    minWidth: '120px', borderRadius: '5px', fontWeight: '500',
    background: 'transparent', border: `2px solid ${primaryColor}`,
    color: primaryColor, padding: '10px 20px', fontSize: '14px'
  };

  const tabKeys = tabs.map(t => t.key);
  const currentTabIndex = tabKeys.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabKeys.length - 1;
  const isFirstTab = currentTabIndex === 0;
  const goNext = () => { if (!isLastTab) setActiveTab(tabKeys[currentTabIndex + 1]); };
  const goPrev = () => { if (!isFirstTab) setActiveTab(tabKeys[currentTabIndex - 1]); };

  const tabStyle = (key) => ({
    padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    color: activeTab === key ? primaryColor : '#718096',
    background: 'none', border: 'none',
    borderBottom: activeTab === key ? `3px solid ${primaryColor}` : '3px solid transparent',
    display: 'flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap', transition: 'all 0.2s'
  });

  if (!canView) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="page-body mt-1">
          <div className="container-fluid px-4">
            <div className="alert alert-danger mt-4">
              You do not have permission to view Worker Management.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-body mt-1">
        <div className="container-fluid px-4">
          <ToastContainer position="top-center" autoClose={3000} />

          {/* ════════════════════ LIST VIEW ════════════════════ */}
          {!showForm ? (
            <>
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <h2 className="mb-3" style={{ fontWeight: '600', color: '#2d3748', fontSize: '28px' }}>
                    <FaUser className="me-2" style={{ color: primaryColor }} />
                    Worker Management
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div style={{ maxWidth: '700px', flex: 1 }}>
                      <div className="input-group" style={{ height: '45px' }}>
                        <span className="input-group-text text-white" style={{ backgroundColor: primaryColor }}>
                          <FaSearch />
                        </span>
                        <input type="text" className="form-control border-start-0"
                          placeholder="Search Workers, Company.."
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', height: '45px', fontSize: '14px' }} />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
    <button
        type="button"
        className="btn d-flex align-items-center gap-2 position-relative"
        onClick={() => setIsFilterModalOpen(true)}
        style={{ borderRadius: '0px', padding: '8px 20px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor, height: '45px', whiteSpace: 'nowrap' }}
    >
        <FaFilter /> Filters
        {[filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus].filter(Boolean).length > 0 && (
            <span style={{
                position: 'absolute', top: -6, right: -6, background: '#e53e3e', color: '#fff',
                borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {[filterHavenId, filterSupplier, filterTrade, filterProject, filterStatus].filter(Boolean).length}
            </span>
        )}
    </button>
    <button
        type="button"
        className="btn d-flex align-items-center gap-2"
        onClick={() => {
          if (!canExport) {
            toast.error("You do not have permission to export worker records.");
            return;
          }
          handleExportUsersExcel();
        }}
        disabled={filteredUsers.length === 0 || !canExport}
        title="Export the currently filtered list to Excel"
        style={{
            borderRadius: '0px', padding: '8px 20px', background: 'transparent',
            border: '2px solid #276749', color: '#276749', height: '45px', whiteSpace: 'nowrap',
            opacity: filteredUsers.length === 0 || !canExport ? 0.5 : 1,
            cursor: filteredUsers.length === 0 || !canExport ? 'not-allowed' : 'pointer',
        }}
    >
        <FaFileExcel /> Export Excel
    </button>
    <button type="button" className="btn d-flex align-items-center gap-2"
      onClick={handleCreateNew}
      disabled={!canAdd}
      style={{ borderRadius: '0px', padding: '8px 20px', background: primaryColor, border: 'none', color: 'white', height: '45px', whiteSpace: 'nowrap', opacity: canAdd ? 1 : 0.6 }}>
      <FaPlus /> Create New
    </button>
</div>
                  </div>
                </div>
              </div>


              {isFilterModalOpen && (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-lg">
            <div className="modal-content">
                <div className="modal-header bg-light">
                    <h5 className="modal-title" style={{ color: primaryColor }}>
                        <FaFilter className="me-2" />
                        Worker Filters
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setIsFilterModalOpen(false)}></button>
                </div>

                <div className="modal-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">HAVEN ID</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Haven ID"
                                value={filterHavenId}
                                onChange={(e) => setFilterHavenId(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">SUPPLIER</label>
                            <Select
                                value={supplierOptions.find(o => o.value === filterSupplier)}
                                onChange={(selected) => setFilterSupplier(selected ? selected.value : '')}
                                options={supplierOptions}
                                isClearable
                                placeholder="Select Supplier"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">TRADE</label>
                            <Select
                                value={tradeOptions.find(o => o.value === filterTrade)}
                                onChange={(selected) => setFilterTrade(selected ? selected.value : '')}
                                options={tradeOptions}
                                isClearable
                                placeholder="Select Trade"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">PROJECT</label>
                            <Select
                                value={projectOptions.find(o => o.value === filterProject)}
                                onChange={(selected) => setFilterProject(selected ? selected.value : '')}
                                options={projectOptions}
                                isClearable
                                placeholder="Select Project"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">STATUS</label>
                            <Select
                                value={statusOptions.find(o => o.value === filterStatus)}
                                onChange={(selected) => setFilterStatus(selected ? selected.value : '')}
                                options={statusOptions}
                                isClearable
                                placeholder="Select Status"
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer bg-light">
                    <div className="d-flex justify-content-between w-100">
                        <button
                            type="button"
                            className="btn btn-link text-danger"
                            onClick={() => {
                                setFilterHavenId('');
                                setFilterSupplier('');
                                setFilterTrade('');
                                setFilterProject('');
                                setFilterStatus('');
                            }}
                        >
                            Clear All
                        </button>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsFilterModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn"
                                style={{ background: primaryColor, color: '#fff' }}
                                onClick={() => setIsFilterModalOpen(false)}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}

              <div className="card border-0 shadow-sm" style={{ borderRadius: '0px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }} />
                      <p className="mt-3 text-muted">Loading users...</p>
                    </div>
                  ) : (
                    <table className="table table-hover mb-0">
                      <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          {['HAVEN ID', 'Name', 'Trade', 'Supplier', 'Project', 'Status'].map(h => (
                            <th key={h} className="py-3 px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {h}
                            </th>
                          ))}
                          <th className="py-3 text-center px-4" style={{ color: '#4a5568', fontWeight: '600', fontSize: '13px', width: '70px' }}>PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((userItem) => (
                            <UserRow
                              key={userItem.UserId}
                              userItem={userItem}
                              isSelected={user.UserId === userItem.UserId}
                              onRowClick={handleRowClick}
                              onDownload={handleDownloadPDF}
                              downloadingId={downloadingId}
                              primaryColor={primaryColor}
                            />
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center p-5">
                              <FaUser className="mb-3" style={{ fontSize: '48px', color: '#cbd5e0' }} />
                              <p className="text-muted mb-3">No users found</p>
                              <button className="btn" onClick={handleCreateNew}
                                style={{ borderRadius: '5px', padding: '10px 24px', background: primaryColor, border: 'none', color: 'white', fontSize: '14px' }}>
                                <FaPlus className="me-2" />Create New Worker
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div> 
              </div>
            </>
          ) : (
            /* ════════════════════ FORM VIEW ════════════════════ */
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0px', overflow: 'hidden' }}>

              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-0"
                style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h4 className="m-0" style={{ color: '#2d3748', fontWeight: '600', fontSize: '18px' }}>
                  <FaUser className="me-2" style={{ color: primaryColor }} />
                  {user.UserId ? 'Edit Worker' : 'New Worker'}
                </h4>
                <button className="btn d-flex align-items-center gap-2" onClick={handleBackToList}
                  style={{ borderRadius: '5px', padding: '8px 16px', fontSize: '14px', background: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor }}>
                  <FaArrowLeft /> Back to List
                </button>
              </div>

              {/* ── Tabs ── */}
              <div style={{ borderBottom: '1px solid #e2e8f0', background: '#fff', paddingLeft: '16px', overflowX: 'auto' }}>
                <div className="d-flex">
                  {tabs.map(t => (
                    <button key={t.key} type="button" style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
                      {t.icon} {t.label}
                      {/* Badge on Documents tab (edit mode only) */}
                      {t.key === 'documents' && (() => {
                        if (docsLoading) return (
                          <span className="spinner-border spinner-border-sm ms-1"
                            style={{ width: '10px', height: '10px', borderWidth: '2px', color: primaryColor }} />
                        );
                        const total = Object.values(documents).reduce((s, arr) => s + (arr?.length || 0), 0);
                        return total > 0
                          ? <span style={{ background: primaryColor, color: '#fff', fontSize: '9px', borderRadius: '8px', padding: '1px 5px', marginLeft: '2px' }}>{total}</span>
                          : null;
                      })()}
                    </button>
                  ))}

                  {/* ── "Documents" tab shown as disabled in CREATE mode ── */}
                  {!isEditing && (
                    <button
                      type="button"
                      disabled
                      title="Complete user creation first, then you can manage documents"
                      style={{
                        ...tabStyle('documents'),
                        color: '#cbd5e0',
                        cursor: 'not-allowed',
                        borderBottom: '3px solid transparent',
                        opacity: 0.6,
                      }}
                    >
                      <FaFileAlt /> Documents
                      <span style={{
                        background: '#e2e8f0', color: '#a0aec0',
                        fontSize: '9px', borderRadius: '8px', padding: '1px 6px', marginLeft: '4px'
                      }}>
                        After save
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body p-4">
                <form onSubmit={(e) => e.preventDefault()}>
                  {/* ── TAB: Personal Info ── */}
                  {activeTab === 'personal' && (
                    <div className="row g-3">
                      {isSuperAdmin && (
                        <div className="col-md-6">
                          <label className="form-label fw-medium mb-2">Company <span className="text-danger">*</span></label>
                          <select className={`form-select ${fieldErrors.CompanyID ? 'is-invalid' : ''}`}
                            name="CompanyID" value={user.CompanyID || ""} onChange={handleCompanyChange}>
                            <option value="">Select Company</option>
                            {companyList.map(c => <option key={c.CompanyId} value={c.CompanyId}>{c.CompanyName}</option>)}
                          </select>
                          {fieldErrors.CompanyID && <div className="invalid-feedback">{fieldErrors.CompanyID}</div>}
                        </div>
                      )}

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">First Name <span className="text-danger">*</span></label>
                        <input className={`form-control ${fieldErrors.Name ? 'is-invalid' : ''}`}
                          name="Name" value={user.Name} onChange={handleInputChange} placeholder="Enter first name" />
                        {fieldErrors.Name && <div className="invalid-feedback">{fieldErrors.Name}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Middle Name</label>
                        <input className="form-control"
                          name="MName" value={user.MName} onChange={handleInputChange} placeholder="Enter middle name" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Last Name</label>
                        <input className="form-control"
                          name="LName" value={user.LName} onChange={handleInputChange} placeholder="Enter last name" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">
                          EID Number <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.EIDNo ? 'is-invalid' : ''}`}
                          name="EIDNo"
                          value={user.EIDNo}
                          onChange={handleEIDChange}
                          placeholder="784-XXXX-XXXXXXX-X"
                          maxLength={18}
                        />
                        {fieldErrors.EIDNo && <div className="invalid-feedback">{fieldErrors.EIDNo}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">EID Expiry Date</label>
                        <div className="input-group">
                          <span className="input-group-text"><FaCalendarAlt style={{ color: primaryColor }} /></span>
                          <input
                            type="date"
                            className="form-control"
                            name="EIDExpiryDate"
                            value={user.EIDExpiryDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">
                          Email <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                        </label>
                        <input type="email" className={`form-control ${fieldErrors.Email ? 'is-invalid' : ''}`}
                          name="Email" value={user.Email} onChange={handleInputChange} placeholder="Enter email" />
                        {fieldErrors.Email && <div className="invalid-feedback">{fieldErrors.Email}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Mobile <span className="text-danger">*</span></label>
                        <input className={`form-control ${fieldErrors.Mobile ? 'is-invalid' : ''}`}
  name="Mobile" value={user.Mobile}
  onChange={handleInputChange} placeholder="Enter mobile" />
                        {fieldErrors.Mobile && <div className="invalid-feedback">{fieldErrors.Mobile}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Gender <span className="text-danger">*</span></label>
                        <select className={`form-select ${fieldErrors.Sex ? 'is-invalid' : ''}`}
                          name="Sex" value={user.Sex || ""} onChange={handleInputChange}>
                          <option value="">Select Gender</option>
                          <option value="0">Male</option>
                          <option value="1">Female</option>
                          <option value="2">Others</option>
                        </select>
                        {fieldErrors.Sex && <div className="invalid-feedback">{fieldErrors.Sex}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Trade<span className="text-danger">*</span></label>
                        <select className={`form-select ${fieldErrors.UserRoleId ? 'is-invalid' : ''}`}
                          name="UserRoleId" value={user.UserRoleId || ""} onChange={handleInputChange}>
                          <option value="">Select Role</option>
                          {roleList.map(r => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
                        </select>
                        {fieldErrors.UserRoleId && <div className="invalid-feedback">{fieldErrors.UserRoleId}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">
                          Badge No. <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                        </label>
                        <input className="form-control" name="BadgeNo" value={user.BadgeNo}
                          onChange={handleInputChange} placeholder="Enter badge number" />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">
                          Rate / Salary <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                        </label>
                        <div className="d-flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            name="WorkerRate"
                            value={user.WorkerRate}
                            onChange={handleInputChange}
                            placeholder="Enter rate"
                          />

                          {isEditing && (
                            <button
                              type="button"
                              title="View Rate History"
                              onClick={openRateHistory}
                              style={{
                                background: '#f0f4ff', border: `1.5px solid ${primaryColor}`, color: primaryColor,
                                borderRadius: '6px', width: '36px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                            >
                              <FaHistory style={{ fontSize: '13px' }} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Payment Mode</label>
                        <div className="d-flex flex-wrap gap-3">
                          {PAYMENT_MODES.map(mode => (
                            <div className="form-check" key={mode}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`payment-mode-${mode}`}
                                checked={user.PaymentMode.includes(mode)}
                                onChange={() => handlePaymentModeChange(mode)}
                              />
                              <label className="form-check-label" htmlFor={`payment-mode-${mode}`}>
                                {mode}
                              </label>
                            </div>
                          ))}
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="payment-mode-both"
                              checked={user.PaymentMode.includes('Cash') && user.PaymentMode.includes('Cheque')}
                              onChange={() => handlePaymentModeChange('Both')}
                            />
                            <label className="form-check-label" htmlFor="payment-mode-both">
                              Both (Cash + Cheque)
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Nationality</label>

                        <select className="form-select" name="District" value={user.District} onChange={handleInputChange}>
                          <option value="">Select Nationality</option>
                          {countryList.map(c => (
                            <option key={c.iso2} value={NATIONALITY_MAP[c.name] || c.name}>
                              {NATIONALITY_MAP[c.name] || c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-8">
                        <hr style={{ borderColor: '#e2e8f0' }} />
                        <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: primaryColor, fontSize: '14px' }}>
                          <FaCamera /> Profile Photo
                          <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Optional</span>
                        </div>
                        <div className="d-flex align-items-center gap-4 flex-wrap">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '100px', height: '100px', border: `3px solid ${primaryColor}`, overflow: 'hidden' }}>
                            {(previewImage || currentImage)
                              ? <img src={previewImage || currentImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <FaUser style={{ fontSize: '40px', color: '#a0aec0' }} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <input type="file" className="form-control mb-2" accept="image/*"
                              onChange={handleFileChange} style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <small className="text-muted">Max size: 300KB. JPG, PNG, WEBP accepted.</small>
                            {(previewImage || currentImage) && (
                              <button type="button" className="btn btn-sm mt-2 d-flex align-items-center gap-1"
                                style={{ color: '#e53e3e', background: 'none', border: '1px solid #e53e3e', borderRadius: '6px' }}
                                onClick={() => { setPreviewImage(null); setCurrentImage(null); setUser(prev => ({ ...prev, image: null })); }}>
                                <FaTimesCircle /> Remove Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: Account & Role / Allocation ── */}
                  {activeTab === 'account' && (
                    <div className="row g-3">
                      {/* Branch */}
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">Branch <span className="text-danger">*</span></label>
                        <select className={`form-select ${fieldErrors.BranchID ? 'is-invalid' : ''}`}
                          name="BranchID" value={user.BranchID || ""} onChange={handleInputChange}>
                          <option value="">Select Branch</option>
                          {branchList.map(b => <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>)}
                        </select>
                        {fieldErrors.BranchID && <div className="invalid-feedback">{fieldErrors.BranchID}</div>}
                      </div>
                      {/* Employee Category */}
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">Employee Category</label>
                        <select
                          className="form-select"
                          name="EmployeeCategoryID"
                          value={user.EmployeeCategoryID || ""}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Employee Category</option>
                          {employeeCategoryList.map(cat => (
                            <option key={cat.CategoryID} value={cat.CategoryID}>
                              {cat.CategoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-medium mb-2">Client Trade</label>
                        <select
                          className="form-select"
                          name="ClientTrade"
                          value={user.ClientTrade || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Client Trade</option>
                          {roleList.map(r => (
                            <option key={r.RoleID} value={r.RoleName}>{r.RoleName}</option>
                          ))}
                        </select>
                      </div>
                      {/* ── Is this a Haven worker? toggle ── */}
                      <div className="col-12">
                        <div
                          style={{
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: '10px', padding: '14px 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>
                              Is this a Haven worker?
                            </div>
                            <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
                              Haven workers get a system login — username and password.
                            </div>
                          </div>

                          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${primaryColor}` }}>
                            <button
                              type="button"
                              onClick={() => setIsHavenWorker(true)}
                              style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: '600',
                                border: 'none', cursor: 'pointer',
                                background: isHavenWorker ? primaryColor : '#fff',
                                color: isHavenWorker ? '#fff' : primaryColor,
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsHavenWorker(false);
                                const randomUser = randomWord(6);
                                const randomPass = randomWord(8);
                                setUser(prev => ({ ...prev, UserName: randomUser, Password: randomPass, ConformPassword: randomPass }));
                              }}
                              style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: '600',
                                border: 'none', cursor: 'pointer',
                                background: !isHavenWorker ? primaryColor : '#fff',
                                color: !isHavenWorker ? '#fff' : primaryColor,
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── Username / Password / Confirm Password — only when Haven worker ── */}
                      {isHavenWorker && (
                        <>
                          <div className="col-md-6">
                            <label className="form-label fw-medium mb-2">Username <span className="text-danger">*</span></label>
                            <input className={`form-control ${fieldErrors.UserName ? 'is-invalid' : ''}`}
                              name="UserName" value={user.UserName} onChange={handleInputChange} placeholder="Enter username" />
                            {fieldErrors.UserName && <div className="invalid-feedback">{fieldErrors.UserName}</div>}
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-medium mb-2">
                              Password {user.UserId === 0 && <span className="text-danger">*</span>}
                            </label>
                            <input type="password" className={`form-control ${fieldErrors.Password ? 'is-invalid' : ''}`}
                              name="Password" value={user.Password} onChange={handleInputChange} placeholder="Enter password" />
                            {fieldErrors.Password && <div className="invalid-feedback">{fieldErrors.Password}</div>}
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-medium mb-2">
                              Confirm Password {user.UserId === 0 && <span className="text-danger">*</span>}
                            </label>
                            <input type="password" className={`form-control ${fieldErrors.ConformPassword ? 'is-invalid' : ''}`}
                              name="ConformPassword" value={user.ConformPassword} onChange={handleInputChange} placeholder="Confirm password" />
                            {fieldErrors.ConformPassword && <div className="invalid-feedback">{fieldErrors.ConformPassword}</div>}
                          </div>
                        </>
                      )}
                      {/* Supplier */}
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">
                          Supplier <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Single</span>
                        </label>
                        <select className="form-select" name="SupplierID" value={user.SupplierID || ""} onChange={e => {
  const val = e.target.value;
  setUser(prev => ({ ...prev, SupplierID: val, SubSponsorID: [] }));
  if (val) fetchSubSponsorsBySupplier(val);
}}>
                          <option value="">Select Supplier</option>
                          {sponsorList.map(s => (
                            <option key={s.AccountID} value={s.AccountID}>{s.AccountName}</option>
                          ))}
                        </select>
                      </div>
                      {/* Sub Sponsor - shown only when supplier is selected */}
                      {user.SupplierID && (
  <div className="col-md-6">
    <label className="form-label fw-medium mb-2">
      Sub Supplier <span className="badge ms-1" style={{ background: '#e2e8f0', color: '#718096', fontSize: '10px' }}>Multiple</span>
    </label>

    <div ref={subSponsorDropdownRef} style={{ position: 'relative' }}>
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={() => setSubSponsorDropdownOpen(prev => !prev)}
        style={{
          width: '100%', textAlign: 'left', background: '#fff',
          border: `1.5px solid ${subSponsorDropdownOpen ? primaryColor : '#dee2e6'}`,
          borderRadius: '7px', padding: '8px 12px', fontSize: '13px',
          color: (user.SubSponsorID || []).length > 0 ? '#2d3748' : '#a0aec0',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '8px'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(user.SubSponsorID || []).length > 0
            ? (subSponsorList[user.SupplierID] || [])
                .filter(s => (user.SubSponsorID || []).map(x => String(x).trim()).includes(String(s.SubSponsorID).trim()))
                .map(s => s.SubSponsorName)
                .join(', ')
            : 'Select sub-supplier(s)'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {(user.SubSponsorID || []).length > 0 && (
            <span style={{
              background: `${primaryColor}15`, color: primaryColor,
              fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 7px'
            }}>
              {user.SubSponsorID.length}
            </span>
          )}
          <span style={{ fontSize: '10px', color: '#a0aec0', transform: subSponsorDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
        </span>
      </button>

      {/* Dropdown panel */}
      {subSponsorDropdownOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '220px', overflowY: 'auto'
        }}>
          {(subSponsorList[user.SupplierID] || []).length === 0 && (
            <div style={{ padding: '12px', fontSize: '13px', color: '#a0aec0' }}>No sub-suppliers available.</div>
          )}

          {(subSponsorList[user.SupplierID] || []).length > 0 && (
            <div
              onClick={() => setUser(prev => ({ ...prev, SubSponsorID: [] }))}
              style={{
                padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#e53e3e',
                cursor: 'pointer', borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Clear all
            </div>
          )}

          {(subSponsorList[user.SupplierID] || []).map((s, idx) => {
            const sid = String(s.SubSponsorID).trim();
            const selected = Array.isArray(user.SubSponsorID) &&
              user.SubSponsorID.map(x => String(x).trim()).includes(sid);
            return (
              <div
                key={`${sid}-${idx}`}
                onClick={() => handleSubSponsorToggle(sid)}
                style={{
                  padding: '9px 12px', fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: selected ? `${primaryColor}0c` : 'transparent',
                  color: selected ? primaryColor : '#2d3748',
                  fontWeight: selected ? '600' : '400'
                }}
                onMouseEnter={e => e.currentTarget.style.background = selected ? `${primaryColor}18` : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = selected ? `${primaryColor}0c` : 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  style={{ pointerEvents: 'none', accentColor: primaryColor }}
                />
                {s.SubSponsorName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}

                      {/* ── Allocation Section ── */}
                      <div className="col-12 mt-3">
                        <hr style={{ borderColor: '#e2e8f0' }} />
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div>
                            <div className="fw-semibold d-flex align-items-center gap-2" style={{ color: primaryColor, fontSize: '15px' }}>
                              <FaBriefcase /> Allocation
                            </div>
                            <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px' }}>
                              Assign the worker to clients, projects, camps and transportation per allocation period.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addAllocationRow}
                            style={{
                              background: primaryColor, color: '#fff', border: 'none',
                              borderRadius: '7px', padding: '7px 16px', fontSize: '13px',
                              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                            }}
                          >
                            <FaPlus style={{ fontSize: '10px' }} /> Add Row
                          </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: `${primaryColor}12` }}>
                              {['Client', 'Project', 'Start Date', 'End Date', 'Camp', 'Room/Bed', 'Vehicle', 'Status', 'Remark', 'Action', ''].map((h, i) => (
                                <th key={i} style={{
                                  padding: '8px 10px', textAlign: 'left', fontSize: '11px',
                                  fontWeight: '700', color: primaryColor, textTransform: 'uppercase',
                                  border: `1px solid ${primaryColor}25`, whiteSpace: 'nowrap'
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {allocations.map((row, idx) => {
                              const usedProjects = getUsedProjects(row.id, row.clientID);
                              const availableProjects = (projectsByClient[row.clientID] || [])
                                .filter(p => !usedProjects.includes(String(p.UnitID)));

                              return (
                                <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbff' }}>
                                  {/* Client */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                    <select
                                      value={row.clientID}
                                      onChange={e => handleAllocationClientChange(row.id, e.target.value)}
                                      style={{ width: '100%', fontSize: '12px', border: '1.5px solid #dee2e6', borderRadius: '5px', padding: '4px 6px', height: '32px' }}
                                    >
                                      <option value="">— Client —</option>
                                      {clientList.map(c => (
                                        <option key={c.AccountID} value={c.AccountID}>{c.AccountName}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Project */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                    <select
                                      value={row.projectID}
                                      onChange={e => {
                                        updateAllocation(row.id, 'projectID', e.target.value);
                                        updateAllocation(row.id, 'campID', '');
                                        updateAllocation(row.id, 'vehicleID', '');
                                        updateAllocation(row.id, 'roomID', '');
                                        updateAllocation(row.id, 'bedID', '');
                                        if (e.target.value) {
                                          fetchCampsByProject(e.target.value);
                                          fetchVehiclesByProject(e.target.value);
                                          // fetchRoomsByProject removed — rooms load once a camp is picked, below
                                        }
                                      }}
                                      disabled={!row.clientID}
                                      style={{ width: '100%', fontSize: '12px', border: '1.5px solid #dee2e6', borderRadius: '5px', padding: '4px 6px', height: '32px', background: !row.clientID ? '#f7f7f7' : '#fff' }}
                                    >
                                      <option value="">— Project —</option>
                                      {availableProjects.map(p => (
                                        <option key={p.UnitID} value={p.UnitID}>{p.UnitName}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Start Date */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                    <input type="date" value={row.startDate}
                                      onChange={e => {
                                        updateAllocation(row.id, 'startDate', e.target.value);
                                        // clear end date if it's now before new start date
                                        if (row.endDate && e.target.value > row.endDate) {
                                          updateAllocation(row.id, 'endDate', '');
                                          toast.warning("End date cleared — it was before the new start date");
                                        }
                                      }}
                                      max={row.endDate || ''}
                                      style={{ width: '100%', fontSize: '12px', border: '1.5px solid #dee2e6', borderRadius: '5px', padding: '4px 6px', height: '32px' }} />
                                  </td>

                                  {/* End Date */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                    <input type="date" value={row.endDate}
                                      onChange={e => {
                                        if (row.startDate && e.target.value < row.startDate) {
                                          toast.warning("End date must be after start date");
                                          return;
                                        }
                                        updateAllocation(row.id, 'endDate', e.target.value);
                                      }}
                                      min={row.startDate || ''}
                                      style={{
                                        width: '100%', fontSize: '12px', borderRadius: '5px', padding: '4px 6px', height: '32px',
                                        border: `1.5px solid ${(row.status === 'offhire' && !row.endDate) ||
                                          (row.endDate && row.startDate && row.endDate < row.startDate)
                                          ? '#e53e3e' : '#dee2e6'
                                          }`
                                      }} />
                                    {row.status === 'offhire' && !row.endDate && (
                                      <div style={{ fontSize: '10px', color: '#e53e3e', marginTop: '3px' }}>
                                        ⚠ Required for Off Hire
                                      </div>
                                    )}
                                  </td>
                                  {/* Camp */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', minWidth: '180px' }}>
                                    {/* Toggle */}
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      marginBottom: '5px', fontSize: '10px', color: '#718096'
                                    }}>
                                      <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>Camp Source:</span>
                                      <div
                                        onClick={() => {
                                          const next = !row.campFilterByProject;
                                          updateAllocation(row.id, 'campFilterByProject', next);
                                          if (!next) fetchUnlinkedCamps();
                                        }}
                                        style={{
                                          width: '32px', height: '16px', borderRadius: '8px', cursor: 'pointer',
                                          background: row.campFilterByProject ? primaryColor : '#cbd5e0',
                                          position: 'relative', transition: 'background 0.2s', flexShrink: 0
                                        }}
                                      >
                                        <div style={{
                                          position: 'absolute', top: '2px',
                                          left: row.campFilterByProject ? '18px' : '2px',
                                          width: '12px', height: '12px', borderRadius: '50%',
                                          background: '#fff', transition: 'left 0.2s',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                      </div>
                                      <span style={{
  whiteSpace: 'nowrap',
  color: row.campFilterByProject ? primaryColor : '#a0aec0',
  fontWeight: '600'
}}>
  {row.campFilterByProject ? 'Client Provided Camp' : 'Haven Provided Camp'}
</span>
                                    </div>

                                    {/* Camp select */}
                                    <select
                                      value={row.campID}
                                      onChange={e => {
                                        updateAllocation(row.id, 'campID', e.target.value);
                                        updateAllocation(row.id, 'roomID', '');
                                        updateAllocation(row.id, 'bedID', '');
                                        setBedPickerRow(null);
                                        if (e.target.value) fetchRoomsByCamp(row.id, e.target.value);
                                      }}
                                      disabled={!row.projectID}
                                      style={{
                                        width: '100%', fontSize: '12px', border: '1.5px solid #dee2e6',
                                        borderRadius: '5px', padding: '4px 6px', height: '32px',
                                        background: !row.projectID ? '#f7f7f7' : '#fff'
                                      }}
                                    >
                                      <option value="">— Camp —</option>
                                      {(campsByProject[row.projectID] || []).length > 0 && (
    <optgroup label="Project Camps">
      {(campsByProject[row.projectID] || []).map(c => (
        <option key={c.CampID} value={c.CampID}>{c.CampName}</option>
      ))}
    </optgroup>
  )}
  {!row.campFilterByProject && unlinkedCamps.length > 0 && (
    <optgroup label="Other Available Camps">
      {unlinkedCamps
        .filter(c => !(campsByProject[row.projectID] || []).some(pc => pc.CampID === c.CampID))
        .map(c => (
          <option key={c.CampID} value={c.CampID}>{c.CampName}</option>
        ))
      }
    </optgroup>
  )}
  <optgroup label="All Camps">
    {campList
      .filter(c =>
        !(campsByProject[row.projectID] || []).some(pc => pc.CampID === c.CampID) &&
        !unlinkedCamps.some(uc => uc.CampID === c.CampID)
      )
      .map(c => (
        <option key={c.CampID} value={c.CampID}>{c.CampName}</option>
      ))
    }
  </optgroup>
                                    </select>

                                    {/* ← PASTE HERE, right after </select>, still inside the same <td> */}
                                    {row.campID && row.dbId && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await api.get('/api/GetCampAllocationHistory', {
                                              params: { WorkerAllocationId: row.dbId }
                                            });
                                            const history = res.data.history || [];
                                            if (history.length === 0) {
                                              toast.info("No reallocation history for this row.");
                                              return;
                                            }
                                            toast.info(
                                              <div>
                                                <div style={{ fontWeight: '700', marginBottom: '6px' }}>Camp History</div>
                                                {history.map((h, i) => (
                                                  <div key={i} style={{ fontSize: '11px', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                                    <div>Camp #{h.CampID} — {new Date(h.ChangedDate).toLocaleDateString('en-GB')}</div>
                                                    <div style={{ color: '#718096' }}>{h.Remarks}</div>
                                                  </div>
                                                ))}
                                              </div>,
                                              { autoClose: false }
                                            );
                                          } catch {
                                            toast.error("Failed to load history");
                                          }
                                        }}
                                        style={{
                                          marginTop: '3px', width: '100%',
                                          fontSize: '10px', fontWeight: '600',
                                          background: '#e8f4fd', border: '1px solid #bee3f8',
                                          color: '#2b6cb0', borderRadius: '5px',
                                          padding: '3px 6px', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                        }}
                                      >
                                        📋 View History
                                      </button>
                                    )}
                                  </td>
                                  {/* Room & Bed — opens popup */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      disabled={!row.campID}
                                      onClick={() => {
                                        if (row.campID) {
                                          fetchRoomsByCamp(row.id, row.campID);
                                          setBedPickerRow({ rowId: row.id, campID: row.campID });
                                        }
                                      }}
                                      style={{
                                        background: row.bedID ? '#f0fff4' : row.campID ? primaryColor : '#f7f7f7',
                                        border: `1.5px solid ${row.bedID ? '#38a169' : row.campID ? primaryColor : '#dee2e6'}`,
                                        color: row.bedID ? '#38a169' : row.campID ? '#fff' : '#a0aec0',
                                        borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                                        cursor: row.campID ? 'pointer' : 'not-allowed',
                                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
                                      }}
                                    >
                                      {row.bedID
                                        ? <>{bedsByAllocation[row.id]?.find(b => String(b.BedID) === String(row.bedID))?.BedNo
                                          || (roomsByAllocation[row.id]?.flatMap(r => r.beds || []).find(b => String(b.BedID) === String(row.bedID))?.BedNo)
                                          || `Bed #${row.bedID}`}</>
                                        : row.roomID
                                          ? 'Bed not set'
                                          : row.campID
                                            ? 'Pick Room/Bed'
                                            : '— —'
                                      }
                                    </button>
                                  </td>
                                  {/* Vehicle */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', minWidth: '180px', textAlign: 'center' }}>
                                    {/* Toggle — single row, matches Camp Source layout */}
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      marginBottom: '5px', fontSize: '10px', color: '#718096', justifyContent: 'center'
                                    }}>
                                      <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>Vehicle Source:</span>
                                      <div
                                        onClick={() => {
                                          const next = !row.vehicleFilterByProject;
                                          updateAllocation(row.id, 'vehicleFilterByProject', next);
                                          if (next) {
                                            // switching to Haven Provided → force refresh project-scoped vehicles
                                            if (row.projectID) fetchVehiclesByProject(row.projectID, true);
                                          } else {
                                            // switching to Client Provided → load unlinked vehicles
                                            fetchUnlinkedVehicles();
                                          }
                                        }}
                                        style={{
                                          width: '32px', height: '16px', borderRadius: '8px', cursor: 'pointer',
                                          background: row.vehicleFilterByProject ? primaryColor : '#cbd5e0',
                                          position: 'relative', transition: 'background 0.2s', flexShrink: 0
                                        }}
                                      >
                                        <div style={{
                                          position: 'absolute', top: '2px',
                                          left: row.vehicleFilterByProject ? '18px' : '2px',
                                          width: '12px', height: '12px', borderRadius: '50%',
                                          background: '#fff', transition: 'left 0.2s',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                      </div>
                                      <span style={{
                                        whiteSpace: 'nowrap',
                                        color: row.vehicleFilterByProject ? primaryColor : '#a0aec0',
                                        fontWeight: '600'
                                      }}>
                                        {row.vehicleFilterByProject ? 'Client Provided Vehicle' : 'Haven Provided Vehicle'}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={!row.projectID}
                                      onClick={() => {
                                        if (row.projectID) {
                                          setVehiclePickerRow({ rowId: row.id, projectID: row.projectID });
                                        }
                                      }}
                                      style={{
                                        background: row.vehicleID ? '#f0fff4' : row.projectID ? primaryColor : '#f7f7f7',
                                        border: `1.5px solid ${row.vehicleID ? '#38a169' : row.projectID ? primaryColor : '#dee2e6'}`,
                                        color: row.vehicleID ? '#38a169' : row.projectID ? '#fff' : '#a0aec0',
                                        borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                                        cursor: row.projectID ? 'pointer' : 'not-allowed',
                                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', width: '100%',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      {row.vehicleID
                                        ? <>
                                          {(vehiclesByProject[row.projectID] || []).find(v => String(v.VehicleID) === String(row.vehicleID))?.VehicleNumber
                                            || unlinkedVehicles.find(v => String(v.VehicleID) === String(row.vehicleID))?.VehicleNumber
                                            || `Vehicle #${row.vehicleID}`}
                                          {row.vehicleStartDate && (
                                            <span style={{ fontSize: '9px', color: '#276749', marginLeft: '4px' }}>
                                              {row.vehicleStartDate}
                                            </span>
                                          )}
                                        </>
                                        : row.projectID ? 'Pick Vehicle' : '— —'
                                      }
                                    </button>
                                  </td>
                                  {/* Status */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                    <select
                                      value={row.status}
                                      onChange={e => {
                                        if (e.target.value === 'onhire' && isOnHireUsed(row.id)) {
                                          toast.warning("Only one worker can be On Hire at a time");
                                          return;
                                        }
                                        updateAllocation(row.id, 'status', e.target.value);
                                      }}
                                      style={{
                                        width: '100%', fontSize: '12px', borderRadius: '5px', padding: '4px 6px', height: '32px',
                                        border: `1.5px solid ${row.status === 'onhire' ? '#38a169' : row.status === 'offhire' ? '#e53e3e' : '#dee2e6'}`,
                                        color: row.status === 'onhire' ? '#38a169' : row.status === 'offhire' ? '#e53e3e' : '#2d3748',
                                        fontWeight: row.status ? '600' : '400'
                                      }}
                                    >
                                      <option value="">— Status —</option>
                                      <option value="onhire" disabled={isOnHireUsed(row.id) && row.status !== 'onhire'}>
                                        On Hire {isOnHireUsed(row.id) && row.status !== 'onhire' ? '(already set)' : ''}
                                      </option>
                                      <option value="offhire">Off Hire</option>
                                    </select>
                                  </td>
                                  {/* Remark */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>
                                    <textarea
                                      value={row.remark || ''}
                                      onChange={e => updateAllocation(row.id, 'remark', e.target.value)}
                                      placeholder="Remark..."
                                      rows={1}
                                      style={{
                                        width: '100%', fontSize: '12px', border: '1.5px solid #dee2e6',
                                        borderRadius: '5px', padding: '4px 6px',
                                        background: '#fff', outline: 'none',
                                        color: '#2d3748', minWidth: '100px',
                                        resize: 'vertical', minHeight: '32 px', maxHeight: '80px',
                                        lineHeight: '1.4', boxSizing: 'border-box'
                                      }}
                                    />
                                  </td>
                                  {/* Remove */}
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (allocations.length === 1) {
                                          // Don't delete — just clear the row and release bed if any
                                          if (row.bedID) {
                                            try {
                                              await api.post('/api/UpdateBedStatus', {
                                                BedID: parseInt(row.bedID),
                                                UserID: null
                                              });
                                            } catch { toast.error("Failed to release bed"); }
                                          }
                                          // If saved in DB, delete from DB too
                                          if (row.dbId) {
                                            try {
                                              const DeletedBy = sessionStorage.getItem("UserId");
                                              await api.post('/api/DeleteProjectAllocation', {
                                                WorkerAllocationId: row.dbId,
                                                DeletedBy,
                                                DeletedDate: new Date().toISOString()
                                              });
                                              toast.success("Allocation cleared");
                                            } catch {
                                              toast.error("Failed to delete allocation");
                                              return;
                                            }
                                          }
                                          // Reset the single row instead of removing it
                                          setAllocations([{
                                            id: Date.now(), dbId: null,
                                            clientID: '', projectID: '',
                                            startDate: '', endDate: '',
                                            campID: '', vehicleID: '',
                                            roomID: '', bedID: '',
                                            status: '', remark: '', saved: false, campFilterByProject: true, vehicleFilterByProject: true, campStartDate: '', campEndDate: ''
                                          }]);
                                          return;
                                        }
                                        // More than one row — normal delete
                                        handleDeleteAllocationRow(row);
                                      }}
                                      style={{
                                        background: 'none', border: '1px solid #feb2b2',
                                        borderRadius: '5px', color: '#e53e3e', cursor: 'pointer',
                                        width: '30px', height: '30px', opacity: 1  // always full opacity now
                                      }}
                                    >
                                      <FaTimesCircle />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )}
                  {/* ── TAB: ID & Visa ── */}
                  {activeTab === 'id_docs' && (
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="alert d-flex align-items-center gap-2 mb-3"
                          style={{ background: '#f0f4ff', border: `1px solid ${primaryColor}20`, borderRadius: '8px', color: '#2d3748', fontSize: '13px' }}>
                          <FaIdCard style={{ color: primaryColor, fontSize: '16px', flexShrink: 0 }} />
                          Passport, Trade License, and Workmen Compensation are mandatory. All other fields are optional.
                        </div>
                      </div>
                      {[
                        { title: 'Trade License', icon: <FaGlobe />, noField: 'ProfLicenseNo', noPlaceholder: 'Enter Trade license number', dateField: 'ProfLicenseExpiryDate', required: true },
                        { title: 'Passport', icon: <FaPassport />, noField: 'PPNo', noPlaceholder: 'Enter passport number', dateField: 'PPExpiryDate', required: true }, 
                        { title: 'Workmen Compensation', icon: <FaGlobe />, noField: 'WorkmenCompNo', noPlaceholder: 'Enter workmen compensation number', dateField: 'WorkmenCompExpiryDate', required: true },
                        { title: 'Visa', icon: <FaGlobe />, noField: 'VisaNo', noPlaceholder: 'Enter visa number', dateField: 'VisaExpiryDate' },
                        { title: 'Insurance', icon: <FaGlobe />, noField: 'InsuranceNo', noPlaceholder: 'Enter insurance number', dateField: 'InsuranceExpiryDate' },
                        { title: 'Gate Pass', icon: <FaGlobe />, noField: 'GatePassNo', noPlaceholder: 'Enter gate pass number', dateField: 'GatePassExpiryDate' },
                        
                      ].map(({ title, icon, noField, noPlaceholder, dateField, required }) => (
                        <div className="col-6" key={noField}>
                          <div className="p-3 mb-2" style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: primaryColor, fontSize: '14px' }}>
                              {icon} {title}
                            </div>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium mb-2">
                                  {title.split(' ')[0]} No. {required && <span className="text-danger">*</span>}
                                </label>
                                <input
                                  className={`form-control ${fieldErrors[noField] ? 'is-invalid' : ''}`}
                                  name={noField}
                                  value={user[noField]}
                                  onChange={handleInputChange}
                                  placeholder={noPlaceholder}
                                />
                                {fieldErrors[noField] && <div className="invalid-feedback">{fieldErrors[noField]}</div>}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium mb-2">
                                  {title.split(' ')[0]} Expiry Date {required && <span className="text-danger">*</span>}
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text"><FaCalendarAlt style={{ color: primaryColor }} /></span>
                                  <input
                                    type="date"
                                    className={`form-control ${fieldErrors[dateField] ? 'is-invalid' : ''}`}
                                    name={dateField}
                                    value={user[dateField]}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                                {fieldErrors[dateField] && <div className="invalid-feedback d-block">{fieldErrors[dateField]}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── TAB: Documents (edit mode only) ── */}
                                    {/* ── TAB: Rentals / Cheque / Cash / Tenancy ── */}
                  {activeTab === 'rentals' && isEditing && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">Property</label>
                        <select className="form-select"
                          value={selectedRentalPropertyId || ''}
                          onChange={async (e) => {
                            const pid = Number(e.target.value) || null;
                            setSelectedRentalPropertyId(pid);
                            setSelectedRentalUnitId('');
                            setRentalId(null);
                            setTransactions([]);
                            if (pid) await loadRentalUnits(pid);
                          }}>
                          <option value="">-- Select property --</option>
                          {rentalProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium mb-2">Unit</label>
                        <select className="form-select" disabled={!selectedRentalPropertyId}
                          value={selectedRentalUnitId || ''}
                          onChange={async (e) => {
                            const uid = e.target.value;
                            setSelectedRentalUnitId(uid);
                            if (!uid) return;
                            const CompanyID = Number(sessionStorage.getItem("CompanyID")) || 0;
                            const rr = await api.get("/api/getPropertyRental", {
                              params: { CompanyID, PropertyID: selectedRentalPropertyId },
                            });
                            const rental = (rr.data?.data || rr.data?.recordset || [])
                              .find(r => String(r.RecordID) === String(uid));
                            setRentalId(rental?.RentalID || null);
                            if (rental?.RentalID) await loadTransactions(rental.RentalID, selectedRentalPropertyId);
                          }}>
                          <option value="">-- Select unit --</option>
                          {rentalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>

                      <div className="col-12 mt-2">
                        <div className="fw-semibold mb-2" style={{ color: primaryColor }}>
                          <FaBuilding className="me-1" /> Rental Transactions
                        </div>

                        {transactions.length === 0 && (
                          <div className="text-muted small mb-2">
                            No transactions yet. Use the buttons below to add a Cheque, Cash, or Tenancy entry.
                          </div>
                        )}

                        {transactions.map(t => (
                          <div key={t.id}
                            className="d-flex align-items-center gap-2 mb-2"
                            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                            <span style={{
                              minWidth: 90, fontSize: 12, fontWeight: 700, color: primaryColor,
                              background: `${primaryColor}12`, borderRadius: 6, padding: '4px 10px',
                              textAlign: 'center',
                            }}>
                              {t.label}
                            </span>
                            <input type="number" step="0.01" className="form-control form-control-sm"
                              placeholder="Amount" style={{ maxWidth: 140 }}
                              value={t.amount}
                              onChange={e => updateTransaction(t.id, 'amount', e.target.value)} />
                            <input type="date" className="form-control form-control-sm"
                              style={{ maxWidth: 160 }}
                              value={t.date}
                              onChange={e => updateTransaction(t.id, 'date', e.target.value)} />
                            <input type="file" className="form-control form-control-sm"
                              accept="image/*,.pdf"
                              onChange={e => updateTransaction(t.id, 'file', e.target.files[0] || null)} />
                            {!t.file && t.path && (
                              <a href={rentalFileUrl(t.path)} target="_blank" rel="noreferrer"
                                 style={{ fontSize: 11 }}>View</a>
                            )}
                            <button type="button" className="btn btn-sm"
                              style={{ color: '#e53e3e', border: '1px solid #feb2b2' }}
                              onClick={() => handleDeleteTransaction(t)}>
                              <FaTimesCircle />
                            </button>
                          </div>
                        ))}

                        <div className="d-flex gap-2 mt-3">
                          <button type="button" className="btn btn-sm"
                            style={{ border: `1.5px solid ${primaryColor}`, color: primaryColor }}
                            onClick={() => addTransaction('Cheque')}>
                            <FaPlus /> Add Cheque
                          </button>
                          <button type="button" className="btn btn-sm"
                            style={{ border: `1.5px solid ${primaryColor}`, color: primaryColor }}
                            onClick={() => addTransaction('Cash')}>
                            <FaPlus /> Add Cash
                          </button>
                          <button type="button" className="btn btn-sm"
                            style={{ border: `1.5px solid ${primaryColor}`, color: primaryColor }}
                            onClick={() => addTransaction('Tenancy')}>
                            <FaPlus /> Add Tenancy
                          </button>
                          <button type="button" className="btn btn-sm ms-auto"
                            style={{ background: primaryColor, color: '#fff', minWidth: 160 }}
                            onClick={handleSaveTransactions}>
                            <FaSave /> Save All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && isEditing && (
                    <div>
                      <div className="alert d-flex align-items-center gap-2 mb-4"
                        style={{ background: '#f0f4ff', border: `1px solid ${primaryColor}20`, borderRadius: '8px', color: '#2d3748', fontSize: '13px' }}>
                        <FaFileAlt style={{ color: primaryColor, fontSize: '16px', flexShrink: 0 }} />
                        Each field supports <strong>multiple files</strong>. Use the <strong>Update</strong> button on each card to save changes for that document type individually.
                        Formats: Images (JPG, PNG), PDF, DOC, DOCX, XLS, XLSX, TXT.
                      </div>

                      {docsLoading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border" role="status" style={{ color: primaryColor, width: '2rem', height: '2rem' }} />
                          <p className="mt-3 text-muted" style={{ fontSize: '14px' }}>Loading documents...</p>
                        </div>
                      ) : (
                        <div className="row g-3">
                          {DOC_TYPES.map(dt => (
                            <div className="col-md-6" key={dt.key}>
                              <DocumentMultiUploadCard
                                docKey={dt.key}
      label={dt.label}
      icon={dt.icon}
      required={dt.required}
      files={documents[dt.key] || []}
                                onChange={(newFiles) => handleDocumentChange(dt.key, newFiles)}
                                onRemove={(idx) => handleDocumentRemove(dt.key, idx)}
                                isEditing={isEditing}
                                onUpdate={handleDocumentUpdate}
                                isUpdating={updatingDocKey === dt.key}
                                onLabelChange={(idx, val) => {
                                  if (dt.key !== 'otherDocument') return;
                                  setDocuments(prev => {
                                    const updated = [...prev.otherDocument];
                                    const entry = updated[idx];
                                    updated[idx] = Object.assign(
                                      entry instanceof File ? entry : { ...entry },
                                      { label: val }
                                    );
                                    return { ...prev, otherDocument: updated };
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Action Buttons ── */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                        {/* Left: Previous */}
                        <div>
                          {!isFirstTab && (
                            <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                              style={btnStyle} onClick={goPrev}>← Previous</button>
                          )}
                        </div>

                        {/* Center: Delete / Update / Clear — only in edit mode */}
                        <div className="d-flex flex-wrap gap-3 justify-content-center">
                          {isEditing && (
                            <>
                              <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                                style={btnStyle} disabled={isDeleteDisabled || loadingDelete || !canDelete} onClick={handleDelete}>
                                {loadingDelete
                                  ? <><span className="spinner-border spinner-border-sm" />Deleting...</>
                                  : <><FaTrashAlt /> Delete</>}
                              </button>
                              <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                                style={btnStyle} disabled={isUpdateDisabled || loadingUpdate || !canEdit} onClick={handleUpdate}>
                                {loadingUpdate
                                  ? <><span className="spinner-border spinner-border-sm" />Updating...</>
                                  : <><FaEdit /> Update</>}
                              </button>
                            </>
                          )}
                          <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                            style={btnStyle} onClick={handleClear}>
                            <FaEraser /> Clear
                          </button>
                        </div>

                        {/* Right: Next / Submit */}
                        <div>
                          {/* In create mode: last tab (ID & Visa) shows Submit */}
                          {!isEditing && isLastTab && (
                            <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                              style={{ ...btnStyle, background: primaryColor, color: '#fff' }}
                              disabled={isSubmitDisabled || loadingSubmit || !canAdd} onClick={handleSubmit}>
                              {loadingSubmit
                                ? <><span className="spinner-border spinner-border-sm" />Creating...</>
                                : <><FaSave /> Submit</>}
                            </button>
                          )}
                          {/* Next button for non-last tabs */}
                          {!isLastTab && (
                            <button type="button" className="btn px-4 d-flex align-items-center gap-2"
                              style={{ ...btnStyle, background: primaryColor, color: '#fff' }} onClick={goNext}>
                              Next →
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bed Picker Modal */}
      {bedPickerRow && (
        <BedPickerModal
          key={bedPickerRow.rowId}
          rowId={bedPickerRow.rowId}
          rooms={roomsByAllocation[bedPickerRow.rowId] || []}
          currentRoomID={allocations.find(r => r.id === bedPickerRow.rowId)?.roomID || ''}
          currentBedID={allocations.find(r => r.id === bedPickerRow.rowId)?.bedID || ''}
          currentCampStartDate={allocations.find(r => r.id === bedPickerRow.rowId)?.campStartDate || ''}
          currentCampEndDate={allocations.find(r => r.id === bedPickerRow.rowId)?.campEndDate || ''}
          onSelect={handleBedPickerSelect}
          onClose={() => setBedPickerRow(null)}
          primaryColor={primaryColor}
        />
      )}
      {/* Vehicle Picker Modal */}
      {vehiclePickerRow && (
        <VehiclePickerModal
          key={vehiclePickerRow.rowId}
          rowId={vehiclePickerRow.rowId}
          vehicles={[
            ...(vehiclesByProject[vehiclePickerRow.projectID] || []),
            ...(!allocations.find(r => r.id === vehiclePickerRow.rowId)?.vehicleFilterByProject
              ? unlinkedVehicles.filter(v =>
                !(vehiclesByProject[vehiclePickerRow.projectID] || []).some(pv => pv.VehicleID === v.VehicleID)
              )
              : [])
          ]}
          currentVehicleID={allocations.find(r => r.id === vehiclePickerRow.rowId)?.vehicleID || ''}
          currentVehicleStartDate={allocations.find(r => r.id === vehiclePickerRow.rowId)?.vehicleStartDate || ''}
          currentVehicleEndDate={allocations.find(r => r.id === vehiclePickerRow.rowId)?.vehicleEndDate || ''}
          onSelect={handleVehiclePickerSelect}
          onClose={() => setVehiclePickerRow(null)}
          primaryColor={primaryColor}
        />
      )}
      {campReallocateRow && (
        <CampReallocateModal
          key={campReallocateRow.rowId}
          rowId={campReallocateRow.rowId}
          currentCampID={campReallocateRow.currentCampID}
          campsByProject={campsByProject[campReallocateRow.projectID] || []}
          onSelect={handleCampReallocate}
          onClose={() => setCampReallocateRow(null)}
          primaryColor={primaryColor}
        />
      )}
      {showRateHistory && (
        <RateHistoryModal
          history={rateHistory}
          loading={loadingRateHistory}
          onClose={() => setShowRateHistory(false)}
          primaryColor={primaryColor}
          roleList={roleList}
        />
      )}
    </div>
  );
}

export default UserInfo;