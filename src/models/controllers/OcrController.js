'use strict';

class OcrController {
    constructor({ ocrService }) {
        this.ocrService = ocrService;
    }

    // Returns the raw OcrScanResult (NOT wrapped in { data }) because the client
    // maps the response straight into an expense draft.
    scan = async (req, res) => {
        const { image, mimeType } = req.body;
        const result = await this.ocrService.scan({ image, mimeType });
        res.json(result);
    };
}

module.exports = OcrController;
