const express = require('express');
const router = express.Router();
const svc = require('../services/arrangements.service');
const { StatusEnum } = require('../utils/result');
const { verifyToken } = require('../utils/jwtParser');

// helper za role nakon verifyToken()
// jer verifyToken prima samo JEDNU rolu (ili ništa)
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized access' });
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};


router.post('/',
  verifyToken(),              // ulogovan
  allowRoles('OPERATOR'),     // i rola OPERATOR
  async (req, res) => {
    const r = await svc.create(req.body, req.user.username);
    return res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

// Listanje aranžmana (ulogovan bilo ko).
// Podržava: ?status=DRAFT,PENDING,ACTIVE&search=...&type=...
router.get('/',
  verifyToken(),              // ulogovan
  async (req, res) => {
    const r = await svc.list(req.query);
    return res.status(r.code).json(r.data);
  }
);

// Grupisano listanje po statusima (draft/pending/active) – ulogovan bilo ko
router.get('/grouped',
  verifyToken(),
  async (req, res) => {
    const r = await svc.listGrouped();
    return res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

// Dohvatanje po ID (ulogovan bilo ko, vraća i relacije)
router.get('/:id',
  verifyToken(),
  async (req, res) => {
    const r = await svc.getById(req.params.id, true);
    return res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);


router.put('/:id',
  verifyToken(),
  allowRoles('OPERATOR', 'MANAGER'),
  async (req, res) => {

    const r = await svc.update(req.params.id, req.body, req.user.username);
    return res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);


router.delete('/:id',
  verifyToken(),
  allowRoles('MANAGER'),
  async (req, res) => {
    const r = await svc.remove(req.params.id);
    return res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

module.exports = router;
