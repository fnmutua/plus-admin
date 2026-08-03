/** Display label for a project_location row (any location_type). */
function resolveProjectLocationLabel(loc) {
  if (!loc) return 'Unknown location';

  const storedName =
    typeof loc.location_name === 'string' ? loc.location_name.trim() : '';
  if (storedName) return storedName;

  if (loc.settlement?.name) return String(loc.settlement.name).trim();
  if (loc.ward?.name) return String(loc.ward.name).trim();
  if (loc.subcounty?.name) return String(loc.subcounty.name).trim();
  if (loc.county?.name) return String(loc.county.name).trim();

  const type = String(loc.location_type || '').trim().toLowerCase();
  if (type === 'settlement' && loc.settlement_id) return `Settlement ${loc.settlement_id}`;
  if (type === 'ward' && loc.ward_id) return `Ward ${loc.ward_id}`;
  if (type === 'subcounty' && loc.subcounty_id) return `Subcounty ${loc.subcounty_id}`;
  if (type === 'county' && loc.county_id) return `County ${loc.county_id}`;

  return 'Unknown location';
}

module.exports = {
  resolveProjectLocationLabel,
};
