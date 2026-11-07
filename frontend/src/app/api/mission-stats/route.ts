import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/db';

export const dynamic = 'force-static';


export async function GET() {
  let engineStatus = 'idle';

  // Read local engine status file if available
  const projectRoot = path.join(process.cwd(), '..');
  const statusFile = path.join(projectRoot, '.engine_status.json');
  try {
    const fileContent = await fs.readFile(statusFile, 'utf8');
    const parsed = JSON.parse(fileContent);
    if (parsed && typeof parsed.status === 'string') {
      engineStatus = parsed.status; // 'idle', 'running', 'success', 'error'
    }
  } catch {
    engineStatus = 'idle';
  }

  // Get real-time database counts
  try {
    const rawCount = await db.execute("SELECT COUNT(*) as count FROM rawpost");
    const validCount = await db.execute("SELECT COUNT(*) as count FROM validatedpainpoint");
    
    const phSearchedCount = await db.execute("SELECT COUNT(*) as count FROM marketvalidation");
    const pendingCount = await db.execute("SELECT COUNT(*) as count FROM marketvalidation WHERE recommendation_light = 'PENDING'");
    const blueOceanCount = await db.execute("SELECT COUNT(*) as count FROM marketvalidation WHERE recommendation_light = 'GREEN'");
    const redOceanCount = await db.execute("SELECT COUNT(*) as count FROM marketvalidation WHERE recommendation_light = 'RED'");
    
    const totalValidated = Number(phSearchedCount.rows[0]?.count || 0);
    const totalPending = Number(pendingCount.rows[0]?.count || 0);
    const completedScoring = Math.max(0, totalValidated - totalPending);

    const counts = {
      posts: Number(rawCount.rows[0]?.count || 0),
      painPoints: Number(validCount.rows[0]?.count || 0),
      phSearched: totalValidated,
      blueOceans: Number(blueOceanCount.rows[0]?.count || 0),
      redOceans: Number(redOceanCount.rows[0]?.count || 0),
      completedScoring
    };

    // If no pending items left and we have validated items, mark status as success
    if (totalValidated > 0 && totalPending === 0) {
      engineStatus = 'success';
    }

    let currentStage = 0;
    if (counts.phSearched > 0) currentStage = 1;
    if (counts.completedScoring > 0 || engineStatus === 'success') currentStage = 2;

    let percentage = 0;
    if (engineStatus === 'success') {
      percentage = 100;
    } else if (engineStatus === 'running') {
      if (currentStage === 0) {
        percentage = 25;
      } else if (currentStage === 1) {
        percentage = 60;
      } else if (currentStage === 2) {
        const scoringPct = totalValidated > 0
          ? Math.round((completedScoring / totalValidated) * 40)
          : 0;
        percentage = totalPending === 0 ? 100 : Math.min(99, 60 + scoringPct);
        if (percentage >= 100) {
          engineStatus = 'success';
        }
      }
    }

    return NextResponse.json({
      status: engineStatus,
      currentStage,
      percentage,
      counts
    });
    
  } catch {
    return NextResponse.json({
      status: engineStatus,
      currentStage: 0,
      percentage: engineStatus === 'success' ? 100 : 0,
      counts: { posts: 0, painPoints: 0, phSearched: 0, blueOceans: 0, redOceans: 0, completedScoring: 0 }
    });
  }
}
