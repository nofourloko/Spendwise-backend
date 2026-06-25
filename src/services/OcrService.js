'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const AppError = require('../utils/AppError');

const SUPPORTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Structured-output schema. Every key is required and explicitly nullable
// (except confidence) so the model can never omit a field — the app relies on
// amount/category_id/expense_date/description always being present.
const OCR_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        amount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        category_id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        expense_date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        confidence: { type: 'number' },
        raw_text: { type: 'string' },
    },
    required: ['amount', 'category_id', 'expense_date', 'description', 'confidence', 'raw_text'],
};

class OcrService {
    constructor({ categoryModel, anthropicConfig = {} }) {
        this.categoryModel = categoryModel;
        this.model = anthropicConfig.model || 'claude-opus-4-8';
        this.client = anthropicConfig.apiKey ? new Anthropic({ apiKey: anthropicConfig.apiKey }) : null;
    }

    async scan({ image, mimeType }) {
        if (!this.client) {
            throw AppError.unprocessable('OCR jest niedostepne: brak skonfigurowanego ANTHROPIC_API_KEY');
        }
        if (!SUPPORTED_MIME.includes(mimeType)) {
            throw AppError.unprocessable(`Nieobslugiwany typ obrazu: ${mimeType}`);
        }

        const categories = await this.categoryModel.findAll({ orderBy: 'name' });

        let response;
        try {
            response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1500,
                output_config: { format: { type: 'json_schema', schema: OCR_SCHEMA } },
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
                            { type: 'text', text: this.#buildPrompt(categories) },
                        ],
                    },
                ],
            });
        } catch (err) {
            throw AppError.unprocessable(`Blad rozpoznawania paragonu: ${err.message}`);
        }

        // Safety classifier declined, or no usable text came back.
        if (response.stop_reason === 'refusal') {
            return this.#emptyResult();
        }

        const textBlock = response.content.find((b) => b.type === 'text');
        let parsed;
        try {
            parsed = JSON.parse(textBlock.text);
        } catch {
            return this.#emptyResult();
        }

        return this.#sanitize(parsed, categories);
    }

    #buildPrompt(categories) {
        const today = new Date().toISOString().slice(0, 10);
        const categoryLines = categories.map((c) => `- ${c.id} => ${c.name}`).join('\n');

        return [
            'Przeanalizuj zdjecie paragonu i wyodrebnij dane wydatku.',
            '',
            'Zasady dla kazdego pola:',
            '- amount: laczna kwota do zaplaty jako LICZBA (np. 49.99), kropka dziesietna, bez waluty i spacji. Gdy nie da sie odczytac => null.',
            '- expense_date: data zakupu w formacie YYYY-MM-DD. Gdy nie da sie odczytac => null.',
            '- description: nazwa sklepu lub krotkie podsumowanie zakupow (np. "Biedronka - zakupy spozywcze").',
            '- confidence: ZAWSZE liczba 0..1 wyrazajaca pewnosc odczytu (0 gdy nieznane).',
            '- raw_text: caly odczytany tekst paragonu.',
            '',
            'Dla category_id wybierz ID kategorii NAJLEPIEJ pasujacej do zakupow z ponizszej listy.',
            'Zwroc dokladnie wartosc ID (nie nazwe). Jesli nie ma pewnego dopasowania => null.',
            'Dostepne kategorie:',
            categoryLines,
            '',
            `Dzisiejsza data to ${today} (uzyj do interpretacji dat wzglednych).`,
        ].join('\n');
    }

    // Enforce the exact contract the app expects regardless of model output:
    // numeric amount, valid category id or null, ISO date or null, confidence
    // always a 0..1 number, no undefined values.
    #sanitize(raw, categories) {
        const validIds = new Set(categories.map((c) => c.id));

        return {
            amount: this.#toAmount(raw.amount),
            category_id: validIds.has(raw.category_id) ? raw.category_id : null,
            expense_date: this.#toIsoDate(raw.expense_date),
            description: typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null,
            confidence: this.#toConfidence(raw.confidence),
            raw_text: typeof raw.raw_text === 'string' ? raw.raw_text : '',
        };
    }

    #toAmount(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            // Tolerate "49,99 zl" style strings just in case the model slips.
            const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
            const num = parseFloat(cleaned);
            if (Number.isFinite(num)) return num;
        }
        return null;
    }

    #toIsoDate(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
    }

    #toConfidence(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
        return Math.min(1, Math.max(0, value));
    }

    #emptyResult() {
        return {
            amount: null,
            category_id: null,
            expense_date: null,
            description: null,
            confidence: 0,
            raw_text: '',
        };
    }
}

module.exports = OcrService;
