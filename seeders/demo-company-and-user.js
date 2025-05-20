'use strict';

// Used AI to generate this code
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert a company
    const [company] = await queryInterface.bulkInsert('companies', [{
      name: 'Demo Company',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    // Insert a user
    await queryInterface.bulkInsert('users', [{
      name: 'Demo User',
      role: 'accountant', // or whatever role is valid
      companyId: company.id || 1, // fallback to 1 if returning doesn't work
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Demo User 2',
      role: 'corporateSecretary', // or whatever role is valid
      companyId: company.id || 1, // fallback to 1 if returning doesn't work
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('companies', null, {});
  }
};
