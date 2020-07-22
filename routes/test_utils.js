async function createTestCompany(db) {
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
  return result.rows[0];
}

module.exports = {
  createTestCompany,
};
