'use strict';

const fuzzball = require('fuzzball');
const {
  normalizeKey,
  normalizeCountyKey,
  normalizeTitleKey,
  buildProjectIndexes,
  countyIdForName,
  subcountyIdForName,
} = require('../server/lib/sudRegionalTrackerImport');

/** Counties that often differ between M&E source files and KeSMIS admin boundaries. */
const COUNTY_NEIGHBORS = {
  nyeri: ['laikipia', 'kirinyaga', 'muranga'],
  laikipia: ['nyeri', 'nakuru', 'meru'],
  kirinyaga: ['nyeri', 'muranga', 'embu', 'marsabit'],
  marsabit: ['isiolo', 'samburu', 'wajir', 'kirinyaga'],
  'elgeyo marakwet': ['trans nzoia', 'uasin gishu', 'west pokot', 'baringo'],
  'homa bay': ['kisumu', 'migori', 'kisii'],
  'taita taveta': ['kwale', 'mombasa', 'kilifi'],
};

const SETTLEMENT_ALIASES = {
  'swahili sangoro': ['swahili', 'sangoro', 'swahili kisumu'],
  'manyatta a': ['manyatta a', 'manyatta', 'manyatta kona mbaya'],
  'manyatta b': ['manyatta b', 'manyatta'],
  'london hilton': ['london hilton', 'lakeview', 'karagita', 'kwa murogi'],
  '1000 street': ['1000 street', '1000 st'],
  matisi: ['matisi', 'folkland matisi'],
  mitume: ['mitume', 'mitume maumau'],
  tuwani: ['tuwani', 'tuwani estate'],
  'keroka block b': ['keroka block b', 'keroka b', 'keroka'],
  'kijiji cha chewa': ['kijiji cha chewa', 'chewa', 'chewani'],
  'mazeras centremiwani mgumo wa pasta': ['mazeras centre', 'miwani', 'mgumo wa pasta', 'mazeras'],
  'shauri timboroa': ['shauri', 'shauri timboroa', 'timboroa'],
  'kisumu ngogo': ['kisumu ngogo', 'ngogo'],
  'ndindiruku b': ['ndindiruku b', 'ndindiruku'],
  mweiga: ['mweiga'],
};

function normalizeSettlementKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\bphase\s*\d+\b/g, ' ')
    .replace(/\b(informal settlement|settlement|slum|estate|mjini)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function settlementNameVariants(externalName) {
  const raw = String(externalName || '').trim();
  const variants = new Set([raw]);

  for (const part of raw.split(/[/,]|(?:\s+and\s+)/i)) {
    const p = part.trim();
    if (p.length > 2) variants.add(p);
  }

  const merged = raw.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (merged !== raw) variants.add(merged);

  const key = normalizeSettlementKey(raw);
  if (SETTLEMENT_ALIASES[key]) {
    for (const alias of SETTLEMENT_ALIASES[key]) variants.add(alias);
  }

  return [...variants].filter(Boolean);
}

function parseContractMeta(contract, county) {
  const text = normalizeKey(contract);
  const countyKey = normalizeCountyKey(county);
  let lot = null;
  let phase = null;
  let tender = null;

  const lotMatch = text.match(/(\w+(?:\s+\w+)?)\s+lot\s+(\d+)/);
  if (lotMatch) {
    const lotCounty = normalizeCountyKey(lotMatch[1]);
    if (!countyKey || lotCounty.includes(countyKey) || countyKey.includes(lotCounty)) {
      lot = Number(lotMatch[2]);
    }
  }
  const phaseMatch = text.match(/phase\s+(\d+)/);
  if (phaseMatch) phase = Number(phaseMatch[1]);
  if (text.includes('rfq')) tender = 'RFQ';
  if (text.includes('rfb')) tender = 'RFB';

  return { lot, phase, tender, isGeneric: !lot && (tender || phase) };
}

function isGenericContract(contract) {
  const meta = parseContractMeta(contract, '');
  return meta.isGeneric || normalizeKey(contract).match(/^phase\s+\d+\s+rf[qb]$/);
}

function resolvePdoContracts(rows) {
  const byCountySettlement = new Map();
  const lastFullByCounty = new Map();

  for (const row of rows) {
    const contract = String(row.external_contract || '').trim();
    if (!contract || isGenericContract(contract)) continue;
    if (/lot\s+\d+/i.test(contract)) {
      byCountySettlement.set(
        `${normalizeCountyKey(row.external_county)}|${normalizeSettlementKey(row.external_settlement)}`,
        contract,
      );
      lastFullByCounty.set(normalizeCountyKey(row.external_county), contract);
    }
  }

  for (const row of rows) {
    const countyKey = normalizeCountyKey(row.external_county);
    const settKey = normalizeSettlementKey(row.external_settlement);
    const specific = byCountySettlement.get(`${countyKey}|${settKey}`);
    const inherited = lastFullByCounty.get(countyKey);
    row.effective_contract =
      !isGenericContract(row.external_contract)
        ? row.external_contract
        : specific || inherited || row.external_contract;
    row.contract_meta = parseContractMeta(row.effective_contract, row.external_county);
  }
  return rows;
}

function buildSettlementIndex(settlements) {
  const byCountyName = new Map();
  const byName = new Map();

  for (const s of settlements) {
    const countyKey = `${s.county_id}|${normalizeSettlementKey(s.name)}`;
    if (!byCountyName.has(countyKey)) byCountyName.set(countyKey, []);
    byCountyName.get(countyKey).push(s);

    const nameKey = normalizeSettlementKey(s.name);
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey).push(s);
  }
  return { byCountyName, byName, all: settlements };
}

