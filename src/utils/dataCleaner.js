/**
 * MPLADS Data Cleaner & Normalizer
 * Implements data quality cleaning as defined in README Section 9
 */

const STATUS_MAPPINGS = {
  'completed': 'COMPLETED',
  'complete': 'COMPLETED',
  'finished': 'COMPLETED',
  'done': 'COMPLETED',
  'in progress': 'IN_PROGRESS',
  'ongoing': 'IN_PROGRESS',
  'under execution': 'IN_PROGRESS',
  'recommended': 'RECOMMENDED',
  'sanctioned': 'SANCTIONED',
  'rejected': 'REJECTED',
  'delayed': 'DELAYED'
};

const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return 'RECOMMENDED';
  const clean = String(rawStatus).trim().toLowerCase();
  return STATUS_MAPPINGS[clean] || 'RECOMMENDED';
};

const parseAmount = (rawAmount) => {
  if (rawAmount === undefined || rawAmount === null) return 0;
  if (typeof rawAmount === 'number') return isNaN(rawAmount) ? 0 : rawAmount;
  // Strip currency symbols (₹, Rs), commas, and whitespace
  const sanitized = String(rawAmount).replace(/[₹,Rs\s]/gi, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
};

const parseDate = (rawDate) => {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
};

const normalizeText = (text) => {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ');
};

module.exports = {
  normalizeStatus,
  parseAmount,
  parseDate,
  normalizeText
};
