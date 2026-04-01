// app/api/admin/migrate-users/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        // 1. MongoDB se connect karein
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI as string);
        }

        // 2. MongoDB ka User model define karein (jaise purane project mein tha)
        const userSchema = new mongoose.Schema({
            name: String,
            email: String
        }, { strict: false });
        
        const MongoUser = mongoose.models.User || mongoose.model('User', userSchema);

        // 3. MongoDB se saare users fetch karein
        const mongoUsers = await MongoUser.find({});

        if (mongoUsers.length === 0) {
            return NextResponse.json({ message: "No users found in MongoDB" }, { status: 404 });
        }

        // 4. Data ko Neon (PostgreSQL) mein insert karein
        let migratedCount = 0;
        for (const user of mongoUsers) {
            // MongoDB mein strict: false tha, toh email/name missing ho sakta hai
            if (!user.email || !user.name) continue;

            // Check karein ki user pehle se Neon mein toh nahi hai (Duplicate se bachne ke liye)
            const exists = await prisma.user.findUnique({ where: { email: user.email } });
            
            if (!exists) {
                await prisma.user.create({
                    data: {
                        name: user.name,
                        email: user.email
                    }
                });
                migratedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${migratedCount} users successfully migrated from MongoDB to Neon PostgreSQL!` 
        });

    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ error: "Failed to migrate data" }, { status: 500 });
    }
}