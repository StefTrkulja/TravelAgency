const {
  sequelize,
  Voucher,
  Reservation,
  User,
  Sequelize,
} = require('../models');

const { Op } = Sequelize;


const RESERVATION_SAFE_ATTRS = [
  'id',
  'code',                // ako je u modelu; ako nije, slobodno izbaci ovu liniju
  'arrangementId',
  'customerUsername',
  'numberOfPeople',
  'numberOfKids',
  'totalPrice',
  'status',
  'specialRequests',
  'startsAt',
  'endsAt',
  'createdAt',
  'updatedAt',
];

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
    include.push({
      model: Reservation,
      as: 'reservation',
      attributes: RESERVATION_SAFE_ATTRS,   // ⬅️ ključno
    });
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












// pomoćni obračun
function applyVoucherDiscount(baseTotal, voucher) {
  if (baseTotal == null) return null;
  const total = Number(baseTotal);
  const value = Number(voucher.discountValue || 0);

  let discounted = total;
  if (voucher.discountType === 'PERCENT') {
    discounted = total - (total * (value / 100));
  } else {
    discounted = total - value; // AMOUNT
  }
  return Math.max(0, Number(discounted.toFixed(2)));
}

function todayISO() {
  return new Date().toISOString().slice(0,10); // YYYY-MM-DD
}

/**
 * Atomically apply voucher code to a reservation.
 * Rules:
 * - Voucher must exist, not used, within date window (if set)
 * - If voucher.userUsername je postavljen, korisnik mora biti isti (owner)
 * - Rezervacija ne smije već imati drugi isUsed voucher (1-za-1)
 * - Ako je voucher već vezan za ISTU rezervaciju, operacija je idempotentna
 */
async function applyVoucherToReservation(auth, reservationId, code) {
  if (!auth) throw new Error('Forbidden');

  return await sequelize.transaction(async (tx) => {
    const reservation = await Reservation.findByPk(reservationId, { transaction: tx });
    if (!reservation) throw new Error('Reservation not found');

    // Provjeri da li već postoji “iskorišten” voucher na ovoj rezervaciji
    const existing = await Voucher.findOne({
      where: { reservationId: reservation.id, isUsed: true },
      transaction: tx
    });
    if (existing) {
      // idempotentno: ako je isti kod, samo vrati izračun
      if (existing.code === String(code).trim().toUpperCase()) {
        const baseTotal = reservation.totalPrice ?? reservation.totalAmount ?? reservation.price ?? null;
        return {
          reservation,
          voucher: existing,
          baseTotal,
          discountedTotal: applyVoucherDiscount(baseTotal, existing),
          applied: false, // ništa novo nije promijenjeno
        };
      }
      throw new Error('Reservation already has a used voucher');
    }

    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) throw new Error('Voucher code required');

    // Zaključaj taj voucher u transakciji (FOR UPDATE) da spriječiš trku
    const voucher = await Voucher.findOne({
      where: { code: normalized },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!voucher) throw new Error('Voucher not found');

    // Ako je već iskorišten:
    if (voucher.isUsed) {
      // idempotentno: ako je već vezan za ovu rezervaciju, vrati OK
      if (voucher.reservationId === reservation.id) {
        const baseTotal = reservation.totalPrice ?? reservation.totalAmount ?? reservation.price ?? null;
        return {
          reservation,
          voucher,
          baseTotal,
          discountedTotal: applyVoucherDiscount(baseTotal, voucher),
          applied: false,
        };
      }
      throw new Error('Voucher already used');
    }

    // Ako je voucher vezan za konkretnog korisnika – mora se poklapati
    if (voucher.userUsername && voucher.userUsername !== auth.username) {
      throw new Error('Voucher belongs to a different user');
    }

    // Validnost datuma (ako su postavljeni)
    const today = todayISO();
    if (voucher.validFrom && voucher.validFrom > today) {
      throw new Error('Voucher is not valid yet');
    }
    if (voucher.validTo && voucher.validTo < today) {
      throw new Error('Voucher is expired');
    }

    // Primjeni
    voucher.reservationId = reservation.id;
    voucher.isUsed = true;
    await voucher.save({ transaction: tx });

    // Izračun i povrat
    const baseTotal = reservation.totalPrice ?? reservation.totalAmount ?? reservation.price ?? null;
    return {
      reservation,
      voucher,
      baseTotal,
      discountedTotal: applyVoucherDiscount(baseTotal, voucher),
      applied: true,
    };
  });
}

/**
 * Ukloni voucher s rezervacije (rollback use-case).
 * Dozvoli ADMIN/MANAGER/OPERATOR; ili vlasnika ako želiš (po želji).
 */
async function removeVoucherFromReservation(auth, reservationId) {
  if (!auth) throw new Error('Forbidden');

  return await sequelize.transaction(async (tx) => {
    const reservation = await Reservation.findByPk(reservationId, { transaction: tx });
    if (!reservation) throw new Error('Reservation not found');

    const voucher = await Voucher.findOne({
      where: { reservationId: reservation.id, isUsed: true },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!voucher) return { ok: true, changed: false }; // ništa za ukloniti

    // Pravila dozvola — minimalno:
    if (!['ADMIN','MANAGER','OPERATOR'].includes(auth.role)) {
      // ako želiš vlasniku dozvoliti: provjeri userUsername === auth.username
      if (!(voucher.userUsername && voucher.userUsername === auth.username)) {
        throw new Error('Forbidden');
      }
    }

    voucher.isUsed = false;
    voucher.reservationId = null;
    await voucher.save({ transaction: tx });

    const baseTotal = reservation.totalPrice ?? reservation.totalAmount ?? reservation.price ?? null;

    return {
      ok: true,
      changed: true,
      reservation,
      voucher,
      baseTotal,
      discountedTotal: baseTotal, // vraća se na punu cijenu
    };
  });
}



















module.exports = {
  createVoucher,
  listVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher,
  applyVoucherToReservation,
  removeVoucherFromReservation,
};
