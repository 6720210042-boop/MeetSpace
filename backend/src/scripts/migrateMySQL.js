const mysqlDB = require("../db/mysql");

async function migrate() {
  try {
    await mysqlDB.init();
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
