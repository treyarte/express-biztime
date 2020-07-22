process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
  //cant use double quotes because postgres use double quotes to mean column
  const result = await db.query(
    `INSERT INTO companies ("code", "name", "description") VALUES ($1, $2, $3)
    RETURNING code, name, description`,
    [
      'sam',
      "Sam's Club",
      "Sam's West, Inc. is an American chain of membership-only retail warehouse clubs owned and operated by Walmart Inc.",
    ]
  );

  testCompany = result.rows[0];
});

describe('/GET companies', () => {
  test('Return a list of companies', async () => {
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe('/GET companies/code', () => {
  test('Return a single company', async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: testCompany });
  });

  test('Return 404 when company is not found', async () => {
    const res = await request(app).get('/companies/IDONTEXISTCODE');
    expect(res.statusCode).toBe(404);
  });
});

describe('/POST companies', () => {
  test('Create a single company', async () => {
    const newCompany = {
      code: 'banco',
      name: 'Bandia Namco',
      description: `Bandai Namco Entertainment Inc. is a 
                      Japanese multinational video game developer and publisher`,
    };
    const res = await request(app).post('/companies').send(newCompany);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ company: newCompany });
  });
});

describe('/PUT companies/code', () => {
  test('Update a single company', async () => {
    const res = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: 'test', description: 'test' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: `${testCompany.code}`,
        name: 'test',
        description: 'test',
      },
    });
  });

  test('Return 404 on invalid company update', async () => {
    const res = await request(app)
      .put(`/companies/NoExist`)
      .send({ name: 'test', description: 'test' });

    expect(res.statusCode).toBe(404);
  });
});

describe('/DELETE companies', () => {
  test('Delete a company from the database', async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: 'Company Deleted' });
  });

  test('Try to delete a invalid company', async () => {
    const res = await request(app).delete(`/companies/NOEXIST`);
    expect(res.statusCode).toBe(404);
  });
});

afterEach(async () => {
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.end();
});
