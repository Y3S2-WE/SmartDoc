const User = require('../models/User');
const { ROLES } = require('../config/constants');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || 'SmartDoc Admin';
  const phoneNumber = process.env.ADMIN_PHONE || '+94000000000';

  if (!email || !password) {
    console.warn('Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing');
    return;
  }

  const existingAdmin = await User.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  await User.create({
    fullName,
    email,
    password,
    phoneNumber,
    role: ROLES.ADMIN,
    isActive: true
  });

  console.log(`Seeded admin user: ${email}`);
};

module.exports = seedAdmin;

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');

  connectDB()
    .then(seedAdmin)
    .then(() => {
      console.log('Admin seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Admin seed failed:', error.message);
      process.exit(1);
    });
}
