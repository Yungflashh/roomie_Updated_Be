"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const Admin_1 = __importDefault(require("../models/Admin"));
async function seed() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
    console.log('Connecting to MongoDB...');
    await mongoose_1.default.connect(mongoURI);
    console.log('Connected.');
    const admins = [
        {
            firstName: 'David',
            lastName: 'Adenusi',
            email: 'superadmin@roomie.com',
            password: 'Roomie@Admin2026!',
            role: 'super_admin',
        },
    ];
    for (const admin of admins) {
        const existing = await Admin_1.default.findOne({ email: admin.email });
        if (existing) {
            console.log(`  [skip] ${admin.email} already exists`);
            continue;
        }
        const hashedPassword = await bcryptjs_1.default.hash(admin.password, 12);
        await Admin_1.default.create({
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            password: hashedPassword,
            role: admin.role,
            isActive: true,
        });
        console.log(`  [added] ${admin.email} (${admin.role})`);
    }
    console.log('\nDone. Admin credentials:');
    console.log('  Email: superadmin@roomie.com');
    console.log('  Password: Roomie@Admin2026!');
    console.log('\n  CHANGE THIS PASSWORD AFTER FIRST LOGIN!\n');
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map