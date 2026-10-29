import {
  getAllSubjects,
  getSubjectById,
  getSubjectByName,
  createSubject,
  updateSubject,
  deleteSubject
} from '../models/subjekModel.js';

export const getSubjects = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllSubjects(search);

    res.json({
      message: 'Data subjek berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSubjectById(id);

    if (!data) {
      return res.status(404).json({ message: 'Subjek tidak ditemukan' });
    }

    res.json({
      message: 'Data subjek berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addSubject = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama subjek wajib diisi' });
    }

    const duplicate = await getSubjectByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama subjek sudah digunakan' });
    }

    const newData = await createSubject(data, userId);

    res.status(201).json({
      message: 'Subjek berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getSubjectById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Subjek tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getSubjectByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama subjek sudah digunakan' });
      }
    }

    const updated = await updateSubject(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui subjek' });
    }

    res.json({
      message: 'Subjek berhasil diperbarui',
      data: await getSubjectById(id)
    });
  } catch (error) {
    console.error('Edit subject error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getSubjectById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Subjek tidak ditemukan' });
    }

    const deleted = await deleteSubject(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus subjek' });
    }

    res.json({ message: 'Subjek berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove subject error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
