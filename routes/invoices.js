const express = require("express");
const router = express.Router()
const db = require("../db")
const app = require("../app");
const ExpressError = require("../expressError")

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
        if (invoice.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }
        const company = await db.query("SELECT * FROM companies WHERE code=$1", [invoice.rows[0].comp_code])
        
        return res.json({invoice: invoice.rows[0], company: company.rows[0]})
    } catch (e) {
        next(e)
    }
})

router.post('/', async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body
        if (!comp_code || !amt) {
            throw new ExpressError(`needs a comp_code and amt`, 404)
        }
        const newInvoice = await db.query("INSERT INTO invoices(comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date", [comp_code, amt])
        res.status(201).json({invoice: newInvoice.rows[0]})
    } catch (e) {
        next(e)
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const { id } = req.params
        const { amt, paid } = req.body
        console.log(`AMT:${amt}, PAID: ${paid}`)
        // check if amt and paid are correctly passed.
        if (amt < 0 ) {
            throw new ExpressError(`Needs an amt and paid variables`, 404)
        }
        // find the invoice
        let invoice = await db.query('SELECT * FROM invoices WHERE id = $1', [id])
        console.log("INVOICE:", invoice.rows[0])
        // check if invoice exists
        if (invoice.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
        }
        // calculate the payment
        let total = (+amt > 0) ? invoice.rows[0].amt -= +amt: invoice.rows[0].amt += +amt
        
        let today = new Date(Date.now()).toISOString()

        // if paying unpaid invoice
        if (invoice.rows[0].paid === false && paid === true) {
            const result = await db.query(`
            UPDATE invoices
            SET paid_date=$2, paid=$3
            WHERE id = $1
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [id, today, paid])
            result.rows[0].amt_left = total
            return res.status(200).json({ invoice: result.rows[0] })

        // if un-paying invoice
        } else if (invoice.rows[0].paid === true && paid === false) {
            const result = await db.query(`
            UPDATE invoices
             SET paid_date=$2, paid=$3
             WHERE id=$1
             RETURNING id, comp_code, amt, paid, add_date, paid_date`, [id, null, paid])
            
            return res.status(200).json({ invoice: result.rows[0] })
        
        // if nothing changes
        } else if(invoice.rows[0].paid === paid){
            const result = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id])
            return res.status(200).json({ invoice: result.rows[0] })
        }

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