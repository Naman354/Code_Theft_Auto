// app/api/admin/generate-teams/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Array ko randomize karne ke liye function
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function POST(req: Request) {
    try {
        // Frontend ya Postman se teamSize read karo (Default 4 rakha hai agar aap kuch nahi bhejte)
        const body = await req.json().catch(() => ({})); 
        const targetTeamSize = parseInt(body.teamSize, 10) || 4; 

        // 1. Neon se saare unassigned users ko fetch karo
        const unassignedUsers = await prisma.user.findMany({
            where: { teamId: null }
        });
        
        const totalUsers = unassignedUsers.length;

        if (totalUsers < targetTeamSize) {
            return NextResponse.json({ error: `Not enough students! Need at least ${targetTeamSize} to form a team.` }, { status: 400 });
        }

        // 2. Users ko shuffle karo
        const shuffledUsers = shuffleArray([...unassignedUsers]);

        // 3. Dynamic Chunking Logic (Students ko Target Size ke groups mein baantna)
        const teamChunks: any[][] = [];
        for (let i = 0; i < shuffledUsers.length; i += targetTeamSize) {
            teamChunks.push(shuffledUsers.slice(i, i + targetTeamSize));
        }

        // Agar aakhri team mein bacche kam reh gaye (e.g., 2 ki team banani thi, 1 bach gaya)
        // Toh us akele bacche ko kisi aur team mein daal do taaki wo akela na khele
        if (teamChunks.length > 1 && teamChunks[teamChunks.length - 1].length < Math.max(2, targetTeamSize - 1)) {
            const lastSmallChunk = teamChunks.pop(); // Aakhri choti team hatao
            
            // Un bache hue students ko pehli bani hui teams mein ek-ek karke baant do
            let distributeIndex = 0;
            if (lastSmallChunk) {
                for (const user of lastSmallChunk) {
                    teamChunks[distributeIndex % teamChunks.length].push(user);
                    distributeIndex++;
                }
            }
        }

        // 4. Database mein Teams create karna
        const createdTeams = [];

        for (let i = 0; i < teamChunks.length; i++) {
            const teamMembers = teamChunks[i];
            const accessCode = `GTA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const newTeam = await prisma.team.create({
                data: {
                    teamName: `Phantom_Squad_${Math.floor(Math.random() * 9000) + 1000}`,
                    accessCode: accessCode,
                    members: {
                        connect: teamMembers.map((user: any) => ({ id: user.id }))
                    }
                }
            });

            createdTeams.push({
                teamName: newTeam.teamName,
                size: teamMembers.length
            });
        }

        return NextResponse.json({
            success: true,
            message: `${teamChunks.length} teams generated successfully!`,
            targetSizeRequested: targetTeamSize,
            teamsCreated: createdTeams
        });

    } catch (error) {
        console.error("Team Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate teams" }, { status: 500 });
    }
}