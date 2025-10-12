// backend/services/reservationService.js
'use strict';

const {
  sequelize,
  Sequelize,
  Reservation,
  TravelArrangement,
  Destination,
  Country,
  User,
  Departure,
  Voucher,
} = require('../models');

const statsSvc = require('../services/arrangementStats.service');
// (opcionalno) ako želiš odmah primijeniti vaučer po kreiranju:
const voucherSvc = require('../services/vouchers.service');

const { Op } = Sequelize;

/* ----------------------------- Helpers ----------------------------- */

function asInt(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function asNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function money2(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : 0;
}

// Lokalni helper (isti rezultat kao u vouchers.service — zadržavam ovdje radi preglednosti)
function applyVoucherDiscount(baseTotal, voucher) {
  if (baseTotal == null) return null;
  const total = Number(baseTotal);
  if (!voucher) return total;

  const value = Number(voucher.discountValue || 0);
  let discounted = total;

  if (voucher.discountType === 'PERCENT') {
    discounted = total - (total * (value / 100));
  } else {
    discounted = total - value; // AMOUNT
  }
  return Math.max(0, Number(discounted.toFixed(2)));
}

/* --------------------------- Cijena/obračun --------------------------- */
/**
 * Računa total:
 * - basePricePerPerson * (odrasli + djeca)
 * - ako postoji kidsDiscount (npr 10 -> 10%), djeca imaju popust
 *   total = base * adults + base * kids * (1 - kidsDiscount/100)
 * - *opciono* možeš dodati aktivnosti (extra cost) — ostavljeno “hook”
 */
async function calculatePrice(arrangement, reservationData, withActivities = false) {
  const base = asNum(arrangement.basePricePerPerson, 0);

  const adults = Math.max(0, asInt(reservationData.numberOfPeople, 0));
  const kids   = Math.max(0, asInt(reservationData.numberOfKids, 0));

  const kdRaw = arrangement.kidsDiscount == null ? 0 : Number(arrangement.kidsDiscount);
  const kidsDiscountPct = Number.isFinite(kdRaw) ? kdRaw : 0; // npr. 10 -> 10%

  let total = 0;

  if (!kidsDiscountPct) {
    total = base * (adults + kids);
  } else {
    const kidsFactor = Math.max(0, 1 - (kidsDiscountPct / 100));
    total = (base * adults) + (base * kids * kidsFactor);
  }

  // Ako imaš dodatne aktivnosti s extraCost, ovdje dodaš (ostavljeno za buduće)
  if (withActivities) {
    // ... učitaj i saberi extra cost, ako je to već implementirano
    // total += extraCost;
  }

  return money2(total);
}

/* ------------------------------ Kapacitet ------------------------------ */
/**
 * Provjerava ima li dovoljno mjesta na polasku (capacityTotal - već rezervisano).
 * Računa odrasle + djecu.
 */
async function ensureDepartureCapacity(departureId, seatsRequested, excludeReservationId = null) {
  const dep = await Departure.findByPk(departureId);
  if (!dep) throw new Error('Departure not found');

  const where = {
    departureId: dep.id,
    status: { [Op.ne]: 'CANCELLED' }
  };
  if (excludeReservationId) where.id = { [Op.ne]: excludeReservationId };

  const existing = await Reservation.findAll({
    where,
    attributes: ['numberOfPeople', 'numberOfKids']
  });

  const taken = existing.reduce((s, r) =>
    s + asInt(r.numberOfPeople, 0) + asInt(r.numberOfKids, 0), 0);

  const free = asInt(dep.capacityTotal, 0) - taken;
  if (seatsRequested > free) {
    throw new Error(`Not enough seats on this departure. Free: ${free}`);
  }

  return dep;
}

/* ------------------------------ Service ------------------------------ */

class ReservationService {

  generateReservationCode() {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 7);
    return `REZ-${ts}-${rnd}`.toUpperCase();
  }

  /* -------- LIST -------- */
  async getAllReservations(filters = {}) {
    try {
      const where = {};
      if (filters.customerUsername) where.customerUsername = String(filters.customerUsername);
      if (filters.status)           where.status = String(filters.status);
      if (filters.arrangementId)    where.arrangementId = asInt(filters.arrangementId);
      if (filters.departureId)      where.departureId = asInt(filters.departureId);

      const rows = await Reservation.findAll({
        where,
        include: [
          {
            association: 'arrangement',
            attributes: ['id', 'title', 'basePricePerPerson', 'dateFrom', 'dateTo'],
            include: [{
              association: 'destination',
              attributes: ['id', 'name'],
              include: [{ association: 'country', attributes: ['id', 'name'] }]
            }]
          },
          { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
          { association: 'customer', attributes: ['username', 'name', 'surname', 'email'] },
        ],
        order: [['createdAt', 'DESC']]
      });

      return { success: true, data: rows };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- GET BY ID -------- */
  async getReservationById(id) {
    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          association: 'arrangement',
          attributes: ['id', 'title', 'destinationId', 'basePricePerPerson', 'dateFrom', 'dateTo'],
          include: [{
            association: 'destination',
            attributes: ['id', 'name'],
            include: [{ association: 'country', attributes: ['id', 'name'] }]
          }]
        },
        { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
        { association: 'customer', attributes: ['username', 'email', 'name', 'surname'] },
      ]
    });

    if (!reservation) return { success: false, error: 'Reservation not found' };

    // nađi ISKORIŠTEN voucher (ako postoji)
    const voucher = await Voucher.findOne({
      where: { reservationId: reservation.id, isUsed: true }
    });

    const baseTotal =
      reservation.totalPrice ??
      reservation.totalAmount ??
      reservation.price ??
      null;

    const discountedTotal = applyVoucherDiscount(baseTotal, voucher);

    return {
      success: true,
      data: {
        ...reservation.toJSON(),
        voucher: voucher ? voucher.toJSON() : null,
        baseTotal,
        discountedTotal
      }
    };
  }

  /* -------- GET BY CODE -------- */
  async getReservationByCode(code) {
    try {
      const reservation = await Reservation.findOne({
        where: { code: String(code).trim().toUpperCase() },
        include: [
          {
            association: 'arrangement',
            include: [{
              association: 'destination',
              include: [{ association: 'country', attributes: ['id', 'name'] }]
            }]
          },
          { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
          { association: 'customer', attributes: ['username', 'name', 'surname', 'email', 'address'] }
        ]
      });

      if (!reservation) return { success: false, error: 'Reservation not found' };
      return { success: true, data: reservation };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- CREATE -------- */
  async createReservation(input) {
  try {
    // Obavezno
    const arrangementId   = asInt(input.arrangementId);
    const customerUsername = String(input.customerUsername || '').trim();
    const numberOfPeople   = Math.max(1, asInt(input.numberOfPeople, 1));
    const numberOfKids     = Math.max(0, asInt(input.numberOfKids, 0));
    const specialRequests  = input.specialRequests ?? null;
    const departureId      = input.departureId != null ? asInt(input.departureId) : null;
    const voucherCode      = input.voucherCode ? String(input.voucherCode).trim() : null;

    if (!arrangementId || !customerUsername) {
      return { success: false, error: 'Arrangement ID and customer username are required' };
    }

    // Aranžman
    const arrangement = await TravelArrangement.findByPk(arrangementId);
    if (!arrangement) return { success: false, error: 'Arrangement not found' };

    // Datumi (default iz aranžmana)
    let startsAt = arrangement.dateFrom ? new Date(arrangement.dateFrom) : null;
    let endsAt   = arrangement.dateTo   ? new Date(arrangement.dateTo)   : null;

    // Koliko sjedista traži ova rezervacija (odrasli + djeca)
    const seatsRequested = numberOfPeople + numberOfKids;

    // Ako je izabran departure — provjere + datumi iz polaska + kapacitet
    let dep = null;
    if (departureId) {
      dep = await Departure.findByPk(departureId);
      if (!dep) return { success: false, error: 'Departure not found' };
      if (dep.arrangementId !== arrangement.id) {
        return { success: false, error: 'Departure does not belong to this arrangement' };
      }

      // Provjera kapaciteta polaska (ako već imaš implementirano)
      await ensureDepartureCapacity(dep.id, seatsRequested);

      // datumi iz polaska
      startsAt = dep.startDate ? new Date(dep.startDate) : startsAt;
      endsAt   = dep.endDate   ? new Date(dep.endDate)   : endsAt;
    }

    // --------- ARANŽMAN-LEVEL KAPACITET (arrangement.occupancy) ----------
    // Ako je postavljen ukupni kapacitet aranžmana, ne dozvoli prekoračenje
    const occ = Number(arrangement.occupancy);
    if (Number.isFinite(occ) && occ > 0) {
      // Saberemo već zauzete (odrasli + djeca), ignorišući CANCELLED
      const whereBase = {
        arrangementId,
        status: { [Op.ne]: 'CANCELLED' }
      };
      // (Ako želiš da occupancy važi po polasku, ubaci i departureId u whereBase)
      // if (departureId) whereBase.departureId = departureId;

      const [sumAdults, sumKids] = await Promise.all([
        Reservation.sum('numberOfPeople', { where: whereBase }),
        Reservation.sum('numberOfKids',   { where: whereBase })
      ]);
      const reservedSeats = (sumAdults || 0) + (sumKids || 0);

      if (reservedSeats + seatsRequested > occ) {
        const left = Math.max(0, occ - reservedSeats);
        return { success: false, error: `No availability. Remaining seats: ${left}.` };
      }
    }
    // ---------------------------------------------------------------------

    // Total prije vaučera
    const baseTotal = await calculatePrice(arrangement, { numberOfPeople, numberOfKids });

    const code = this.generateReservationCode();

    const toCreate = {
      arrangementId,
      departureId: dep ? dep.id : null,
      customerUsername,
      numberOfPeople,
      numberOfKids,
      specialRequests,
      code,
      totalPrice: money2(baseTotal), // “bazni” total — voucher ćemo prikazati posebno
      startsAt,
      endsAt,
      status: 'PENDING',
    };

    const reservation = await Reservation.create(toCreate);

    // statistika (best effort)
    try { await statsSvc.computeForArrangement(arrangementId); } catch (e) { console.error('stats(create) fail:', e); }

    // Ako je poslan voucherCode — pokušaj primijeniti (tačno poklapanje, BE servis radi validaciju)
    let voucherApplied = null;
    if (voucherCode) {
      try {
        const authShim = { username: customerUsername, role: 'TRAVELER' }; // minimalni “auth”
        voucherApplied = await voucherSvc.applyVoucherToReservation(authShim, reservation.id, voucherCode);
      } catch (e) {
        // Ne ruši kreiranje — samo vrati poruku
        voucherApplied = { error: e.message };
      }
    }

    // Vrati kreiranu rezervaciju s include-ima
    const created = await Reservation.findByPk(reservation.id, {
      include: [
        {
          association: 'arrangement',
          include: [{
            association: 'destination',
            include: [{ association: 'country', attributes: ['id', 'name'] }]
          }]
        },
        { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
        { association: 'customer', attributes: ['username', 'name', 'surname', 'email'] },
      ]
    });

    return {
      success: true,
      data: created,
      voucher: voucherApplied && voucherApplied.voucher ? voucherApplied.voucher : null,
      discountedTotal: voucherApplied && voucherApplied.discountedTotal != null
        ? voucherApplied.discountedTotal
        : money2(baseTotal),
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}


  /* -------- UPDATE -------- */
  async updateReservation(id, input) {
    try {
      const current = await Reservation.findByPk(id, {
        include: [{ association: 'arrangement' }]
      });
      if (!current) return { success: false, error: 'Reservation not found' };

      const update = {};

      // Mijenja se broj ljudi/djece?
      const npSet = input.numberOfPeople != null;
      const nkSet = input.numberOfKids  != null;

      if (npSet) {
        const np = Math.max(1, asInt(input.numberOfPeople, current.numberOfPeople));
        update.numberOfPeople = np;
      }
      if (nkSet) {
        const nk = Math.max(0, asInt(input.numberOfKids, current.numberOfKids));
        update.numberOfKids = nk;
      }

      // Mijenja se polazak?
      if (input.departureId !== undefined) {
        const nextDepId = input.departureId === null ? null : asInt(input.departureId);
        if (nextDepId) {
          const dep = await Departure.findByPk(nextDepId);
          if (!dep) return { success: false, error: 'Departure not found' };
          if (dep.arrangementId !== current.arrangementId) {
            return { success: false, error: 'Departure does not belong to this arrangement' };
          }

          // provjera kapaciteta (uz nove ili postojeće brojeve)
          const np = update.numberOfPeople != null ? update.numberOfPeople : current.numberOfPeople;
          const nk = update.numberOfKids  != null ? update.numberOfKids  : current.numberOfKids;
          await ensureDepartureCapacity(dep.id, np + nk, current.id);

          update.departureId = dep.id;
          update.startsAt = dep.startDate ? new Date(dep.startDate) : current.startsAt;
          update.endsAt   = dep.endDate   ? new Date(dep.endDate)   : current.endsAt;
        } else {
          // Odspajanje od polaska → datume vraćamo na aranžman
          const arr = current.arrangement || (await TravelArrangement.findByPk(current.arrangementId));
          update.departureId = null;
          update.startsAt = arr?.dateFrom ? new Date(arr.dateFrom) : current.startsAt;
          update.endsAt   = arr?.dateTo   ? new Date(arr.dateTo)   : current.endsAt;
        }
      } else if (npSet || nkSet) {
        // Ako se mijenja broj mjesta, a postoji departure — provjeri kapacitet na postojećem polasku
        if (current.departureId) {
          const np = update.numberOfPeople != null ? update.numberOfPeople : current.numberOfPeople;
          const nk = update.numberOfKids  != null ? update.numberOfKids  : current.numberOfKids;
          await ensureDepartureCapacity(current.departureId, np + nk, current.id);
        }
      }

      // Special requests
      if (input.specialRequests !== undefined) update.specialRequests = input.specialRequests;

      // Status (validacija enum-a)
      if (input.status) {
        const valid = ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'];
        if (!valid.includes(String(input.status))) {
          return { success: false, error: `Invalid status. Must be one of: ${valid.join(', ')}` };
        }
        update.status = String(input.status);
      }

      // Re-obračun totalPrice (bez voucher-a) ako se promijenio broj ljudi/djece
      if (npSet || nkSet) {
        const arr = current.arrangement || (await TravelArrangement.findByPk(current.arrangementId));
        const np = update.numberOfPeople != null ? update.numberOfPeople : current.numberOfPeople;
        const nk = update.numberOfKids  != null ? update.numberOfKids  : current.numberOfKids;
        update.totalPrice = await calculatePrice(arr, { numberOfPeople: np, numberOfKids: nk });
      }

      if (Object.keys(update).length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      await Reservation.update(update, { where: { id } });

      try { await statsSvc.computeForArrangement(current.arrangementId); } catch (e) { console.error('stats(update) fail:', e); }

      const updated = await Reservation.findByPk(id, {
        include: [
          {
            association: 'arrangement',
            include: [{
              association: 'destination',
              include: [{ association: 'country', attributes: ['id', 'name'] }]
            }]
          },
          { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
          { association: 'customer', attributes: ['username', 'name', 'surname', 'email'] }
        ]
      });

      return { success: true, data: updated };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- DELETE -------- */
  async deleteReservation(id) {
    try {
      const existing = await Reservation.findByPk(id);
      if (!existing) return { success: false, error: 'Reservation not found' };

      const count = await Reservation.destroy({ where: { id } });
      if (!count) return { success: false, error: 'Reservation not found' };

      try { await statsSvc.computeForArrangement(existing.arrangementId); } catch (e) { console.error('stats(delete) fail:', e); }

      return { success: true, message: 'Reservation deleted successfully' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- CANCEL -------- */
  async cancelReservation(id) {
    try {
      const existing = await Reservation.findByPk(id);
      if (!existing) return { success: false, error: 'Reservation not found' };

      const [n] = await Reservation.update({ status: 'CANCELLED' }, { where: { id } });
      if (!n) return { success: false, error: 'Reservation not found' };

      try { await statsSvc.computeForArrangement(existing.arrangementId); } catch (e) { console.error('stats(cancel) fail:', e); }

      return this.getReservationById(id);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- CONFIRM -------- */
  async confirmReservation(id) {
    try {
      const existing = await Reservation.findByPk(id);
      if (!existing) return { success: false, error: 'Reservation not found' };

      const [n] = await Reservation.update({ status: 'CONFIRMED' }, { where: { id } });
      if (!n) return { success: false, error: 'Reservation not found' };

      try { await statsSvc.computeForArrangement(existing.arrangementId); } catch (e) { console.error('stats(confirm) fail:', e); }

      return this.getReservationById(id);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* -------- USER’S LIST -------- */
  async getUserReservations(username) {
    try {
      const rows = await Reservation.findAll({
        where: { customerUsername: String(username) },
        include: [
          {
            association: 'arrangement',
            attributes: ['id', 'title', 'basePricePerPerson', 'dateFrom', 'dateTo'],
            include: [{
              association: 'destination',
              attributes: ['id', 'name'],
              include: [{ association: 'country', attributes: ['id', 'name'] }]
            }]
          },
          { association: 'departure', attributes: ['id', 'startDate', 'endDate', 'capacityTotal', 'status'] },
        ],
        order: [['createdAt', 'DESC']]
      });
      return { success: true, data: rows };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = new ReservationService();
