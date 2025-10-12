'use strict';

const { stripe } = require('./stripeClient');
const { Reservation, Payment, sequelize } = require('../models');

const DEFAULT_CURRENCY = (process.env.CURRENCY || 'eur').toLowerCase();

/**
 * Pomoćne funkcije (inline)
 */
function toCents(value) {
  const s = String(value);
  const [whole, frac = ''] = s.split('.');
  const frac2 = (frac + '00').slice(0, 2);
  return (Number(whole) * 100) + Number(frac2);
}

function fromCents(cents) {
  return (Number(cents) / 100).toFixed(2);
}

/**
 * Kreira Stripe Checkout Session za postojeću rezervaciju.
 */
async function createCheckoutSession(reservationId) {
  const t = await sequelize.transaction();
  try {
    const reservation = await Reservation.findByPk(reservationId, { transaction: t });
    if (!reservation) {
      await t.rollback();
      return { error: 'Reservation not found', status: 404 };
    }

    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      await t.rollback();
      return { error: `Reservation not payable in status: ${reservation.status}`, status: 409 };
    }

    const paid = await Payment.findOne({
      where: { reservationId, status: 'SUCCEEDED' },
      transaction: t,
    });
    if (paid) {
      await t.rollback();
      return { error: 'Reservation already paid', status: 409 };
    }

    const amountCents = toCents(reservation.totalPrice);

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/cancel?reservation=${reservation.id}`,
        line_items: [
          {
            price_data: {
              currency: DEFAULT_CURRENCY,
              product_data: {
                name: `Rezervacija #${reservation.code}`,
                description: `Arrangement: ${reservation.arrangementId} | People: ${reservation.numberOfPeople} | Kids: ${reservation.numberOfKids}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          reservationId: String(reservation.id),
          reservationCode: reservation.code,
        },
      },
      {
        idempotencyKey: `reservation-${reservation.id}-checkout`,
      }
    );

    await t.commit();
    return { url: session.url, sessionId: session.id };
  } catch (err) {
    await t.rollback();
    console.error('createCheckoutSession error:', err);
    return { error: err.message, status: 500 };
  }
}

/**
 * Potvrđuje uplatu BEZ webhoka.
 */
async function confirmCheckout(sessionId) {
  try {
    if (!sessionId) return { error: 'Missing session_id', status: 400 };

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const piId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    const pi = piId ? await stripe.paymentIntents.retrieve(piId) : null;

    if (session.payment_status !== 'paid') {
      return { success: false, message: 'Payment not completed', status: 200 };
    }

    const reservationId = parseInt(session.metadata?.reservationId, 10);
    if (!reservationId) {
      return { error: 'ReservationId missing in metadata', status: 422 };
    }

    const t = await sequelize.transaction();
    try {
      if (piId) {
        const existing = await Payment.findOne({
          where: { reservationId, stripePaymentIntentId: piId, status: 'SUCCEEDED' },
          transaction: t,
        });
        if (existing) {
          await Reservation.update(
            { status: 'PAID' },
            { where: { id: reservationId }, transaction: t }
          );
          await t.commit();
          return { success: true, message: 'Already confirmed' };
        }
      }

      const amountTotal = session.amount_total ?? pi?.amount_received ?? pi?.amount ?? null;
      const amountDecimal = amountTotal != null ? fromCents(amountTotal) : null;

      await Payment.create(
        {
          reservationId,
          stripePaymentIntentId: piId || null,
          stripeChargeId: pi?.latest_charge || null,
          amount: amountDecimal,
          currency: (session.currency || pi?.currency || DEFAULT_CURRENCY).toLowerCase(),
          status: 'SUCCEEDED',
          paymentMethod: (pi?.payment_method_types && pi.payment_method_types[0]) || null,
          receiptUrl: pi?.charges?.data?.[0]?.receipt_url || null,
          description: `Stripe Checkout ${session.id}`,
        },
        { transaction: t }
      );

      await Reservation.update(
        { status: 'PAID' },
        { where: { id: reservationId }, transaction: t }
      );

      await t.commit();
      return { success: true, message: 'Reservation marked as PAID' };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error('confirmCheckout error:', err);
    return { error: err.message, status: 500 };
  }
}

module.exports = {
  createCheckoutSession,
  confirmCheckout,
};