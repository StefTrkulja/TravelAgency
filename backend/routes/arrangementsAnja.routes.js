const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');

const arrangementService = require('../services/arrangementAnja.service');

// get all arrangements
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.destinationId) {
      filters.destinationId = req.query.destinationId;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.transportType) {
      filters.transportType = req.query.transportType;
    }
    
    if (req.query.accommodationType) {
      filters.accommodationType = req.query.accommodationType;
    }
    
    const result = await arrangementService.getAllArrangements(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// search arrangements
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      query: req.query.q,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      transportType: req.query.transportType,
      accommodationType: req.query.accommodationType
    };
    
    const result = await arrangementService.searchArrangements(searchParams);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get arrangement by id
router.get('/:id', async (req, res) => {
  try {
    const result = await arrangementService.getArrangementById(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get arrangements by destination
router.get('/destination/:destinationId', async (req, res) => {
  try {
    const result = await arrangementService.getArrangementsByDestination(req.params.destinationId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken(), async (req, res) => {
  try {
    const { 
      destinationId, 
      title, 
      summary, 
      basePricePerPerson, 
      transportType, 
      accommodationType,
      status,
      type
    } = req.body;
    
    // throw error if missing some attributes
    if (!destinationId || !title || !basePricePerPerson || !transportType || !accommodationType) {
      return res.status(400).json({ 
        error: 'Destination ID, title, base price, transport type, and accommodation type are required' 
      });
    }
    
    const validTransportTypes = ['BUS', 'PLANE', 'OWN'];
    const validAccommodationTypes = ['HOTEL', 'APT', 'HOSTEL'];
    const validStatuses = ['DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE'];
    const createdByUsername = req.user?.username || req.body.createdByUsername; 


    if (!destinationId || !title || !basePricePerPerson || !transportType || !accommodationType) {
      return res.status(400).json({ 
        error: 'Destination ID, title, base price, transport type, and accommodation type are required' 
      });
    }
    if (!createdByUsername) {
      return res.status(400).json({ error: 'createdByUsername is required (from auth or body)' });
    }


    if (!validTransportTypes.includes(transportType)) {
      return res.status(400).json({ 
        error: 'Invalid transport type. Must be one of: ' + validTransportTypes.join(', ') 
      });
    }
    
    if (!validAccommodationTypes.includes(accommodationType)) {
      return res.status(400).json({ 
        error: 'Invalid accommodation type. Must be one of: ' + validAccommodationTypes.join(', ') 
      });
    }
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }
    
    const arrangementData = {
      destinationId,
      title,
      summary,
      basePricePerPerson: parseFloat(basePricePerPerson),
      transportType,
      accommodationType,
      status: status || 'DRAFT',
      createdByUsername,
      type,
    };
    
    const result = await arrangementService.createArrangement(arrangementData);
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
