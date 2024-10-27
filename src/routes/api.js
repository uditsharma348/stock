const express = require('express');
const Stock = require('../model/stock');
const router = express.Router();

// API 1: Highest Volume
router.get('/highest_volume', async (req, res) => {
    try {
        const { start_date, end_date, symbol } = req.query;

        // Validate that start_date and end_date are provided
        if (!start_date || !end_date) {
            return res.status(400).json({ error: "Start date and end date are required" });
        }

        // Convert start_date and end_date to Date objects and validate
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }

        // Construct the query with the date range and optional symbol filter
        const query = {
            date: { $gte: startDate, $lte: endDate },
            ...(symbol && { symbol }),
        };

        // Find the record with the highest volume within the date range (and symbol, if provided)
        const record = await Stock.findOne(query).sort({ volume: -1 });

        // Check if a record was found and respond accordingly
        if (record) {
            res.json({ highest_volume: { date: record.date, symbol: record.symbol, volume: record.volume } });
        } else {
            res.status(404).json({ message: 'No data found for the specified criteria' });
        }
    } catch (error) {
        console.error("Error in /highest_volume endpoint:", error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});


// API 2: Average Close
router.get('/average_close', async (req, res) => {
    const { start_date, end_date, symbol } = req.query;
    // Validate that start_date and end_date are provided
    if (!start_date || !end_date || !symbol) {
        return res.status(400).json({ error: "Start date, end date and symbol are required" });
    }

    // Convert start_date and end_date to Date objects and validate
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    // Construct the query with the date range and optional symbol filter
    const query = {
        date: { $gte: new Date(start_date), $lte: new Date(end_date) },
        symbol,
    };
    const avgClose = await Stock.aggregate([
        { $match: query },
        { $group: { _id: null, averageClose: { $avg: "$close" } } }
    ]);
    res.json({ average_close: Number(avgClose[0]?.averageClose.toFixed(2)) || 0 });
});

// API 3: Average VWAP
router.get('/average_vwap', async (req, res) => {
    const { start_date, end_date, symbol } = req.query;
    // Validate that start_date and end_date are provided
    if (!start_date || !end_date) {
        return res.status(400).json({ error: "Start date and end date are required" });
    }

    // Convert start_date and end_date to Date objects and validate
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Construct the query with the date range and optional symbol filter
    const query = {
        date: { $gte: new Date(start_date), $lte: new Date(end_date) },
        ...(symbol && { symbol }),
    };
    const avgVwap = await Stock.aggregate([
        { $match: query },
        { $group: { _id: null, averageVwap: { $avg: "$vwap" } } }
    ]);
    res.json({ average_vwap: Number(avgVwap[0]?.averageVwap.toFixed(2)) || 0 });
});

module.exports = router;
