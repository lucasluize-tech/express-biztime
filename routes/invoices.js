const express = require("express");
const router = express.Router()
const db = require("../db")
const app = require("../app");
const { route } = require("../app");

router.get('/', async function(req, res, next){
    try {
        const invoices = await db.query("SELECT * FROM invoices")
        return res.send({invoices: invoices.rows})
    } catch (e) {
        next(e)
    }
})

router.get('/:id', async function (req, res, next) {
    try {
        const {id} = req.params
        const invoice = await db.query("SELECT * FROM invoices WHERE id=$1", [id])
        const company = await db.query("SELECT * FROM companies WHERE code=$1", [invoice.rows[0].comp_code])
        if (invoice.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
          }
        return res.json({invoice: invoice.rows[0], company: company.rows[0]})
    } catch (e) {
        next(e)
    }
})

router.post('/', async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body
        const newInvoice = await db.query("INSERT INTO invoices(comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date", [comp_code, amt])
        if (!comp_code || !amt) {
            throw new ExpressError(`needs a comp_code and amt`, 404)
        }
        res.status(201).json({invoice: newInvoice.rows[0]})
    } catch (e) {
        next(e)
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const { id } = req.params
        const { amt } = req.body
        const result = await db.query('UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
        }
        return res.status(200).json({ invoice: result.rows[0] })
    } catch (e) {
        next(e)
    }
})

router.delete('/:id', async function (req, res, next) {
    try {
        const { id } = req.params
        const result = await db.query('DELETE FROM invoices WHERE id=$1', [id])
        if (!result) {
            throw new ExpressError(`Can't delete company with id of ${id}`, 404)
        }
        return res.json({status: "deleted"})
    } catch (e) {
        next(e)
    }
})

module.exports = router;