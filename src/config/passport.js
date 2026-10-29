import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { getUserById } from '../models/userModel.js';

/**
 * Strategi JWT.
 *
 * Token dikirim lewat header: Authorization: Bearer <access_token>
 *
 * Isi token sengaja dibuat minim — hanya id pengguna. Data lain
 * (nama, peran) selalu diambil ulang dari database setiap request,
 * supaya pengguna yang perannya diturunkan atau dinonaktifkan
 * langsung kehilangan akses, tidak perlu menunggu tokennya kedaluwarsa.
 */
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET,
};

passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      const user = await getUserById(payload.sub);

      // getUserById sudah menyaring is_deleted, jadi pengguna
      // yang dihapus otomatis ditolak di sini
      if (!user) {
        return done(null, false, { message: 'Pengguna tidak ditemukan' });
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
