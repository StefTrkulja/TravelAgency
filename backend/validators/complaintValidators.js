const { Validator } = require('../utils/validator');
const { Reservation } = require('../models');

class ComplaintValidators {

  // Validacija za kreiranje nove žalbe
  static async validateCreateComplaint(data, files = []) {
    const validator = Validator.create();

    // Osnovne validacije
    validator
      .required(data.subject, 'subject')
      .string(data.subject, 'subject')
      .maxLength(data.subject, 255, 'subject')
      .required(data.description, 'description')
      .string(data.description, 'description')
      .maxLength(data.description, 5000, 'description')
      .required(data.category, 'category')
      .string(data.category, 'category')
      .required(data.createdByUsername, 'createdByUsername')
      .string(data.createdByUsername, 'createdByUsername');

    // Validacija reservationId ako je poskovan
    if (data.reservationId) {
      validator.integer(data.reservationId, 'reservationId');
      
      // Proverava da li rezervacija postoji
      try {
        const reservation = await Reservation.findByPk(data.reservationId);
        if (!reservation) {
          validator.addError('reservationId', 'Reservation not found');
        }
        // Opciono: Proverava da li rezervacija pripada korisniku
        // if (reservation && reservation.customerUsername !== data.createdByUsername) {
        //   validator.addError('reservationId', 'Access to reservation denied');
        // }
      } catch (error) {
        validator.addError('reservationId', 'Error validating reservation');
      }
    }

    // Validacija priority ako je poskovan
    if (data.priority) {
      validator.enum(data.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'priority');
    }

    // Validacija fajlova
    if (files && files.length > 0) {
      if (files.length > 10) {
        validator.addError('attachments', 'Maximum 10 files allowed');
      }

      files.forEach((file, index) => {
        validator.file(file, `attachment_${index}`, {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt']
        });
      });
    }

    return validator.getResult();
  }

  // Validacija za ažuriranje prioriteta
  static validateUpdatePriority(data) {
    const validator = Validator.create();

    validator
      .required(data.priority, 'priority')
      .enum(data.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'priority');

    return validator.getResult();
  }

  // Validacija za dodelu operateru
  static validateAssignOperator(data) {
    const validator = Validator.create();

    validator
      .required(data.complaintId, 'complaintId')
      .integer(data.complaintId, 'complaintId')
      .required(data.assigneeUsername, 'assigneeUsername')
      .string(data.assigneeUsername, 'assigneeUsername')
      .required(data.priority, 'priority')
      .enum(data.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'priority');

    return validator.getResult();
  }

  // Validacija za status transition
  static validateStatusTransition(data) {
    const validator = Validator.create();

    validator
      .required(data.toCode, 'toCode')
      .string(data.toCode, 'toCode')
      .maxLength(data.note, 1000, 'note'); // note je opciono

    return validator.getResult();
  }

  // Validacija za poruke
  static validateMessage(data) {
    const validator = Validator.create();

    validator
      .required(data.complaintId, 'complaintId')
      .integer(data.complaintId, 'complaintId')
      .required(data.text, 'text')
      .string(data.text, 'text')
      .maxLength(data.text, 2000, 'text')
      .required(data.authorUsername, 'authorUsername')
      .string(data.authorUsername, 'authorUsername');

    return validator.getResult();
  }
}

module.exports = ComplaintValidators;