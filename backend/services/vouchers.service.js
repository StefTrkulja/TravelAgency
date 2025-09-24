const {
  sequelize,
  Voucher,
  Reservation,
  User,
  Sequelize,
} = require('../models');

const { Op } = Sequelize;

function ensureSignedIn(user) {
  if (!user) throw new Error('Forbidden');
}

function canManage(user) {
  return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(user?.role);
}

function canSeeAll(user) {
  return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(user?.role);
}

function isOwner(user, voucher) {
  return voucher?.userUsername && user?.username === voucher.userUsername;
}

function normalizeCode(code) {
  if (code == null) return '';
  return String(code).trim().toUpperCase();
}

function assertDiscount(dto) {
  const type = dto.discountType || 'PERCENT';
  const value = Number(dto.discountValue);
  if (!['PERCENT', 'AMOUNT'].includes(type)) throw new Error('Invalid discountType');
  if (!Number.isFinite(value) || value <= 0) throw new Error('discountValue must be > 0');
  if (type === 'PERCENT' && value > 100) throw new Error('PERCENT discount cannot exceed 100');
}


function parseBool(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

function parseLimitOffset(q = {}) {
  const limit = Math.min(Math.max(parseInt(q.limit ?? 20, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(q.offset ?? 0, 10) || 0, 0);
  return { limit, offset };
}

const SORT_WHITELIST = new Set(['createdAt', 'code', 'validFrom', 'validTo', 'isUsed']);
function parseSort(q = {}) {
  const sortBy = SORT_WHITELIST.has(q.sortBy) ? q.sortBy : 'createdAt';
  const sortDir = (q.sortDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return [sortBy, sortDir];
}

function buildInclude(includeParam) {
  if (!includeParam) return [];
  const inc = String(includeParam).split(',').map(s => s.trim().toLowerCase());
  const include = [];
  if (inc.includes('user')) {
    include.push({ model: User, as: 'user', attributes: ['username','name','surname','email'] });
  }
  if (inc.includes('reservation')) {
    include.push({ model: Reservation, as: 'reservation' });
  }
  return include;
}

async function ensureCodeUnique(code, tx, excludeId) {
  const where = { code };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const exists = await Voucher.findOne({ where, transaction: tx });
  if (exists) throw new Error('Voucher code already exists');
}


async function createVoucher(auth, body) {
  ensureSignedIn(auth);
  if (!canManage(auth)) throw new Error('Forbidden');

  const code = normalizeCode(body?.code);
  if (!code) throw new Error('code is required');
  assertDiscount(body);

  const validFrom = body?.validFrom || null;
  const validTo = body?.validTo || null;
  if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
    throw new Error('validFrom must be before validTo');
  }

  // Optional bindings:
  let userUsername = body?.userUsername ? String(body.userUsername).trim() : null;
  if (userUsername) {
    const u = await User.findByPk(userUsername);
    if (!u) throw new Error('Target user not found');
  }

  let reservationId = body?.reservationId ?? null;
  if (reservationId != null) {
    const r = await Reservation.findByPk(reservationId);
    if (!r) throw new Error('Reservation not found');
  }

  return await sequelize.transaction(async (tx) => {
    await ensureCodeUnique(code, tx);

    const v = await Voucher.create({
      code,
      discountType: body.discountType || 'PERCENT',
      discountValue: body.discountValue,
      validFrom,
      validTo,
      isUsed: false,
      userUsername,
      reservationId,
    }, { transaction: tx });

    return v;
  });
}




async function listVouchers(auth, query = {}) {
  ensureSignedIn(auth);

  const where = {};

  if (!canSeeAll(auth)) {
    where.userUsername = auth.username;
  } else if (query.userUsername) {
    where.userUsername = String(query.userUsername).trim();
  }

  if (query.reservationId) where.reservationId = +query.reservationId;

  const b = parseBool(query.isUsed);
  if (b !== undefined) where.isUsed = b;

  if (query.search) {
    const s = String(query.search).trim().toUpperCase();
    where.code = { [Op.iLike]: `%${s}%` };
  }

  if (query.validOn) {
    const d = new Date(query.validOn);
    if (!Number.isNaN(d.getTime())) {
      where[Op.and] = [
        { [Op.or]: [{ validFrom: null }, { validFrom: { [Op.lte]: d } }] },
        { [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: d } }] },
      ];
    }
  }

  const { limit, offset } = parseLimitOffset(query);
  const [sortBy, sortDir] = parseSort(query);
  const include = buildInclude(query.include);

  return await Voucher.findAll({
    where,
    include,
    order: [[sortBy, sortDir]],
    limit,
    offset,
  });
}




async function getVoucher(auth, id, options = {}) {
  ensureSignedIn(auth);
  const include = buildInclude(options.include);
  const v = await Voucher.findByPk(id, { include });
  if (!v) return null;

  if (!canSeeAll(auth) && !isOwner(auth, v)) throw new Error('Forbidden');
  return v;
}


async function updateVoucher(auth, id, payload) {
  ensureSignedIn(auth);
  if (!canManage(auth)) throw new Error('Forbidden');

  return await sequelize.transaction(async (tx) => {
    const v = await Voucher.findByPk(id, { transaction: tx });
    if (!v) throw new Error('Not found');

    if (payload.code !== undefined) {
      const nextCode = normalizeCode(payload.code);
      if (!nextCode) throw new Error('code is required');
      await ensureCodeUnique(nextCode, tx, v.id);
      v.code = nextCode;
    }

    if (payload.discountType !== undefined || payload.discountValue !== undefined) {
      const next = {
        discountType: payload.discountType ?? v.discountType,
        discountValue: payload.discountValue ?? v.discountValue,
      };
      assertDiscount(next);
      v.discountType = next.discountType;
      v.discountValue = next.discountValue;
    }

    if (payload.validFrom !== undefined) v.validFrom = payload.validFrom || null;
    if (payload.validTo !== undefined) v.validTo = payload.validTo || null;
    if (v.validFrom && v.validTo && new Date(v.validFrom) > new Date(v.validTo)) {
      throw new Error('validFrom must be before validTo');
    }

    if (payload.userUsername !== undefined) {
      v.userUsername = payload.userUsername ? String(payload.userUsername).trim() : null;
      if (v.userUsername) {
        const u = await User.findByPk(v.userUsername, { transaction: tx });
        if (!u) throw new Error('Target user not found');
      }
    }
    if (payload.reservationId !== undefined) {
      v.reservationId = payload.reservationId ?? null;
      if (v.reservationId != null) {
        const r = await Reservation.findByPk(v.reservationId, { transaction: tx });
        if (!r) throw new Error('Reservation not found');
      }
    }

    if (payload.isUsed !== undefined) {
      v.isUsed = !!payload.isUsed;
    }

    await v.save({ transaction: tx });
    return v;
  });
}


async function deleteVoucher(auth, id) {
  ensureSignedIn(auth);
  if (auth.role !== 'ADMIN') throw new Error('Forbidden');

  return await sequelize.transaction(async (tx) => {
    const v = await Voucher.findByPk(id, { transaction: tx });
    if (!v) throw new Error('Not found');

    await v.destroy({ transaction: tx });
    return { ok: true };
  });
}






module.exports = {
  createVoucher,
  listVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher,
};
