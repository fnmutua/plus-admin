const MAX_PROJECT_COST = Number.MAX_SAFE_INTEGER;

function parseProjectCost(raw) {
  if (raw == null || raw === '') {
    return { value: null };
  }

  const normalized = String(raw).replace(/[,\s]/g, '');
  if (!/^-?\d+$/.test(normalized)) {
    return { error: 'Project cost must be a whole number in KSh.' };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { error: 'Project cost must be a whole number in KSh.' };
  }
  if (parsed < 0) {
    return { error: 'Project cost cannot be negative.' };
  }
  if (parsed > MAX_PROJECT_COST) {
    return { error: 'Project cost is too large.' };
  }

  return { value: parsed };
}

function isIntegerOverflowError(error) {
  const code = error?.parent?.code || error?.original?.code;
  const message = error?.parent?.message || error?.original?.message || error?.message || '';
  return code === '22003' && /integer|bigint|numeric/i.test(message);
}

module.exports = {
  MAX_PROJECT_COST,
  parseProjectCost,
  isIntegerOverflowError,
};
