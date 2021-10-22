const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');
const { route } = require('./companies');
const router = express.Router();

// list all industries , and show the company code for each.
router.get('/', async (req, res, next) => {
    try {
        
        const results= await db.query(`
        SELECT i.code, i.industry, c.code as comp_code
         FROM industries AS i
         LEFT JOIN company_industry AS ci
         ON i.code = ci.ind_code
         LEFT JOIN companies AS c
         ON ci.comp_code = c.code`)
        
        return res.send(results.rows)
    } catch (err) {
        next(err);
    }
})

// add an industry
router.post('/', async (req, res, next) => {
    try {
        let { code, industry } = req.body;
        code = code.toLowerCase();
        if (!code || !industry) {
            throw new ExpressError("Needs a code and a industry parameters", 404)
        }

        const newIndustry = await db.query(`
        INSERT INTO industries (code, industry)
        VALUES ($1, $2)
        RETURNING code, industry`, [code, industry])
        
        return res.status(201).json({industry: newIndustry.rows[0]})
    } catch (err) {
        next(err);
    }
})

router.post('/add-company', async (req, res, next) => {
    try {
        let { comp_code, ind_code } = req.body;
        if (!comp_code || !ind_code) {
            throw new ExpressError(`Needs a comp_code and a ind_code as strings parameters`, 404)
        }
        const result = await db.query(`
        INSERT INTO company_industry (comp_code, ind_code)
        VALUES ($1, $2)
        RETURNING comp_code, ind_code`, [comp_code, ind_code])
        return res.status(201).json({ Associated : result.rows[0] })
    } catch (e) {
        next(e)
    }
})
module.exports = router;