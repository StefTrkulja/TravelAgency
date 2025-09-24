const fs = require('fs');
const path = require('path');
const {Attachment} = require('../models');
const sequelize = require('../models/index').sequelize;


class AttachmentService {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  sanitizeFilename(name) {
    return String(name).replace(/[^\w.\-]+/g, '_').slice(0, 200);
  }

  async saveFile(complaintId, file) {
    const safeName = this.sanitizeFilename(file.originalname || 'file');
    const ext = path.extname(safeName);
    const stem = path.basename(safeName, ext);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${stem}-${unique}${ext || ''}`;

    const relativePath = path.join('uploads', filename);
    const absolutePath = path.join(process.cwd(), relativePath);

    await fs.promises.writeFile(absolutePath, file.buffer);

    return Attachment.create({
      complaintId,
      storageKey: relativePath.replace(/\\/g, '/'),
    });
  }

  async saveMany(complaintId, files = []) {
    const out = [];
    for (const f of files) {
      out.push(await this.saveFile(complaintId, f));
    }
    return out;
  }

  absPathFromStorageKey(storageKey) {
    return path.join(process.cwd(), storageKey);
  }

  async deleteAttachment(id) {
    const att = await Attachment.findByPk(id);
    if (!att) return false;

    const absPath = this.absPathFromStorageKey(att.storageKey);
    try {
      await fs.promises.unlink(absPath);
    } catch (e) {
      // fajl možda ne postoji, ignoriši
    }

    await att.destroy();
    return true;
  }
}module.exports = new AttachmentService();
