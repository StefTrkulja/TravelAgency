const {
  sequelize,
  Review,
  Reservation,
  Arrangement,
  User,
  Sequelize,
} = require('../models');

const { Op } = Sequelize;


function ensureSignedIn(user) {
  if (!user) throw new Error('Forbidden');
}
function canModerate(user) {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}
function isOwner(user, review) {
  return user?.username && review?.userUsername === user.username;
}

function parseLimitOffset(q = {}) {
  const limit = Math.min(Math.max(parseInt(q.limit ?? 20, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(q.offset ?? 0, 10) || 0, 0);
  return { limit, offset };
}

const SORT_WHITELIST = new Set(['createdAt', 'rating']);
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
  if (inc.includes('arrangement')) {
    include.push({ model: Arrangement, as: 'arrangement' });
  }
  return include;
}



async function createReview(auth, body) {
  ensureSignedIn(auth);

  const arrangementId = +body?.arrangementId;
  const rating = parseInt(body?.rating, 10);
  const comment = (body?.comment ?? '').toString().trim();

  if (!arrangementId) throw new Error('arrangementId is required');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('rating must be 1..5');

  const a = await Arrangement.findByPk(arrangementId);
  if (!a) throw new Error('Arrangement not found');

  const hasReservation = await Reservation.count({
    where: {
      arrangementId,
      customerUsername: auth.username,
    }
  });
  if (!hasReservation) throw new Error('User has no reservation for this arrangement');

  const exists = await Review.findOne({
    where: { arrangementId, userUsername: auth.username }
  });
  if (exists) throw new Error('You already reviewed this arrangement');

  const r = await Review.create({
    userUsername: auth.username,
    arrangementId,
    rating,
    comment: comment || null
  });

  return r;
}


async function listReviews(auth, query = {}) {
  ensureSignedIn(auth);

  const where = {};
  if (query.arrangementId) where.arrangementId = +query.arrangementId;

  if (query.userUsername) {
    if (!canModerate(auth)) throw new Error('Forbidden');
    where.userUsername = String(query.userUsername).trim();
  }

  const minR = query.minRating != null ? parseInt(query.minRating, 10) : null;
  const maxR = query.maxRating != null ? parseInt(query.maxRating, 10) : null;
  if ((minR && (minR < 1 || minR > 5)) || (maxR && (maxR < 1 || maxR > 5))) {
    throw new Error('minRating/maxRating must be between 1 and 5');
  }
  if (minR != null || maxR != null) {
    where.rating = {};
    if (minR != null) where.rating[Op.gte] = minR;
    if (maxR != null) where.rating[Op.lte] = maxR;
  }

  if (query.search) {
    const s = String(query.search).trim();
    if (s) where.comment = { [Op.iLike]: `%${s}%` };
  }

  const { limit, offset } = parseLimitOffset(query);
  const [sortBy, sortDir] = parseSort(query);
  const include = buildInclude(query.include);

  return await Review.findAll({
    where,
    include,
    order: [[sortBy, sortDir]],
    limit,
    offset,
  });
}


async function listMyReviews(auth, query = {}) {
  ensureSignedIn(auth);
  const q = { ...query, userUsername: auth.username };
  return listReviews({ ...auth, role: 'ADMIN' }, q);
}


async function getReview(auth, id, options = {}) {
  ensureSignedIn(auth);
  const include = buildInclude(options.include);
  const r = await Review.findByPk(id, { include });
  if (!r) return null;

 
  return r;
}


async function updateReview(auth, id, payload) {
  ensureSignedIn(auth);

  return await sequelize.transaction(async (tx) => {
    const r = await Review.findByPk(id, { transaction: tx });
    if (!r) throw new Error('Not found');

    const owner = isOwner(auth, r);
    const moderator = canModerate(auth);
    if (!owner && !moderator) throw new Error('Forbidden');

    if (payload.rating !== undefined) {
      const rating = parseInt(payload.rating, 10);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('rating must be 1..5');
      }
      r.rating = rating;
    }

    if (payload.comment !== undefined) {
      const comment = (payload.comment ?? '').toString().trim();
      r.comment = comment || null;
    }

    await r.save({ transaction: tx });
    return r;
  });
}


async function deleteReview(auth, id) {
  ensureSignedIn(auth);

  return await sequelize.transaction(async (tx) => {
    const r = await Review.findByPk(id, { transaction: tx });
    if (!r) throw new Error('Not found');

    if (!isOwner(auth, r) && !canModerate(auth)) throw new Error('Forbidden');

    await r.destroy({ transaction: tx });
    return { ok: true };
  });
}



module.exports = {
  createReview,
  listReviews,
  getReview,
  updateReview,
  deleteReview,
  listMyReviews,
};
