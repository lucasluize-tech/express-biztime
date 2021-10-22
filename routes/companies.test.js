const request = require('supertest')

process.env.NODE_ENV = 'test'

const app = require('../app')
const db = require('../db')

let testInvoice;
let testComp;



beforeEach(async ()=> {
    await db.query("DELETE FROM companies")
    const comp = await db.query("INSERT INTO companies (code,name, description) VALUES ('pinard','Pinard Nursery','Helping kids rule the World') RETURNING code, name, description")
  
    testComp = comp.rows[0]
    
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
  })
  
afterAll(async () => {
    await db.end()
  })

describe('/GET route', function () {
    test("get all companies", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: [testComp]})
    })
    
    test("get single company with code", async () => {
        const res = await request(app).get(`/companies/${testComp.code}`)
        
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company : testComp, invoices: []})
    })
})
  
describe('/POST route', function () {
    test("Create new company", async () => {
        const res = await request(app).post("/companies").send({
            code: "cia",
            name: "CIA",
            description: "security agency"
        })
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({company: {
            code: "cia",
            name: "CIA",
            description: "security agency"
        }})
    })

    test("Create company with no params", async () => {
        const res = await request(app).post("/companies").send({
            amt: "3000"
        })
        expect(res.statusCode).toBe(404)
    })
})

describe('/PUT route', function () {
    test("Edit a company with code", async () => {
        const res = await request(app).put(`/companies/${testComp.code}`).send({ name: "Pinard School", description: "The very best" })
        expect(res.statusCode).toBe(200)
        testComp.name = "Pinard School"
        testComp.description = "The very best"
        expect(res.body).toEqual({ company: testComp })
    })
    
    test("Edit with invalid code", async () => {
        const res = await request(app).put(`/companies/10`).send({ name: "1oY" })
        expect(res.statusCode).toBe(404)
    })
})

describe('/DELETE route', function () {
    test("Delete company with code", async () => {
        const res = await request(app).delete(`/companies/${testComp.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: "deleted"})
    })
})