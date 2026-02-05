require('dotenv').config();
const { connectDB } = require('../config/database-mysql');
const { User } = require('../models');

const seedAdmin = async () => {
    try {
        await connectDB();
        console.log('🌱 Checking for Admin user...');

        const adminEmail = 'admin@phokela.com';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('✅ Admin user already exists.');
            // Optional: Update password if needed, but for now just exit.
            // existingAdmin.password = '$2b$10$Tt3fVdp1Mt9KwpatzDcAOO/fzJT/mnHpNB4VHwytx1OgFHqWLMjsK';
            // await existingAdmin.save();
            process.exit(0);
        }

        console.log('Creating Admin user...');
        await User.create({
            email: adminEmail,
            password: 'admin123',
            fullName: 'System Administrator',
            role: 'admin',
            active: true
        });

        console.log('✅ Admin user created successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Failed to seed admin:', error);
        process.exit(1);
    }
};

seedAdmin();
