// fallback-user.js - In-memory user service when MongoDB is not available

const tempStorage = require('./temp-storage');

class FallbackUserService {
    static findByPhoneNumber(phoneNumber) {
        return tempStorage.users.find(user => user.phoneNumber === phoneNumber) || null;
    }

    static findById(id) {
        return tempStorage.users.find(user => user._id === id) || null;
    }

    static create(userData) {
        const newUser = {
            _id: String(tempStorage.users.length + 1),
            ...userData,
            createdAt: new Date(),
            lastLogin: null
        };
        tempStorage.users.push(newUser);
        return newUser;
    }

    static updateLastLogin(userId) {
        const user = this.findById(userId);
        if (user) {
            user.lastLogin = new Date();
        }
        return user;
    }

    static updateById(userId, updateData) {
        const user = this.findById(userId);
        if (user) {
            Object.assign(user, updateData);
        }
        return user;
    }

    static getAllUsers() {
        return tempStorage.users;
    }
}

module.exports = FallbackUserService;