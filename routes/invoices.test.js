process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { createTestCompany } = require('./test_utils');

let testInvoice;
let testCompany;

beforeEach(async () => {
  testCompany = await createTestCompany(db);
  const res = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ($1, $2, $3, $4)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [testCompany.code, 2500, false, null]
  );

  testInvoice = res.rows[0];
});

describe('/GET invoices', () => {
  test('should get a list of invoices', async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [{ id: expect.any(Number), comp_code: testInvoice.comp_code }],
    });
  });
});

describe('/GET invoices/:id', () => {
  test('should get a single invoice', async () => {
    const { id, amt, paid, add_date, paid_date } = testInvoice;

    const res = await request(app).get(`/invoices/${id}`);

    expect(res.statusCode).toBe(200);

    const invoice = {
      id,
      amt,
      paid,
      add_date: add_date.toUTCString(),
      paid_date,
    };
    invoice.company = testCompany;
    expect(res.body).toEqual({
      invoice,
    });
  });

  test('should return 404 for invalid invoices', async () => {
    const res = await request(app).get('/invoices/0');
    expect(res.statusCode).toBe(404);
  });
});

describe('/POST invoice', () => {
  test('should create a new invoice', async () => {
    const newInvoice = {
      comp_code: testCompany.code,
      amt: 200,
    };
    const res = await request(app).post('/invoices').send(newInvoice);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: newInvoice.comp_code,
        amt: newInvoice.amt,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
});

describe('/PUT invoices', () => {
  test('should update an invoice', async () => {
    const res = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 100 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 100,
        paid: testInvoice.paid,
        add_date: expect.any(String),
        paid_date: testInvoice.paid_date,
      },
    });
  });

  test('should go to 404 if invalid invoice', async () => {
    const res = await request(app).put(`/invoices/0`).send({ amt: 0 });
    expect(res.statusCode).toBe(404);
  });
});

describe('/DELETE invoices', () => {
  test('should delete an invoice', async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'deleted' });
  });

  test('should 404 if invalid invoice', async () => {
    const res = await request(app).delete('/invoices/0');
    expect(res.statusCode).toBe(404);
  });
});

afterEach(async () => {
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM invoices');
});

afterAll(async () => {
  await db.end();
});
