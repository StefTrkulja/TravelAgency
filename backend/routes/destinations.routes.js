const express = require('express');
const router = express.Router();
const destinationService = require('../services/destinations.service');

// get all destinations
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.countryId) {
      filters.countryId = req.query.countryId;
    }
    
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    const result = await destinationService.getAllDestinations(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get destination by id
router.get('/:id', async (req, res) => {
  try {
    const result = await destinationService.getDestinationById(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get destinations by country
router.get('/country/:countryId', async (req, res) => {
  try {
    const result = await destinationService.getDestinationsByCountry(req.params.countryId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create new destination
router.post('/', async (req, res) => {
  try {
    const { countryId, name, description, isActive } = req.body;

    if (!countryId || !name) {
      return res.status(400).json({ 
        error: 'Country ID and name are required' 
      });
    }
    
    const destinationData = {
      countryId,
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    const result = await destinationService.createDestination(destinationData);
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update destination
router.put('/:id', async (req, res) => {
  try {
    const { countryId, name, description, isActive } = req.body;
    
    const updateData = {};
    if (countryId) updateData.countryId = countryId;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const result = await destinationService.updateDestination(req.params.id, updateData);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete destination
router.delete('/:id', async (req, res) => {
  try {
    const result = await destinationService.deleteDestination(req.params.id);
    
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
