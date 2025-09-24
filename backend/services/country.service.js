const { Country } = require('../models');

class CountryService {
  async getAllCountries() {
    try {
      const countries = await Country.findAll({
        order: [['name', 'ASC']]
      });
      return { success: true, data: countries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCountryById(id) {
    try {
      const country = await Country.findByPk(id, {
        include: [{
          association: 'destinations',
          where: { isActive: true },
          required: false
        }]
      });
      
      if (!country) {
        return { success: false, error: 'Country not found' };
      }
      
      return { success: true, data: country };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createCountry(countryData) {
    try {
      const country = await Country.create(countryData);
      return { success: true, data: country };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateCountry(id, updateData) {
    try {
      const [updatedRowsCount] = await Country.update(updateData, {
        where: { id }
      });
      
      if (updatedRowsCount === 0) {
        return { success: false, error: 'Country not found' };
      }
      
      const updatedCountry = await Country.findByPk(id);
      return { success: true, data: updatedCountry };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteCountry(id) {
    try {
      const deletedRowsCount = await Country.destroy({
        where: { id }
      });
      
      if (deletedRowsCount === 0) {
        return { success: false, error: 'Country not found' };
      }
      
      return { success: true, message: 'Country deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CountryService();
