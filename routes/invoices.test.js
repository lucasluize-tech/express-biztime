const request = require('supertest')

process.env.NODE_ENV = 'test'

const app = require('../app')
const db = require('../db')

let testInvoice;
let testComp;
beforeAll(async () => {
    await db.query("INSERT INTO companies (code,name, description) VALUES ('pinard','Pinard Nursery','Helping kids rule the World')")
})
beforeEach(async ()=> {
    await db.query("DELETE FROM invoices")
    const invoice = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('pinard', 2500) RETURNING id, comp_code, amt, paid, add_date, paid_date")
    const comp = await db.query("SELECT * FROM companies WHERE code=$1", [invoice.rows[0].comp_code])
    testInvoice = invoice.rows[0]
    testComp = comp.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
  })
  
afterAll(async () => {
    await db.query("DELETE FROM companies")
    await db.end()
  })

describe('/GET route', function () {
    test("get all invoices", async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200);
        testInvoice.add_date = testInvoice.add_date.toISOString()
        expect(res.body).toEqual({invoices: [testInvoice]})
    })
    
    test("get single invoice with id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        testInvoice.add_date = testInvoice.add_date.toISOString()
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoice: testInvoice, company: testComp})
    })
})
  
describe('/POST route', function () {
    test("Create new invoice", async () => {
        const res = await request(app).post("/invoices").send({
            comp_code: "pinard",
            amt: "3000"
        })
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({invoice: {add_date: expect.any(String), amt: 3000, comp_code: "pinard", id: expect.any(Number), "paid": false, "paid_date": null}})
    })

    test("Create invoice with no params", async () => {
        const res = await request(app).post("/invoices").send({
            amt: "3000"
        })
        expect(res.statusCode).toBe(404)
    })
})

describe('/PUT route', function () {
    // skipped to elaborate after more inputs from exercise
    test.skip("Edit a invoice with id", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: "2000" })
        expect(res.statusCode).toBe(200)
        testInvoice.amt = 2000
        expect(res.body).toEqual({ invoice: testInvoice })
    })
    
    test("Edit with invalid id", async () => {
        const res = await request(app).put(`/invoices/10`).send({ amt: "1000", "paid" : true })
        expect(res.statusCode).toBe(404)
    })
})

describe('/DELETE route', function () {
    test("Delete invoice with id", async () => {
        const allInv = await db.query(`
        SELECT count(*)
        FROM invoices`)
        const res = await request(app).delete(`/invoices/${testInvoice.id}`)
        const allInvoices = await db.query(`
        SELECT count(*)
        FROM invoices`)
        
        expect(allInvoices.rows[0].count).not.toEqual(allInv.rows[0].count)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: "deleted"})
    })
})