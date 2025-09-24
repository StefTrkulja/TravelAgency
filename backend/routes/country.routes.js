const express = require('express');
const router = express.Router();
const countryService = require('../services/country.service');

// get all countries
router.get('/', async (req, res) => {
  try {
    const result = await countryService.getAllCountries();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get by country id
router.get('/:id', async (req, res) => {
  try {
    const result = await countryService.getCountryById(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create new country
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Country name is required' });
    }
    
    const result = await countryService.createCountry({ name });
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update country by id
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Country name is required' });
    }
    
    const result = await countryService.updateCountry(req.params.id, { name });
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete country by id
router.delete('/:id', async (req, res) => {
  try {
    const result = await countryService.deleteCountry(req.params.id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
