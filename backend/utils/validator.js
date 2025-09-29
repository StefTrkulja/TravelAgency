const { Result, StatusEnum } = require('./result');

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class Validator {
  constructor() {
    this.errors = [];
  }

  // Helper methods
  addError(field, message) {
    this.errors.push({ field, message });
    return this;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getResult() {
    if (this.hasErrors()) {
      return new Result(StatusEnum.FAIL, 400, null, this.errors);
    }
    return new Result(StatusEnum.OK, 200, true);
  }

  throwIfInvalid() {
    if (this.hasErrors()) {
      throw new ValidationError(this.errors);
    }
  }

  // Basic validations
  required(value, field) {
    if (value === null || value === undefined || String(value).trim() === '') {
      this.addError(field, `${field} is required`);
    }
    return this;
  }

  string(value, field) {
    if (value !== null && value !== undefined && typeof value !== 'string') {
      this.addError(field, `${field} must be a string`);
    }
    return this;
  }

  number(value, field) {
    if (value !== null && value !== undefined && (isNaN(value) || typeof Number(value) !== 'number')) {
      this.addError(field, `${field} must be a valid number`);
    }
    return this;
  }

  integer(value, field) {
    if (value !== null && value !== undefined && !Number.isInteger(Number(value))) {
      this.addError(field, `${field} must be an integer`);
    }
    return this;
  }

  email(value, field) {
    if (value !== null && value !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        this.addError(field, `${field} must be a valid email address`);
      }
    }
    return this;
  }

  minLength(value, minLen, field) {
    if (value !== null && value !== undefined && String(value).length < minLen) {
      this.addError(field, `${field} must be at least ${minLen} characters`);
    }
    return this;
  }

  maxLength(value, maxLen, field) {
    if (value !== null && value !== undefined && String(value).length > maxLen) {
      this.addError(field, `${field} cannot exceed ${maxLen} characters`);
    }
    return this;
  }

  min(value, minVal, field) {
    if (value !== null && value !== undefined && Number(value) < minVal) {
      this.addError(field, `${field} must be at least ${minVal}`);
    }
    return this;
  }

  max(value, maxVal, field) {
    if (value !== null && value !== undefined && Number(value) > maxVal) {
      this.addError(field, `${field} cannot exceed ${maxVal}`);
    }
    return this;
  }

  enum(value, allowedValues, field) {
    if (value !== null && value !== undefined && !allowedValues.includes(value)) {
      this.addError(field, `${field} must be one of: ${allowedValues.join(', ')}`);
    }
    return this;
  }

  pattern(value, regex, field, message = null) {
    if (value !== null && value !== undefined && !regex.test(String(value))) {
      this.addError(field, message || `${field} format is invalid`);
    }
    return this;
  }

  custom(value, field, validatorFn) {
    try {
      const result = validatorFn(value);
      if (result !== true) {
        this.addError(field, result || `${field} is invalid`);
      }
    } catch (error) {
      this.addError(field, error.message);
    }
    return this;
  }

  // File validations
  file(file, field, options = {}) {
    if (!file) return this;

    const { 
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = [],
      allowedExtensions = []
    } = options;

    if (maxSize && file.size > maxSize) {
      this.addError(field, `${field} size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      this.addError(field, `${field} type must be one of: ${allowedTypes.join(', ')}`);
    }

    if (allowedExtensions.length > 0) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        this.addError(field, `${field} extension must be one of: ${allowedExtensions.join(', ')}`);
      }
    }

    return this;
  }
}

// Static factory method
Validator.create = () => new Validator();

module.exports = { Validator, ValidationError };