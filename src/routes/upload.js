const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const Stock = require('../model/stock');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file || req.file.mimetype !== 'text/csv') {
        return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    let totalRecords = 0;
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors = [];
    const promises = [];  // Array to hold promises for each row operation

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            totalRecords++;

            const validation = validateRow(row);
            if (validation.isValid) {
                const promise = new Stock(validation.data).save()
                    .then(() => {
                        successfulRecords++;
                    })
                    .catch(() => {
                        errors.push({ row, error: 'Database insertion error' });
                        failedRecords++;
                    });

                promises.push(promise); // Add each promise to the array
            } else {
                errors.push({ row, error: validation.errors });
                failedRecords++;
            }
        })
        .on('end', async () => {
            await Promise.all(promises);  // Wait for all promises to resolve

            res.json({
                totalRecords,
                successfulRecords,
                failedRecords,
                errors,
            });

            fs.unlinkSync(req.file.path); // Delete the uploaded file after processing
        });
});


function validateRow(row) {
    const errors = [];
    const validData = {
        date: new Date(row.Date),
        symbol: row.Symbol,
        series: row.Series,
        prev_close: parseFloat(row['Prev Close']),
        open: parseFloat(row.Open),
        high: parseFloat(row.High),
        low: parseFloat(row.Low),
        last: parseFloat(row.Last),
        close: parseFloat(row.Close),
        vwap: parseFloat(row.VWAP),
        volume: parseInt(row.Volume, 10),
        turnover: parseFloat(row.Turnover),
        trades: parseInt(row.Trades, 10),
        deliverable: parseInt(row['Deliverable Volume'], 10),
        percent_deliverable: parseFloat(row['%Deliverble']),
    };

    if (isNaN(Date.parse(row.Date))) errors.push('Invalid Date format');
    ['Prev Close', 'Open', 'High', 'Low', 'Last', 'Close', 'VWAP', 'Volume', 'Turnover', 'Trades', 'Deliverable Volume', '%Deliverble'].forEach((key) => {
        if (isNaN(parseFloat(row[key]))) errors.push(`Invalid number in ${key}`);
    });

    return {
        isValid: errors.length === 0,
        data: validData,
        errors,
    };
}

module.exports = router;
