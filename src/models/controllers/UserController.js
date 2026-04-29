'use strict';

class UserController {
    constructor({ userService }) {
        this.userService = userService;
    }

    list = async (req, res) => {
        const users = await this.userService.list();
        res.json({ data: users });
    };

    getById = async (req, res) => {
        const user = await this.userService.getById(req.params.id);
        res.json({ data: user });
    };

    create = async (req, res) => {
        const user = await this.userService.create(req.body);
        res.status(201).json({ data: user });
    };

    update = async (req, res) => {
        const user = await this.userService.update(req.params.id, req.body);
        res.json({ data: user });
    };

    remove = async (req, res) => {
        await this.userService.remove(req.params.id);
        res.status(204).end();
    };
}

module.exports = UserController;
