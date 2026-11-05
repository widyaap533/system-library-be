import passport from '../config/passport.js';

export const ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'ANGGOTA',
};

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

export const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

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

export const requireSelfOrRole = (paramName, ...allowedCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak memiliki akses' });
    }

    const isSelf = String(req.user.id) === String(req.params[paramName]);
    const hasRole = allowedCodes.includes(req.user.role?.code);

    if (!isSelf && !hasRole) {
      return res.status(403).json({
        message: 'Anda tidak berwenang mengakses data ini'
      });
    }

    next();
  };
};

export const isAdmin = requireRole(ROLE.ADMIN);
export const isMember = requireRole(ROLE.MEMBER);