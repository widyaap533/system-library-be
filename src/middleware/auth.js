import passport from '../config/passport.js';

/**
 * Mewajibkan token yang sah. Mengisi req.user kalau lolos.
 *
 * Dipakai custom callback, bukan passport.authenticate biasa,
 * supaya pesan errornya berbahasa Indonesia dan membedakan
 * token kedaluwarsa dari token tidak sah.
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }

    if (!user) {
      if (info?.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Sesi sudah berakhir, silakan perbarui token',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        message: 'Tidak memiliki akses. Silakan login terlebih dahulu.'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Membaca token kalau ada, tapi tidak mewajibkannya.
 *
 * Dipakai di endpoint publik yang tetap ingin mencatat siapa pelakunya
 * kalau kebetulan sudah login — misalnya pencarian katalog.
 */
export const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

/**
 * Membatasi akses berdasarkan kode peran.
 *
 * Dipakai setelah authenticate:
 *   router.delete('/book/:id', authenticate, requireRole('ADMIN'), removeBook);
 *
 * Yang dicocokkan kode, bukan nama, supaya pengubahan nama peran
 * di menu master tidak diam-diam membuka atau menutup akses.
 */
export const requireRole = (...allowedCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak memiliki akses' });
    }

    const userRoleCode = req.user.role?.code;

    if (!userRoleCode) {
      return res.status(403).json({
        message: 'Peran pengguna belum diatur kodenya. Hubungi administrator.'
      });
    }

    if (!allowedCodes.includes(userRoleCode)) {
      return res.status(403).json({
        message: 'Anda tidak berwenang melakukan tindakan ini'
      });
    }

    next();
  };
};

/**
 * Mengizinkan pengguna mengakses datanya sendiri, atau peran tertentu
 * mengakses data siapa saja.
 *
 * Supaya anggota bisa melihat profil dan riwayat pinjamnya sendiri,
 * tanpa bisa mengintip milik anggota lain.
 */
export const requireSelfOrRole = (paramName, ...allowedCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak memiliki akses' });
    }

    const isSelf = req.user.id === req.params[paramName];
    const hasRole = allowedCodes.includes(req.user.role?.code);

    if (!isSelf && !hasRole) {
      return res.status(403).json({
        message: 'Anda tidak berwenang mengakses data ini'
      });
    }

    next();
  };
};

// Pintasan yang sering dipakai, supaya route file tidak penuh string
export const ROLE = {
  ADMIN: 'ADMIN',
  LIBRARIAN: 'PUSTAKAWAN',
  MEMBER: 'ANGGOTA',
};

export const isStaff = requireRole(ROLE.ADMIN, ROLE.LIBRARIAN);
export const isAdmin = requireRole(ROLE.ADMIN);
