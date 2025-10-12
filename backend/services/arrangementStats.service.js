// services/arrangementStats.service.js
'use strict';

const { Reservation, TravelArrangement, Destination, Country, ArrangementStats } = require('../models');
const { fn, col, Op } = require('sequelize');

// Sve kolone koje sigurno postoje u tabeli "reservations"
const RES_ATTRS = [
  'id', 'code', 'arrangementId', 'customerUsername',
  'numberOfPeople', 'numberOfKids', 'totalPrice', 'status',
  'specialRequests', 'startsAt', 'endsAt', 'createdAt', 'updatedAt'
];

// Helper za konverziju (COALESCE u JS)
const N = v => Number(v || 0);

async function updateArrangementStats(arrangementId) {
  // SUM/AVG samo nad postojećim kolonama
  const summaryRow = await Reservation.findOne({
    where: { arrangementId, status: { [Op.ne]: 'CANCELLED' } },
    attributes: [
      [fn('COUNT', col('id')), 'totalReservations'],
      [fn('SUM',   col('numberOfPeople')), 'totalPeople'],
      [fn('SUM',   col('totalPrice')),     'totalRevenue'],
      [fn('AVG',   col('totalPrice')),     'avgPricePerReservation'],
    ],
    raw: true
  }) || {};

  const kidsRow = await Reservation.findOne({
    where: { arrangementId },
    attributes: [
      [fn('SUM', col('numberOfKids')),   'kids'],
      [fn('SUM', col('numberOfPeople')), 'people'],
    ],
    raw: true
  }) || {};

  const totalReservations       = N(summaryRow.totalReservations);
  const totalPeople             = N(summaryRow.totalPeople);
  const totalRevenue            = N(summaryRow.totalRevenue);
  const avgPricePerReservation  = N(summaryRow.avgPricePerReservation);
  const kidsShare               = (N(kidsRow.kids) && N(kidsRow.people))
    ? (N(kidsRow.kids) / N(kidsRow.people)) * 100
    : 0;

  const arrangement = await TravelArrangement.findByPk(arrangementId);

  // Ako nema specificiranog kapaciteta, tretiraj kao 1 da izbjegnemo dijeljenje nulom
  const capacity = arrangement && arrangement.occupancy != null
    ? Number(arrangement.occupancy)
    : 1;

  const occupancyRate = capacity > 0
    ? Math.min((totalPeople / capacity) * 100, 100)
    : 0;

  await ArrangementStats.upsert({
    arrangementId,
    totalReservations,
    totalPeople,
    totalRevenue,
    // realnija metrika: prosjek po osobi umjesto (avg rezervacije / totalPeople)
    avgPricePerPerson: totalPeople ? (totalRevenue / totalPeople) : 0,
    occupancyRate,
    kidsShare,
    updatedAt: new Date()
  });

  return true;
}

async function getAllStatistics({ from, to } = {}) {
  const whereClause = {};
  if (from || to) {
    whereClause.createdAt = {};
    if (from) whereClause.createdAt[Op.gte] = new Date(from);
    if (to)   whereClause.createdAt[Op.lte] = new Date(to);
  }

  const results = await Reservation.findAll({
    where: whereClause,
    attributes: RES_ATTRS,               // ⇐ eksplicitno, da ne traži departureId
    include: [{
      association: 'arrangement',
      attributes: ['id', 'title', 'basePricePerPerson', 'type'],
      include: [{
        association: 'destination',
        attributes: ['id', 'name'],
        include: [{ association: 'country', attributes: ['id', 'name'] }]
      }]
    }]
  });

  // Grupisanje po aranžmanu
  const map = new Map();
  for (const r of results) {
    const a = r.arrangement;
    if (!a) continue;

    if (!map.has(a.id)) {
      map.set(a.id, {
        arrangementId: a.id,
        title: a.title,
        destination: a.destination?.name || 'N/A',
        country: a.destination?.country?.name || 'N/A',
        type: a.type,
        totalReservations: 0,
        totalPeople: 0,
        totalRevenue: 0,
      });
    }

    const entry = map.get(a.id);
    entry.totalReservations += 1;
    entry.totalPeople  += N(r.numberOfPeople);
    entry.totalRevenue += N(r.totalPrice);
  }

  return Array.from(map.values());
}

async function getStatisticsForArrangement(arrangementId) {
  const reservations = await Reservation.findAll({
    where: { arrangementId },
    attributes: RES_ATTRS,               // ⇐ isto ovdje
    include: [{ association: 'arrangement', attributes: ['id', 'title'] }]
  });

  if (!reservations.length) return null;

  const totalRevenue = reservations.reduce((sum, r) => sum + N(r.totalPrice), 0);
  const totalPeople  = reservations.reduce((sum, r) => sum + N(r.numberOfPeople), 0);

  return {
    arrangementId,
    title: reservations[0].arrangement.title,
    totalReservations: reservations.length,
    totalPeople,
    totalRevenue,
    avgRevenuePerPerson: totalPeople ? (totalRevenue / totalPeople).toFixed(2) : 0,
    avgReservationValue: (totalRevenue / reservations.length).toFixed(2)
  };
}

module.exports = {
  updateArrangementStats,
  getAllStatistics,
  getStatisticsForArrangement
};
