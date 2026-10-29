import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole
} from '../models/roleModel.js';

export const getRoles = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllRoles(search);

    res.json({
      message: 'Data peran berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getRole = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getRoleById(id);

    if (!data) {
      return res.status(404).json({ message: 'Peran tidak ditemukan' });
    }

    res.json({
      message: 'Data peran berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addRole = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama peran wajib diisi' });
    }

    const duplicate = await getRoleByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama peran sudah digunakan' });
    }

    if (data.code) {
      const duplicateCode = await getRoleByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode peran sudah digunakan' });
      }
    }

    const newData = await createRole(data, userId);

    res.status(201).json({
      message: 'Peran berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode peran sudah digunakan' });
    }
    console.error('Add role error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editRole = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getRoleById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Peran tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getRoleByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama peran sudah digunakan' });
      }
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicateCode = await getRoleByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode peran sudah digunakan' });
      }
    }

    const updated = await updateRole(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui peran' });
    }

    res.json({
      message: 'Peran berhasil diperbarui',
      data: await getRoleById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode peran sudah digunakan' });
    }
    console.error('Edit role error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getRoleById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Peran tidak ditemukan' });
    }

    const deleted = await deleteRole(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus peran' });
    }

    res.json({ message: 'Peran berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove role error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
