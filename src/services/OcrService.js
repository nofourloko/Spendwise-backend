'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const AppError = require('../utils/AppError');

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

class OcrService {
    constructor({ categoryModel, anthropicApiKey, ocrModel }) {
        this.categoryModel = categoryModel;
        this.model = ocrModel || 'claude-sonnet-4-5-20250620';
        this.client = anthropicApiKey
            ? new Anthropic({ apiKey: anthropicApiKey })
            : null;
    }

    async scan(image, mimeType) {
        if (!image) {
            throw AppError.badRequest('Brak obrazu do przetworzenia.');
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            throw AppError.unprocessable('Nieobsługiwany format obrazu.');
        }

        const sizeBytes = Buffer.byteLength(image, 'base64');
        if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
            throw new AppError('Zdjęcie jest za duże. Maksymalny rozmiar to 5 MB.', 413);
        }

        if (!this.client) {
            throw new AppError('Usługa OCR jest tymczasowo niedostępna.', 502);
        }

        const categories = await this.categoryModel.findAll({ orderBy: 'name' });
        const categoryList = categories.map(c => `- ${c.id}: ${c.name}`).join('\n');

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mimeType,
                                    data: image,
                                },
                            },
                            {
                                type: 'text',
                                text: `Analyze this receipt image and extract the following information as JSON:

{
  "amount": <total amount as a number, or null if unreadable>,
  "expense_date": "<YYYY-MM-DD date from the receipt, or null if unreadable>",
  "description": "<merchant name or short summary, or null if not detected>",
  "category_id": "<best matching category UUID from the list below, or null if unsure>",
  "confidence": <0.0 to 1.0 indicating overall parse confidence>,
  "raw_text": "<full recognized text from the receipt>"
}

Available categories:
${categoryList}

Rules:
- Return ONLY valid JSON, no markdown or explanation.
- amount should be the final total (look for "SUMA", "RAZEM", "DO ZAPŁATY", "TOTAL").
- expense_date in YYYY-MM-DD format.
- description should be the merchant/store name.
- category_id must be one of the UUIDs listed above, or null.
- If the image is blank, blurry, or not a receipt, return all fields as null with confidence 0.0.`,
                            },
                        ],
                    },
                ],
            });

            const text = response.content[0]?.text || '';
            return this.#parseResponse(text);
        } catch (err) {
            if (err instanceof AppError) throw err;
            console.error('[ocr] Claude API error:', err.message);
            throw new AppError('Usługa OCR jest tymczasowo niedostępna.', 502);
        }
    }

    #parseResponse(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return this.#emptyResult();

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                amount: typeof parsed.amount === 'number' ? parsed.amount : null,
                category_id: parsed.category_id || null,
                expense_date: parsed.expense_date || null,
                description: parsed.description || null,
                confidence: typeof parsed.confidence === 'number'
                    ? Math.min(1, Math.max(0, parsed.confidence))
                    : 0,
                raw_text: parsed.raw_text || null,
            };
        } catch {
            return this.#emptyResult();
        }
    }

    #emptyResult() {
        return {
            amount: null,
            category_id: null,
            expense_date: null,
            description: null,
            confidence: 0,
            raw_text: null,
        };
    }
}

module.exports = OcrService;
