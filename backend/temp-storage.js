// temporary in-memory storage until MongoDB is set up
const users = [
    {
        _id: '1',
        phoneNumber: '0776384481',
        firstName: 'John',
        lastName: 'Doe', 
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        lastLogin: new Date()
    },
    {
        _id: '2', 
        phoneNumber: '1234567890',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com', 
        role: 'user',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        lastLogin: new Date()
    }
];

const farms = [];

module.exports = {
    users,
    farms
};