function scoreSettlementCandidate(externalName, candidate, countyId, subcountyId) {
  let best = 0;
  for (const variant of settlementNameVariants(externalName)) {
    const rawScore = Math.max(
      fuzzball.token_set_ratio(variant, candidate.name),
      fuzzball.partial_ratio(variant, candidate.name),
    );
    let score = rawScore;
    if (normalizeSettlementKey(variant) === normalizeSettlementKey(candidate.name)) score = 100;
    if (Number(candidate.county_id) === Number(countyId)) score += 8;
    else if (rawScore < 95) score -= 15;
    else score -= 5;
    if (subcountyId && Number(candidate.subcounty_id) === Number(subcountyId)) score += 5;
    if (score > best) best = score;
  }
  return best;
}

function findMatchingSettlement(externalName, countyId, subcountyId, settlementIndex, counties) {
  if (!externalName) return { settlement: null, method: 'none', score: 0 };

  const tryCountyIds = countyId ? [countyId] : [];
  if (countyId && counties) {
    const county = counties.find((c) => Number(c.id) === Number(countyId));
    if (county) {
      const neighbors = COUNTY_NEIGHBORS[normalizeCountyKey(county.name)] || [];
      for (const n of neighbors) {
        const nid = countyIdForName(counties, n);
        if (nid && !tryCountyIds.includes(nid)) tryCountyIds.push(nid);
      }
    }
  }
  if (!tryCountyIds.length && countyId) tryCountyIds.push(countyId);

  for (const cid of tryCountyIds) {
    for (const variant of settlementNameVariants(externalName)) {
      const exactKey = `${cid}|${normalizeSettlementKey(variant)}`;
      const exact = settlementIndex.byCountyName.get(exactKey);
      if (exact?.length === 1) {
        return {
          settlement: exact[0],
          method: cid === countyId ? 'exact' : 'exact_neighbor_county',
          score: 100,
        };
      }
      if (exact?.length > 1 && subcountyId) {
        const scoped = exact.find((s) => Number(s.subcounty_id) === Number(subcountyId));
        if (scoped) return { settlement: scoped, method: 'exact_subcounty', score: 100 };
      }
    }

    const candidates = settlementIndex.all.filter((s) => Number(s.county_id) === Number(cid));
    let best = null;
    let bestScore = 0;
    for (const s of candidates) {
      const score = scoreSettlementCandidate(externalName, s, countyId, subcountyId);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    const threshold = cid === countyId ? 76 : 88;
    if (best && bestScore >= threshold) {
      return {
        settlement: best,
        method: cid === countyId ? 'fuzzy' : 'fuzzy_neighbor_county',
        score: bestScore,
      };
    }
  }

  // Global last resort — unique strong name match
  let globalBest = null;
  let globalScore = 0;
  for (const s of settlementIndex.all) {
    const score = scoreSettlementCandidate(externalName, s, countyId, subcountyId);
    if (score > globalScore) {
      globalScore = score;
      globalBest = s;
    }
  }
  if (globalBest && globalScore >= 85) {
    return {
      settlement: globalBest,
      method: Number(globalBest.county_id) === Number(countyId) ? 'fuzzy_global' : 'fuzzy_cross_county',
      score: globalScore,
    };
  }

  return { settlement: null, method: 'unmatched', score: globalScore };
}

function buildInfraProjectIndex(projects) {
  const byCountyLot = new Map();
  const byCountyPhase = new Map();
  const byCounty = new Map();

  for (const project of projects) {
    const titleKey = normalizeKey(project.title);
    if (!titleKey.includes('infrastructure upgrading')) continue;

    let m = titleKey.match(/infrastructure upgrading\s+in\s+(.+?)\s+lot\s+(\d+)/);
    if (m) {
      const county = normalizeCountyKey(m[1]);
      const lot = Number(m[2]);
      byCountyLot.set(`${county}|${lot}`, project);
      continue;
    }

    m = titleKey.match(/infrastructure upgrading\s+in\s+(.+?)\s+phase\s+(\d+)/);
    if (m) {
      byCountyPhase.set(`${normalizeCountyKey(m[1])}|${m[2]}`, project);
      continue;
    }

    m = titleKey.match(/infrastructure upgrading\s+in\s+(.+?)(?:\s+county|$)/);
    if (m) {
      const county = normalizeCountyKey(m[1].replace(/\s*-?\s*afd$/i, '').trim());
      if (!byCounty.has(county)) byCounty.set(county, []);
      byCounty.get(county).push(project);
    }
  }

  return { byCountyLot, byCountyPhase, byCounty };
}

function buildProjectsBySettlement(projectLocations, projects) {
  const projectById = new Map(projects.map((p) => [Number(p.id), p]));
  const bySettlement = new Map();

  for (const pl of projectLocations) {
    if (!pl.settlement_id) continue;
    const sid = Number(pl.settlement_id);
    if (!bySettlement.has(sid)) bySettlement.set(sid, []);
    const project = projectById.get(Number(pl.project_id));
    if (project) bySettlement.get(sid).push({ project, projectLocationId: pl.id });
  }
  return bySettlement;
}

function pickBestProjectForSettlement(settlementId, projectsBySettlement, preferInfra = true) {
  const hits = projectsBySettlement.get(Number(settlementId)) || [];
  if (!hits.length) return null;

  const scored = hits.map(({ project, projectLocationId }) => {
    let score = 0;
    const title = normalizeKey(project.title);
    if (title.includes('infrastructure upgrading')) score += 50;
    if (title.includes('kisip')) score += 20;
    if (title.includes('survey') || title.includes('planning')) score += 10;
    return { project, projectLocationId, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (preferInfra && scored[0].score < 10) return scored[0];
  return scored[0];
}

function normalizeContractKey(value) {
  return normalizeKey(String(value || '').replace(/\s+/g, ' '));
}

function findMatchingProject(row, projects, indexes, infraIndex, projectsBySettlement, matchedSettlementId) {
  const externalContract = row.effective_contract || row.external_contract;
  const externalCounty = row.external_county;
  const externalSettlement = row.external_settlement;
  const meta = row.contract_meta || parseContractMeta(externalContract, externalCounty);
  const countyKey = normalizeCountyKey(externalCounty);

  // 1) Existing project_location for this settlement
  if (matchedSettlementId) {
    const fromPl = pickBestProjectForSettlement(matchedSettlementId, projectsBySettlement);
    if (fromPl) {
      return {
        project: fromPl.project,
        method: 'settlement_project_location',
        score: 130,
        projectLocationId: fromPl.projectLocationId,
      };
    }
  }

  // 2) Contract exact / partial on project_code
  const contractKey = normalizeContractKey(externalContract);
  if (contractKey) {
    const byCode = indexes.byCode.get(contractKey);
    if (byCode) return { project: byCode, method: 'contract_exact', score: 120 };

    for (const project of projects) {
      const dbCode = normalizeContractKey(project.project_code);
      if (!dbCode) continue;
      if (dbCode === contractKey || dbCode.includes(contractKey) || contractKey.includes(dbCode)) {
        return { project, method: 'contract_partial', score: 100 };
      }
    }
  }

  // 3) County + lot from effective contract → infrastructure project index
  if (meta.lot && countyKey) {
    const hit = infraIndex.byCountyLot.get(`${countyKey}|${meta.lot}`);
    if (hit) return { project: hit, method: 'county_lot_infra', score: 110 };
  }

  // 4) County name embedded in mislabeled project titles (KeSMIS quirk: "In Kakamega Lot 1" under Nakuru code)
  if (meta.lot && countyKey) {
    for (const project of projects) {
      const titleKey = normalizeKey(project.title);
      if (!titleKey.includes('infrastructure upgrading')) continue;
      if (titleKey.includes(countyKey) && titleKey.includes(`lot ${meta.lot}`)) {
        return { project, method: 'county_lot_title', score: 105 };
      }
    }
  }

  // 5) Generic Phase RFQ/RFB — county-level infra project
  if (meta.phase && countyKey) {
    const phaseHit = infraIndex.byCountyPhase.get(`${countyKey}|${meta.phase}`);
    if (phaseHit) return { project: phaseHit, method: 'county_phase_infra', score: 95 };

    const countyProjects = infraIndex.byCounty.get(countyKey) || [];
    if (countyProjects.length === 1) {
      return { project: countyProjects[0], method: 'county_infra_unique', score: 90 };
    }
    if (meta.tender === 'RFB' && countyKey === 'nairobi') {
      const afd = countyProjects.find((p) => normalizeKey(p.title).includes('afd'));
      if (afd) return { project: afd, method: 'nairobi_afd', score: 92 };
    }
  }

  // 6) Comp 1.1 — lot/cluster planning projects
  const lotTok = normalizeKey(row.source_lot || row.comp11_lot || '');
  const clusterTok = normalizeKey(row.external_cluster || row.comp11_cluster || '');
  let best = null;
  let bestScore = 0;

  for (const project of projects) {
    let score = 0;
    const titleKey = normalizeTitleKey(project.title);
    const codeKey = normalizeContractKey(project.project_code);

    if (countyKey && titleKey.includes(countyKey.replace(/\s*county\s*/g, ' ').trim())) score += 25;
    if (lotTok) {
      for (const m of lotTok.match(/lot\s*\d+/g) || []) {
        if (titleKey.includes(m.replace(/\s+/g, '')) || titleKey.includes(normalizeKey(m))) score += 22;
      }
      if (titleKey.includes(normalizeKey(row.source_lot))) score += 18;
    }
    if (clusterTok) {
      for (const m of clusterTok.match(/cluster\s*\d+/g) || []) {
        if (titleKey.includes(m.replace(/\s+/g, ''))) score += 16;
      }
    }
    if (titleKey.includes('survey') || titleKey.includes('planning')) score += 12;
    if (titleKey.includes('infrastructure upgrading')) score += 8;

    if (externalSettlement) {
      const settKey = normalizeSettlementKey(externalSettlement).split(' ')[0];
      if (settKey.length > 3 && titleKey.includes(settKey)) score += 6;
    }

    if (score > bestScore) {
      bestScore = score;
      best = project;
    }
  }

  if (best && bestScore >= 34) {
    return { project: best, method: 'lot_cluster_fuzzy', score: bestScore };
  }

  return { project: null, method: 'unmatched', score: bestScore };
}

module.exports = {
  normalizeSettlementKey,
  settlementNameVariants,
  parseContractMeta,
  isGenericContract,
  resolvePdoContracts,
  buildSettlementIndex,
  findMatchingSettlement,
  buildInfraProjectIndex,
  buildProjectsBySettlement,
  buildProjectIndexes,
  countyIdForName,
  subcountyIdForName,
  pickBestProjectForSettlement,
  findMatchingProject,
};
