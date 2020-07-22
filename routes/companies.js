const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const { route } = require('../app');
const e = require('express');

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(
      'SELECT code, name, description FROM companies'
    );

    return res.json({ companies: results.rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    debugger;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      'SELECT code, name, description FROM companies WHERE code = $1',
      [code]
    );

    if (results.rows.length === 0)
      throw new ExpressError(`Company with code ${code} cannot be found`, 404);

    return res.json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;
    debugger;
    const results = await db.query(
      'UPDATE companies SET name=$1, description=$2 WHERE code = $3 RETURNING code, name, description',
      [name, description, code]
    );

    if (results.rows.length === 0)
      throw new ExpressError(`Company with code ${code} cannot be found`, 404);

    return res.json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    debugger;
    const results2 = await db.query(`SELECT * FROM companies WHERE code=$1`, [
      code,
    ]);

    if (results2.rows.length === 0)
      throw new ExpressError(`Cannot delete Company with code ${code}`, 404);

    const results = await db.query(`DELETE FROM companies WHERE code=$1`, [
      code,
    ]);

    return res.json({ msg: 'Company Deleted' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
