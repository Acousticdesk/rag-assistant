import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { config } from '../config.js';
import { logger } from '../logger.js';

export type AuthenticatedUser = {
  token: string;
};

export function configurePassport(): void {
  passport.use(
    new BearerStrategy((token, done) => {
      const expected = config.auth.apiKey;
      logger.debug(`passport: bearer token received (length=${token.length})`);

      if (!expected) {
        done(new Error('Server auth is not configured (SERVER_API_KEY is missing).'));
        return;
      }

      if (token !== expected) {
        logger.warn('passport: bearer token mismatch — unauthorized request rejected');
        done(null, false);
        return;
      }

      logger.debug('passport: token valid');
      const user: AuthenticatedUser = { token };
      done(null, user);
    }),
  );
}
