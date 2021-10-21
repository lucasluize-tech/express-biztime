const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router()
const db = require("../db")



router.get('/', async function(req, res, next){
    try {
        const companies = await db.query("SELECT * FROM companies")
        return res.send({companies: companies.rows})
    } catch (e) {
        next(e)
    }
})

router.get('/:code', async function (req, res, next) {
    try {
        const {code} = req.params
        const company = await db.query("SELECT * FROM companies WHERE code=$1", [code])
        const invoices = await db.query("SELECT * FROM invoices WHERE comp_code=$1", [code])
        if (company.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        
        return res.json({company : company.rows[0], invoices:invoices.rows })
    } catch (e) {
        next(e)
    }
})

router.post('/', async function (req, res, next) {
    try {
        const { code, name, description } = req.body
        const newcompany = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description])
        if (!code || !name || !description) {
            throw new ExpressError(`needs a code, name and description ${code}`, 404)
        }
        res.status(201).json({company: newcompany.rows[0]})
    } catch (e) {
        next(e)
    }
})

router.put('/:code', async function (req, res, next) {
    try {
        const { code } = req.params
        const { name, description } = req.body
        const result = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404)
        }
        return res.status(200).json({ company: result.rows[0] })
    } catch (e) {
        next(e)
    }
})

router.delete('/:code', async function (req, res, next) {
    try {
        const { code } = req.params
        const result = await db.query('DELETE FROM companies WHERE code=$1', [code])
        if (!result === 0) {
            throw new ExpressError(`Can't delete company with code of ${code}`, 404)
        }
        return res.json({status: "deleted"})
    } catch (e) {
        next(e)
    }
})

module.exports = router;