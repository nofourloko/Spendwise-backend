'use strict';

class CategoryController {
    constructor({ categoryService }) {
        this.categoryService = categoryService;
    }

    list = async (req, res) => {
        const categories = await this.categoryService.list();
        res.json({ data: categories });
    };

    getById = async (req, res) => {
        const category = await this.categoryService.getById(req.params.id);
        res.json({ data: category });
    };
}

module.exports = CategoryController;
