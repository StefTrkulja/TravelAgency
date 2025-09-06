const { Result, StatusEnum } = require('../utils/result');
const {
  SupplierOffer, SupplierOfferOption, SupplierOfferItineraryItem,
  TravelArrangement, Supplier, OfferSelection
} = require('../models');
const sequelize = require('../models').sequelize;

class OfferService {
  // Operator šalje upite grupi dobavljača
  async sendInquiries({ arrangementId, offerType, supplierIds, terms }, operatorUsername) {
    const tx = await sequelize.transaction();
    try {
      const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
      if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);

      a.status = 'PENDING';
      await a.save({ transaction: tx });

      const now = new Date();
      const created = [];
      for (const sid of supplierIds) {
        const supplier = await Supplier.findByPk(sid, { transaction: tx });
        if (!supplier) {
          await tx.rollback();
          return new Result(StatusEnum.FAIL, 404, null, [{ message: `Supplier ${sid} not found` }]);
        }
        created.push(await SupplierOffer.create({
          arrangementId, supplierId: sid, offerType, terms,
          title: null, // popunjava supplier
          priceTotal: 0, capacityTotal: 0,
          requestSentAt: now, status: 'SENT'
        }, { transaction: tx }));
      }
      await tx.commit();
      return new Result(StatusEnum.OK, 201, created);
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }

  // Supplier šalje ponudu (sa opcijama i/ili itinerarom)
  // payload primer:
  // {
  //   arrangementId, offerType, title, terms, currency,
  //   priceTotal, capacityTotal, availabilityStart, availabilityEnd,
  //   // HOTEL:
  //   hotelName, hotelStars, board,
  //   // TRANSPORT:
  //   transportCompany, transportMode, fromLocation, toLocation,
  //   // GUIDE:
  //   guideName, guideLanguage, durationHours,
  //   // options: [{ optionLabel, dateStart, dateEnd, priceTotal, capacity, meta }, ...]
  //   // itineraryItems: [{ dayNo, orderNo, startTime, endTime, title, description, location, extraCost }, ...]
  //   meta
  // }
  async supplierSubmitOffer(supplierAccountUsername, payload) {
    const supplier = await Supplier.findOne({ where: { accountUsername: supplierAccountUsername } });
    if (!supplier) return new Result(StatusEnum.FAIL, 403, null, [{ message: 'Not a supplier account' }]);

    const a = await TravelArrangement.findByPk(payload.arrangementId);
    if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);

    // bazična validacija po tipu
    switch (payload.offerType) {
      case 'HOTEL':
        if (!payload.hotelName) return new Result(StatusEnum.FAIL, 400, null, [{ message: 'hotelName is required for HOTEL offers' }]);
        break;
      case 'BUS':
      case 'AIRLINE':
        if (!payload.transportMode) payload.transportMode = (payload.offerType === 'BUS' ? 'BUS' : 'PLANE');
        if (!payload.fromLocation || !payload.toLocation)
          return new Result(StatusEnum.FAIL, 400, null, [{ message: 'fromLocation and toLocation are required for transport offers' }]);
        break;
      case 'GUIDE':
        if (!payload.guideName) return new Result(StatusEnum.FAIL, 400, null, [{ message: 'guideName is required for GUIDE offers' }]);
        break;
      default:
        break;
    }

    const tx = await sequelize.transaction();
    try {
      const so = await SupplierOffer.create({
        arrangementId: payload.arrangementId,
        supplierId: supplier.id,
        offerType: payload.offerType,
        title: payload.title,
        terms: payload.terms,
        currency: payload.currency || 'EUR',
        priceTotal: payload.priceTotal ?? 0,
        capacityTotal: payload.capacityTotal ?? 0,
        availabilityStart: payload.availabilityStart,
        availabilityEnd: payload.availabilityEnd,

        hotelName: payload.hotelName,
        hotelStars: payload.hotelStars,
        board: payload.board,

        transportCompany: payload.transportCompany,
        transportMode: payload.transportMode,
        fromLocation: payload.fromLocation,
        toLocation: payload.toLocation,

        guideName: payload.guideName,
        guideLanguage: payload.guideLanguage,
        durationHours: payload.durationHours,

        meta: payload.meta || null,

        receivedAt: new Date(),
        status: 'RECEIVED'
      }, { transaction: tx });

      // opcije (ako ih ima)
      if (Array.isArray(payload.options) && payload.options.length) {
        const rows = payload.options.map(o => ({
          offerId: so.id,
          optionLabel: o.optionLabel,
          dateStart: o.dateStart,
          dateEnd: o.dateEnd,
          priceTotal: o.priceTotal ?? 0,
          capacity: o.capacity ?? 0,
          meta: o.meta || null
        }));
        await SupplierOfferOption.bulkCreate(rows, { transaction: tx });
      }

      // itinerar (ako je GUIDE i ako je dostavljen)
      if (payload.offerType === 'GUIDE' && Array.isArray(payload.itineraryItems) && payload.itineraryItems.length) {
        const rows = payload.itineraryItems.map(i => ({
          offerId: so.id,
          dayNo: i.dayNo ?? 1,
          orderNo: i.orderNo ?? 1,
          startTime: i.startTime,
          endTime: i.endTime,
          title: i.title,
          description: i.description,
          location: i.location,
          extraCost: i.extraCost
        }));
        await SupplierOfferItineraryItem.bulkCreate(rows, { transaction: tx });
      }

      await tx.commit();
      return new Result(StatusEnum.OK, 201, so);
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }

  // Operator bira jednu ponudu (pravimo OfferSelection; ponudi stavljamo ACCEPTED)
  async selectOffer(operatorUsername, { offerId }) {
    const offer = await SupplierOffer.findByPk(offerId);
    if (!offer) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Offer not found' }]);

    offer.status = 'ACCEPTED';
    offer.decisionByUsername = operatorUsername;
    offer.decisionAt = new Date();
    await offer.save();

    const sel = await OfferSelection.create({
      arrangementId: offer.arrangementId,
      offerId: offer.id,
      selectedByUsername: operatorUsername
    });

    return new Result(StatusEnum.OK, 201, sel);
  }

  // Pregled ponuda za aranžman (sa opcijama i itinerarom)
  async listOffersByArrangement(arrangementId) {
    const items = await SupplierOffer.findAll({
      where: { arrangementId },
      include: [
        { model: SupplierOfferOption, as: 'options' },
        { model: SupplierOfferItineraryItem, as: 'itineraryItems' }
      ],
      order: [['createdAt','DESC']]
    });
    return new Result(StatusEnum.OK, 200, items);
  }
}

module.exports = new OfferService();
