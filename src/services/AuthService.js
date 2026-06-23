'use strict';

const bcrypt = require('bcryptjs');

const AppError = require('../utils/AppError');
const sanitizeUser = require('../utils/sanitizeUser');

const BCRYPT_ROUNDS = 10;
const SESSION_EXPIRED = 'Sesja wygasła. Zaloguj się ponownie.';

class AuthService {
    constructor({ userModel, tokenService }) {
        this.userModel = userModel;
        this.tokenService = tokenService;
    }

    async register({ name, email, password }) {
        const normalizedEmail = String(email).trim().toLowerCase();

        const existing = await this.userModel.findByEmail(normalizedEmail);
        if (existing) {
            throw AppError.conflict('Konto z tym adresem e-mail już istnieje.');
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await this.userModel.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password_hash: passwordHash,
        });

        return this.#issueSession(user);
    }

    async login({ email, password }) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await this.userModel.findByEmail(normalizedEmail);

        const passwordOk =
            user && user.password_hash
                ? await bcrypt.compare(password, user.password_hash)
                : false;

        if (!passwordOk) {
            throw AppError.unauthorized('Nieprawidłowy e-mail lub hasło.');
        }

        return this.#issueSession(user);
    }

    // Rotates the refresh token: validates + revokes the old one, then issues
    // a brand new access + refresh pair.
    async refresh(refreshToken) {
        const { userId } = await this.tokenService.consumeRefreshToken(refreshToken);

        const user = await this.userModel.findById(userId);
        if (!user) {
            throw AppError.unauthorized(SESSION_EXPIRED);
        }

        const accessToken = this.tokenService.signAccessToken(user);
        const newRefreshToken = await this.tokenService.issueRefreshToken(user.id);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(userId) {
        await this.tokenService.revokeAllForUser(userId);
    }

    async #issueSession(user) {
        const accessToken = this.tokenService.signAccessToken(user);
        const refreshToken = await this.tokenService.issueRefreshToken(user.id);
        return { accessToken, refreshToken, user: sanitizeUser(user) };
    }
}

module.exports = AuthService;
