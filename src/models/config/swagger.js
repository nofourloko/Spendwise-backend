'use strict';

const env = require('./env');

const openApiDefinition = {
    openapi: '3.0.3',
    info: {
        title: 'SpendWise API',
        version: '1.0.0',
        description: 'Backend API asystenta budzetu domowego z AI',
        contact: { name: 'SpendWise' },
        license: { name: 'MIT' },
    },
    servers: [
        { url: `http://localhost:${env.port}/api`, description: 'Serwer lokalny' },
        { url: 'http://10.0.2.2:3000/api', description: 'Android emulator -> host' },
    ],
    // Protected by default; public endpoints override with `security: []`.
    security: [{ bearerAuth: [] }],
    tags: [
        { name: 'Health', description: 'Status serwisu' },
        { name: 'Auth', description: 'Rejestracja, logowanie, tokeny' },
        { name: 'Users', description: 'Uzytkownicy' },
        { name: 'Categories', description: 'Kategorie wydatkow' },
        { name: 'Expenses', description: 'Wydatki' },
        { name: 'BudgetLimits', description: 'Limity budzetowe' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Access token: Authorization: Bearer <accessToken>',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    message: { type: 'string', description: 'Komunikat pokazywany uzytkownikowi' },
                    details: {},
                },
            },
            RegisterInput: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'Jan Kowalski' },
                    email: { type: 'string', format: 'email', example: 'jan@example.com' },
                    password: { type: 'string', format: 'password', minLength: 8, example: 'tajneHaslo123' },
                },
            },
            LoginInput: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'jan@example.com' },
                    password: { type: 'string', format: 'password', example: 'tajneHaslo123' },
                },
            },
            RefreshInput: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string', format: 'uuid', example: '9c1d4b77-2a6e-4f80-b3aa-aabbccddeeff' },
                },
            },
            AuthSession: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string', description: 'Krotkozyciowy JWT (15 min)' },
                    refreshToken: { type: 'string', format: 'uuid', description: 'Dlugozyciowy, rotowany przy odswiezeniu' },
                    user: { $ref: '#/components/schemas/User' },
                },
            },
            TokenPair: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string', format: 'uuid' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    currency: { type: 'string', example: 'PLN' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            UserInput: {
                type: 'object',
                required: ['email', 'name'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    currency: { type: 'string', example: 'PLN' },
                },
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Jedzenie' },
                    icon: { type: 'string', example: 'fork-knife' },
                    color: { type: 'string', example: '#1D9E75' },
                },
            },
            Expense: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    user_id: { type: 'string', format: 'uuid' },
                    category_id: { type: 'string', format: 'uuid' },
                    amount: { type: 'number', format: 'float', example: 45.99 },
                    description: { type: 'string', nullable: true },
                    expense_date: { type: 'string', format: 'date' },
                    source: { type: 'string', enum: ['manual', 'ocr'] },
                    created_at: { type: 'string', format: 'date-time' },
                    category_name: { type: 'string' },
                    category_icon: { type: 'string' },
                    category_color: { type: 'string' },
                },
            },
            ExpenseInput: {
                type: 'object',
                required: ['user_id', 'category_id', 'amount', 'expense_date'],
                properties: {
                    user_id: { type: 'string', format: 'uuid' },
                    category_id: { type: 'string', format: 'uuid' },
                    amount: { type: 'number', format: 'float', example: 45.99 },
                    description: { type: 'string' },
                    expense_date: { type: 'string', format: 'date', example: '2026-04-29' },
                    source: { type: 'string', enum: ['manual', 'ocr'], default: 'manual' },
                },
            },
            ExpenseSummaryItem: {
                type: 'object',
                properties: {
                    category_id: { type: 'string', format: 'uuid' },
                    category_name: { type: 'string' },
                    category_icon: { type: 'string' },
                    category_color: { type: 'string' },
                    total: { type: 'number', format: 'float' },
                },
            },
            BudgetLimit: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    user_id: { type: 'string', format: 'uuid' },
                    category_id: { type: 'string', format: 'uuid' },
                    monthly_limit: { type: 'number', format: 'float', example: 500.0 },
                    month: { type: 'integer', minimum: 1, maximum: 12 },
                    year: { type: 'integer', example: 2026 },
                },
            },
            BudgetLimitInput: {
                type: 'object',
                required: ['user_id', 'category_id', 'monthly_limit', 'month', 'year'],
                properties: {
                    user_id: { type: 'string', format: 'uuid' },
                    category_id: { type: 'string', format: 'uuid' },
                    monthly_limit: { type: 'number', format: 'float', minimum: 0 },
                    month: { type: 'integer', minimum: 1, maximum: 12 },
                    year: { type: 'integer', minimum: 2000, maximum: 2100 },
                },
            },
            BudgetStatusItem: {
                type: 'object',
                properties: {
                    category_id: { type: 'string', format: 'uuid' },
                    category_name: { type: 'string' },
                    category_icon: { type: 'string' },
                    category_color: { type: 'string' },
                    monthly_limit: { type: 'number', format: 'float', nullable: true },
                    spent: { type: 'number', format: 'float' },
                    usage_percent: { type: 'number', format: 'float', nullable: true },
                },
            },
        },
        parameters: {
            UuidPath: {
                in: 'path',
                name: 'id',
                required: true,
                schema: { type: 'string', format: 'uuid' },
            },
            UserIdPath: {
                in: 'path',
                name: 'userId',
                required: true,
                schema: { type: 'string', format: 'uuid' },
            },
            MonthQuery: {
                in: 'query',
                name: 'month',
                required: true,
                schema: { type: 'integer', minimum: 1, maximum: 12 },
            },
            YearQuery: {
                in: 'query',
                name: 'year',
                required: true,
                schema: { type: 'integer', minimum: 2000, maximum: 2100 },
            },
        },
        responses: {
            BadRequest: {
                description: 'Nieprawidlowe zadanie',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            NotFound: {
                description: 'Zasob nie istnieje',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            Unprocessable: {
                description: 'Niepoprawne dane',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            Conflict: {
                description: 'Konflikt zasobu',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            Unauthorized: {
                description: 'Brak / nieprawidlowy / wygasly token (klient wymusza wylogowanie)',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Status serwisu',
                security: [],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        uptime: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Rejestracja',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
                },
                responses: {
                    201: {
                        description: 'Utworzono konto + wydano tokeny',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AuthSession' } } },
                            },
                        },
                    },
                    409: { $ref: '#/components/responses/Conflict' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Logowanie',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
                },
                responses: {
                    200: {
                        description: 'Zalogowano',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AuthSession' } } },
                            },
                        },
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Rotacja tokenow (nowy access + refresh)',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } },
                },
                responses: {
                    200: {
                        description: 'Wydano nowa pare tokenow',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/TokenPair' } } },
                            },
                        },
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Wylogowanie (uniewaznia refresh tokeny)',
                responses: {
                    200: {
                        description: 'Wylogowano',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'null', nullable: true } } },
                            },
                        },
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/users/me': {
            get: {
                tags: ['Users'],
                summary: 'Zalogowany uzytkownik (z tokenu)',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } },
                            },
                        },
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/users': {
            get: {
                tags: ['Users'],
                summary: 'Lista uzytkownikow',
                responses: {
                    200: {
                        description: 'Lista uzytkownikow',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Users'],
                summary: 'Utworz uzytkownika',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/User' } },
                                },
                            },
                        },
                    },
                    409: { $ref: '#/components/responses/Conflict' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/users/{id}': {
            parameters: [{ $ref: '#/components/parameters/UuidPath' }],
            get: {
                tags: ['Users'],
                summary: 'Pobierz uzytkownika',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/User' } },
                                },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                tags: ['Users'],
                summary: 'Aktualizuj uzytkownika',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
                },
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/User' } },
                                },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
            delete: {
                tags: ['Users'],
                summary: 'Usun uzytkownika',
                responses: {
                    200: {
                        description: 'Usunieto',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'null', nullable: true } } },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/categories': {
            get: {
                tags: ['Categories'],
                summary: 'Lista kategorii',
                responses: {
                    200: {
                        description: 'Lista kategorii',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/categories/{id}': {
            parameters: [{ $ref: '#/components/parameters/UuidPath' }],
            get: {
                tags: ['Categories'],
                summary: 'Pobierz kategorie',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/Category' } },
                                },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/expenses': {
            post: {
                tags: ['Expenses'],
                summary: 'Utworz wydatek',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ExpenseInput' } } },
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/Expense' } },
                                },
                            },
                        },
                    },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/expenses/{id}': {
            parameters: [{ $ref: '#/components/parameters/UuidPath' }],
            get: {
                tags: ['Expenses'],
                summary: 'Pobierz wydatek',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/Expense' } },
                                },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                tags: ['Expenses'],
                summary: 'Aktualizuj wydatek',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ExpenseInput' } } },
                },
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/Expense' } },
                                },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
            delete: {
                tags: ['Expenses'],
                summary: 'Usun wydatek',
                responses: {
                    200: {
                        description: 'Usunieto',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'null', nullable: true } } },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/expenses/users/{userId}': {
            parameters: [{ $ref: '#/components/parameters/UserIdPath' }],
            get: {
                tags: ['Expenses'],
                summary: 'Wydatki uzytkownika',
                parameters: [
                    { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
                    { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
                    { in: 'query', name: 'categoryId', schema: { type: 'string', format: 'uuid' } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 500 } },
                    { in: 'query', name: 'offset', schema: { type: 'integer', minimum: 0 } },
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/expenses/users/{userId}/summary': {
            parameters: [
                { $ref: '#/components/parameters/UserIdPath' },
                { $ref: '#/components/parameters/MonthQuery' },
                { $ref: '#/components/parameters/YearQuery' },
            ],
            get: {
                tags: ['Expenses'],
                summary: 'Podsumowanie wydatkow wg kategorii',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/ExpenseSummaryItem' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: '#/components/responses/BadRequest' },
                },
            },
        },
        '/budget-limits': {
            put: {
                tags: ['BudgetLimits'],
                summary: 'Dodaj lub zaktualizuj limit (upsert)',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetLimitInput' } } },
                },
                responses: {
                    201: {
                        description: 'Zapisano',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/BudgetLimit' } },
                                },
                            },
                        },
                    },
                    422: { $ref: '#/components/responses/Unprocessable' },
                },
            },
        },
        '/budget-limits/{id}': {
            parameters: [{ $ref: '#/components/parameters/UuidPath' }],
            delete: {
                tags: ['BudgetLimits'],
                summary: 'Usun limit budzetowy',
                responses: {
                    200: {
                        description: 'Usunieto',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'null', nullable: true } } },
                            },
                        },
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/budget-limits/users/{userId}': {
            parameters: [
                { $ref: '#/components/parameters/UserIdPath' },
                { $ref: '#/components/parameters/MonthQuery' },
                { $ref: '#/components/parameters/YearQuery' },
            ],
            get: {
                tags: ['BudgetLimits'],
                summary: 'Limity uzytkownika dla miesiaca',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/BudgetLimit' } },
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: '#/components/responses/BadRequest' },
                },
            },
        },
        '/budget-limits/users/{userId}/status': {
            parameters: [
                { $ref: '#/components/parameters/UserIdPath' },
                { $ref: '#/components/parameters/MonthQuery' },
                { $ref: '#/components/parameters/YearQuery' },
            ],
            get: {
                tags: ['BudgetLimits'],
                summary: 'Status realizacji limitow w miesiacu',
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/BudgetStatusItem' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: '#/components/responses/BadRequest' },
                },
            },
        },
    },
};

const swaggerUiOptions = {
    customSiteTitle: 'SpendWise API Docs',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
    },
};

module.exports = {
    openApiDefinition,
    swaggerUiOptions,
};
