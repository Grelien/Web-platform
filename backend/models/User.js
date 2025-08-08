// models/User.js - Simple file-based user storage

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

class User {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.email = data.email;
        this.password = data.password; // Already hashed
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.role = data.role || 'user'; // user, admin
    }

    generateId() {
        return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    toJSON() {
        // Don't include password in JSON serialization
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    // Static methods for data operations
    static async loadUsers() {
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return empty array
                return [];
            }
            throw error;
        }
    }

    static async saveUsers(users) {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }

    static async findByEmail(email) {
        const users = await this.loadUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    static async findById(id) {
        const users = await this.loadUsers();
        return users.find(user => user.id === id);
    }

    static async create(userData) {
        const users = await this.loadUsers();
        
        // Check if user already exists
        const existingUser = users.find(user => 
            user.email.toLowerCase() === userData.email.toLowerCase()
        );
        
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const newUser = new User(userData);
        users.push(newUser);
        await this.saveUsers(users);
        
        return newUser;
    }

    static async updateById(id, updateData) {
        const users = await this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            return null;
        }

        // Update user data
        users[userIndex] = { ...users[userIndex], ...updateData };
        await this.saveUsers(users);
        
        return users[userIndex];
    }

    static async deleteById(id) {
        const users = await this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            return false;
        }

        users.splice(userIndex, 1);
        await this.saveUsers(users);
        
        return true;
    }

    static async getAllUsers() {
        const users = await this.loadUsers();
        // Return users without passwords
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    static async updateLastLogin(id) {
        return await this.updateById(id, { 
            lastLogin: new Date().toISOString() 
        });
    }

    // Validation methods
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 50;
    }
}

module.exports = User;
