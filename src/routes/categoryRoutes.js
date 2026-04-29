'use strict';

const { Router } = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const buildCategoryRouter = ({ categoryController }) => {
    const router = Router();

    router.get('/', asyncHandler(categoryController.list));
    router.get('/:id', validate([param('id').isUUID()]), asyncHandler(categoryController.getById));

    return router;
};

module.exports = buildCategoryRouter;
