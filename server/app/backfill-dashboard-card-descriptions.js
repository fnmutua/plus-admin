'use strict';

/**
 * Backfill internal descriptions for all dashboard_card rows from their config.
 *
 * Usage:
 *   node server/app/backfill-dashboard-card-descriptions.js [kisip|kesmis] [--dry-run] [--force]
 *
 * Options:
 *   --dry-run  Print planned updates without writing to the database.
 *   --force    Update even when the generated description matches the current value.
 */

process.env.VUE_APP_DB_HOST = process.env.VUE_APP_DB_HOST || 'localhost';
process.env.VUE_APP_USER = process.env.VUE_APP_USER || 'postgres';
process.env.VUE_APP_PASSWORD =
  process.env.VUE_APP_PASSWORD ?? process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? 'Admin@2011';
process.env.VUE_APP_DB_PORT = String(
  process.env.VUE_APP_DB_PORT ?? process.env.DB_PORT ?? '5432'
);

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((arg) => arg.startsWith('--')));
const dryRun = flags.has('--dry-run');
const force = flags.has('--force');

const databaseName = args[0] || process.env.DATABASE_NAME || process.env.VUE_APP_DB || 'kisip';

if (databaseName !== 'kisip' && databaseName !== 'kesmis') {
  console.error('Invalid database name. Must be either "kisip" or "kesmis".');
  console.error('Usage: node server/app/backfill-dashboard-card-descriptions.js [kisip|kesmis] [--dry-run] [--force]');
  process.exit(1);
}

process.env.VUE_APP_DB = databaseName;

const ENTITY_LABELS = {
  settlement: 'settlements',
  settlement_population: 'settlement population records',
  grievance: 'grievances',
  households: 'households',
  project_location: 'projects',
  project_beneficiary: 'project beneficiaries',
  education_facility: 'education facilities',
  health_facility: 'health facilities',
  road: 'roads',
  water_point: 'water points',
  piped_water: 'piped water networks',
  sewer: 'sewer lines',
  other_facility: 'other facilities',
  indicator_category_report: 'indicator reports',
  article: 'articles',
  community: 'community groups',
  media: 'media items',
  parcel: 'parcels',
};

const AGGREGATION_LABELS = {
  count: 'count of',
  sum: 'sum of',
  average: 'average of',
  avg: 'average of',
};

const OPERATION_LABELS = {
  eq: 'equals',
  ne: 'not equal to',
  lt: 'less than',
  lte: 'less than or equal to',
  gt: 'greater than',
  gte: 'greater than or equal to',
  all: 'any value',
};

function humanize(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value == null || value === '') return 'any';
  if (Array.isArray(value)) {
    const items = value.filter((item) => item != null && item !== '');
    if (!items.length) return 'any';
    if (items.length <= 3) return items.join(', ');
    return `${items.slice(0, 3).join(', ')} +${items.length - 3} more`;
  }
  return String(value);
}

function formatFilterClause(field, operation, value) {
  const op = OPERATION_LABELS[operation] || humanize(operation);
  if (operation === 'all') {
    return `${field} (${op})`;
  }
  return `${field} ${op} ${formatValue(value)}`;
}

function formatFilters(card) {
  const clauses = [];

  if (Array.isArray(card.filters) && card.filters.length) {
    for (const filter of card.filters) {
      if (!filter?.field) continue;
      clauses.push(formatFilterClause(filter.field, filter.operation, filter.value));
    }
  } else if (card.filtered && card.filter_field) {
    clauses.push(
      formatFilterClause(card.filter_field, card.filter_function || 'eq', card.filter_value)
    );
  }

  return clauses.join('; ');
}

function truncate(text, maxLength = 255) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildDescription(card, dashboardTitle, indicatorCategory) {
  const parts = [];
  const aggregation = (card.aggregation || 'count').toLowerCase();
  const aggregationLabel = AGGREGATION_LABELS[aggregation] || `${aggregation} of`;
  const displayTitle = card.title ? `"${card.title}"` : `card #${card.id}`;

  if (card.category === 'Indicator' || card.category === 'Intervention') {
    const indicatorName = indicatorCategory?.indicator_name || `indicator category #${card.indicator_category_id || 'unknown'}`;
    const categoryTitle = indicatorCategory?.category_title ? ` (${indicatorCategory.category_title})` : '';
    parts.push(
      `Internal note for ${displayTitle}: M&E indicator card showing the ${aggregationLabel} reported amounts for ${indicatorName}${categoryTitle}.`
    );
  } else {
    const entityLabel = ENTITY_LABELS[card.card_model] || humanize(card.card_model) || 'records';
    const fieldPart = card.card_model_field ? ` "${card.card_model_field}"` : ' records';
    const computation =
      card.computation === 'proportion'
        ? ' Displayed as a percentage of the entity total.'
        : ' Displayed as an absolute value.';
    const distinct = card.unique ? ' Uses distinct values only.' : '';
    parts.push(
      `Internal note for ${displayTitle}: ${humanize(card.category || 'Status')} card showing the ${aggregationLabel}${fieldPart} across ${entityLabel}.${computation}${distinct}`
    );
  }

  const filterSummary = formatFilters(card);
  if (filterSummary) {
    parts.push(`Filtered where ${filterSummary}.`);
  }

  if (dashboardTitle) {
    parts.push(`Belongs to dashboard "${dashboardTitle}".`);
  }

  return truncate(parts.join(' ').replace(/\s+/g, ' ').trim());
}

async function main() {
  const db = require('./models');

  console.log('Backfilling dashboard card descriptions');
  console.log(`Database: ${databaseName}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);
  console.log(`Force update unchanged rows: ${force ? 'yes' : 'no'}`);

  await db.sequelize.authenticate();

  const cards = await db.models.dashboard_card.findAll({
    include: [
      {
        model: db.models.dashboard,
        attributes: ['id', 'title'],
      },
      {
        model: db.models.indicator_category,
        attributes: ['id', 'indicator_name', 'category_title'],
        required: false,
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!cards.length) {
    console.log('No dashboard cards found.');
    await db.sequelize.close();
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const card of cards) {
    const plain = card.get({ plain: true });
    const nextDescription = buildDescription(
      plain,
      plain.dashboard?.title,
      plain.indicator_category
    );
    const currentDescription = (plain.description || '').trim();

    if (!force && currentDescription === nextDescription) {
      skipped += 1;
      continue;
    }

    console.log(`\n#${plain.id} ${plain.title}`);
    console.log(`  current: ${currentDescription || '(empty)'}`);
    console.log(`  next:    ${nextDescription}`);

    if (!dryRun) {
      await db.models.dashboard_card.update(
        { description: nextDescription },
        { where: { id: plain.id } }
      );
    }

    updated += 1;
  }

  console.log('\nSummary');
  console.log(`  cards scanned: ${cards.length}`);
  console.log(`  ${dryRun ? 'would update' : 'updated'}: ${updated}`);
  console.log(`  skipped: ${skipped}`);

  await db.sequelize.close();
}

main().catch(async (error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
