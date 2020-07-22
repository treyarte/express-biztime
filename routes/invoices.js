const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    res.status(201).json({ invoice: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, code, name, description 
      FROM invoices JOIN companies ON companies.code = invoices.comp_code WHERE id = $1`,
      [id]
    );

    if (results.rows.length === 0)
      throw new ExpressError(`Cannot find invoice with the id: ${id}`, 404);

    const {
      id: invoice_id,
      amt,
      paid,
      add_date,
      paid_date,
      code,
      name,
      description,
    } = results.rows[0];

    const invoice = {
      id: invoice_id,
      amt,
      paid,
      add_date: add_date.toUTCString(),
      paid_date,
    };
    const company = { code, name, description };

    invoice.company = company;
    return res.json({ invoice: invoice });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );

    if (results.rows.length === 0)
      throw new ExpressError(`Cannot update invoice with id: ${id}`, 404);

    return res.json({ invoice: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const results1 = await db.query('SELECT * FROM invoices WHERE id=$1', [id]);

    if (results1.rows.length === 0)
      throw new ExpressError(`Cannot delete invoice with id: ${id}`, 404);

    const results = await db.query('DELETE FROM invoices WHERE id=$1', [id]);

    return res.json({ status: 'deleted' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
