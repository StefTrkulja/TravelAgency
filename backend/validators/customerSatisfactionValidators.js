const { Validator } = require('../utils/validator');

class CustomerSatisfactionValidators {

  // Validacija za kreiranje CSAT ocene
  static validateCreateRating(data) {
    const validator = Validator.create();

    validator
      .required(data.complaintId, 'complaintId')
      .integer(data.complaintId, 'complaintId')
      .required(data.customerUsername, 'customerUsername')
      .string(data.customerUsername, 'customerUsername')
      .required(data.rating, 'rating')
      .integer(data.rating, 'rating')
      .min(data.rating, 1, 'rating')
      .max(data.rating, 5, 'rating');

    // Comment je opciono, ali ako postoji mora biti validno
    if (data.comment) {
      validator
        .string(data.comment, 'comment')
        .maxLength(data.comment, 500, 'comment');
    }

    return validator.getResult();
  }

  // Validacija za query parametre CSAT liste
  static validateGetAllParams(query) {
    const validator = Validator.create();

    if (query.limit) {
      validator
        .integer(query.limit, 'limit')
        .min(query.limit, 1, 'limit')
        .max(query.limit, 100, 'limit');
    }

    if (query.offset) {
      validator
        .integer(query.offset, 'offset')
        .min(query.offset, 0, 'offset');
    }

    if (query.rating) {
      validator
        .integer(query.rating, 'rating')
        .min(query.rating, 1, 'rating')
        .max(query.rating, 5, 'rating');
    }

    if (query.dateFrom) {
      validator.custom(query.dateFrom, 'dateFrom', (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'dateFrom must be a valid date';
      });
    }

    if (query.dateTo) {
      validator.custom(query.dateTo, 'dateTo', (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'dateTo must be a valid date';
      });
    }

    // Proverava da li je dateFrom pre dateTo
    if (query.dateFrom && query.dateTo) {
      validator.custom([query.dateFrom, query.dateTo], 'dateRange', (values) => {
        const [from, to] = values;
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return fromDate <= toDate || 'dateFrom must be before or equal to dateTo';
      });
    }

    return validator.getResult();
  }

  // Validacija za statistike parametre
  static validateStatisticsParams(query) {
    const validator = Validator.create();

    if (query.dateFrom) {
      validator.custom(query.dateFrom, 'dateFrom', (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'dateFrom must be a valid date';
      });
    }

    if (query.dateTo) {
      validator.custom(query.dateTo, 'dateTo', (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'dateTo must be a valid date';
      });
    }

    return validator.getResult();
  }
}

module.exports = CustomerSatisfactionValidators;