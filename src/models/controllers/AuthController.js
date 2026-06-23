'use strict';

class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    register = async (req, res) => {
        const session = await this.authService.register(req.body);
        res.status(201).json({ data: session });
    };

    login = async (req, res) => {
        const session = await this.authService.login(req.body);
        res.json({ data: session });
    };

    refresh = async (req, res) => {
        const tokens = await this.authService.refresh(req.body.refreshToken);
        res.json({ data: tokens });
    };

    // Protected: req.user is set by the authenticate middleware.
    logout = async (req, res) => {
        await this.authService.logout(req.user.id);
        res.json({ data: null });
    };
}

module.exports = AuthController;
