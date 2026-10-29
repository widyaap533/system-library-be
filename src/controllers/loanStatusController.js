import {
  getAllLoanStatuses,
  getLoanStatusById,
  getLoanStatusByName,
  getLoanStatusByCode,
  createLoanStatus,
  updateLoanStatus,
  deleteLoanStatus
} from '../models/loanStatusModel.js';

export const getLoanStatuses = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllLoanStatuses(search);

    res.json({
      message: 'Data status peminjaman berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get loan statuses error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getLoanStatusById(id);

    if (!data) {
      return res.status(404).json({ message: 'Status peminjaman tidak ditemukan' });
    }

    res.json({
      message: 'Data status peminjaman berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get loan status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addLoanStatus = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama status peminjaman wajib diisi' });
    }

    const duplicate = await getLoanStatusByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama status peminjaman sudah digunakan' });
    }

    if (data.code) {
      const duplicateCode = await getLoanStatusByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode status peminjaman sudah digunakan' });
      }
    }

    const newData = await createLoanStatus(data, userId);

    res.status(201).json({
      message: 'Status peminjaman berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode status peminjaman sudah digunakan' });
    }
    console.error('Add loan status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getLoanStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status peminjaman tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getLoanStatusByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama status peminjaman sudah digunakan' });
      }
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicateCode = await getLoanStatusByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode status peminjaman sudah digunakan' });
      }
    }

    const updated = await updateLoanStatus(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui status peminjaman' });
    }

    res.json({
      message: 'Status peminjaman berhasil diperbarui',
      data: await getLoanStatusById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode status peminjaman sudah digunakan' });
    }
    console.error('Edit loan status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getLoanStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status peminjaman tidak ditemukan' });
    }

    const deleted = await deleteLoanStatus(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus status peminjaman' });
    }

    res.json({ message: 'Status peminjaman berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove loan status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
