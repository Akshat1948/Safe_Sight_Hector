import * as readline from 'readline';

/**
 * SafeSight — SIH 2026 Scenario B Live Demo Simulator
 * Automates real-time crowd crush precursor simulation for hackathon presentations.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

// ANSI terminal colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgGreen: '\x1b[42m',
};

// Parse command-line arguments
const args = process.argv.slice(2);
const isReset = args.includes('--reset');
const isFast = args.includes('--fast');
const isStep = args.includes('--step');
const isHelp = args.includes('--help') || args.includes('-h');

if (isHelp) {
  console.log(`
${colors.bold}${colors.cyan}SafeSight — Scenario B Live Demo Simulator${colors.reset}

${colors.bold}USAGE:${colors.reset}
  npm run simulate:crush             ${colors.dim}Run full 45s automated crush simulation${colors.reset}
  npm run simulate:step              ${colors.dim}Interactive mode (press [Enter] to advance each step)${colors.reset}
  npm run simulate:fast              ${colors.dim}Fast 15s mode for quick testing${colors.reset}
  npm run simulate:reset             ${colors.dim}Reset all zones back to baseline green status${colors.reset}

${colors.bold}OPTIONS:${colors.reset}
  --fast     Reduce delay between steps (3s per step)
  --step     Wait for [Enter] key press before each transition
  --reset    Instantly reset Zone C to normal headcount (150)
  --help     Show this help message
`);
  process.exit(0);
}

// Timing delays (in milliseconds)
const STEP_DELAY = isFast ? 3000 : 9000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function promptEnter(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n${colors.bold}${colors.cyan}👉 [PRESS ENTER] ${message}${colors.reset}`, () => {
      rl.close();
      resolve();
    });
  });
}

async function pause(message: string, durationMs: number = STEP_DELAY): Promise<void> {
  if (isStep) {
    await promptEnter(message);
  } else {
    console.log(`\n${colors.dim}⏳ [Auto-Advancing in ${durationMs / 1000}s] ${message}...${colors.reset}`);
    await sleep(durationMs);
  }
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface Zone {
  id: string;
  name: string;
  maxCapacity: number;
  currentDensity: number;
  densityStatus: string;
  siteId: string;
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.white}  SafeSight — Scenario B Live Demo Simulator  ${colors.reset}`);
  console.log(`${colors.dim}  Smart India Hackathon 2026 Presentation Tool${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  try {
    // 1. Authenticate as Manager
    console.log(`${colors.cyan}[1/6] Authenticating as Site Manager...${colors.reset}`);
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@safesight.local',
        password: 'safesight123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Failed to login (${loginRes.status}). Ensure NestJS backend is running on port 3001.`);
    }

    const loginData = (await loginRes.json()) as ApiResponse<{ accessToken: string; user: { siteId: string } }>;
    const token = loginData.data.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log(`${colors.green}  ✓ Logged in as Rajesh Sharma (Site Manager)${colors.reset}`);

    // 2. Discover Zones
    console.log(`${colors.cyan}[2/6] Discovering Prayagraj Sangam zones...${colors.reset}`);
    const zonesRes = await fetch(`${API_BASE_URL}/zones`, {
      headers: authHeaders,
    });

    if (!zonesRes.ok) {
      throw new Error(`Failed to fetch zones (${zonesRes.status})`);
    }

    const zonesData = (await zonesRes.json()) as ApiResponse<Zone[]>;
    const zones = zonesData.data;

    // Find Zone C (Ghat Staircase)
    const zoneC = zones.find(
      (z) => z.name.toLowerCase().includes('zone c') || z.name.toLowerCase().includes('staircase'),
    ) || zones[0];

    if (!zoneC) {
      throw new Error('No zones found. Ensure backend database is seeded with Prayagraj Sangam demo data.');
    }

    const siteId = zoneC.siteId;
    console.log(`${colors.green}  ✓ Target: ${colors.bold}${zoneC.name}${colors.reset} (ID: ${zoneC.id}, Capacity: ${zoneC.maxCapacity})`);

    // Handle Reset Mode
    if (isReset) {
      console.log(`\n${colors.yellow}🔄 Resetting all zones to baseline green state...${colors.reset}`);
      await fetch(`${API_BASE_URL}/zones/${zoneC.id}/density`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          headcount: 150,
          flowRate: 35.0,
          flowVelocity: 1.2,
          source: 'simulation',
        }),
      });

      // Acknowledge any active unacknowledged alerts to clear banners
      try {
        const activeAlertsRes = await fetch(`${API_BASE_URL}/alerts?siteId=${siteId}`, { headers: authHeaders });
        if (activeAlertsRes.ok) {
          const activeAlertsData = (await activeAlertsRes.json()) as ApiResponse<Array<{ id: string; status: string }>>;
          const unacked = (activeAlertsData.data || []).filter((a) => a.status === 'dispatched' || a.status === 'escalated');
          for (const alert of unacked) {
            await fetch(`${API_BASE_URL}/alerts/${alert.id}/acknowledge`, {
              method: 'PATCH',
              headers: authHeaders,
            });
          }
          if (unacked.length > 0) {
            console.log(`${colors.green}  ✓ Cleared ${unacked.length} active alert banner(s)${colors.reset}`);
          }
        }
      } catch (err) {}

      console.log(`${colors.green}${colors.bold}✅ Reset Complete! Zone C is Green (150/500). Ready for demo.${colors.reset}\n`);
      return;
    }

    // ----------------------------------------------------
    // PHASE 1: Baseline / Normal Operations (Green)
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.bgGreen}${colors.white}  PHASE 1: Normal Flow Baseline (00:00)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "Here is our live map of Prayagraj Sangam. Notice Zone C is calm and green."${colors.reset}`);

    await fetch(`${API_BASE_URL}/zones/${zoneC.id}/density`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        headcount: 150,
        flowRate: 35.0,
        flowVelocity: 1.2,
        source: 'simulation',
      }),
    });
    console.log(`${colors.green}  🟢 Zone C Density: 150 / 500 (30% capacity) — STATUS: GREEN${colors.reset}`);
    console.log(`${colors.dim}  Flow Velocity: 1.2 m/s | WebSocket event 'zone:density:update' emitted${colors.reset}`);

    await pause('Advance to Phase 2 (Evening Aarti Surge)');

    // ----------------------------------------------------
    // PHASE 2: Influx / Surge (Yellow)
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.bgYellow}${colors.white}  PHASE 2: Evening Aarti Surge (00:10)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "Evening Aarti concludes — 200+ pilgrims rush towards the staircase corridor."${colors.reset}`);

    await fetch(`${API_BASE_URL}/zones/${zoneC.id}/density`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        headcount: 320,
        flowRate: 42.0,
        flowVelocity: 0.8,
        source: 'simulation',
      }),
    });
    console.log(`${colors.yellow}  🟡 Zone C Density: 320 / 500 (64% capacity) — STATUS: YELLOW${colors.reset}`);
    console.log(`${colors.dim}  Flow Velocity: 0.8 m/s | Heatmap updates to yellow on visitor PWA${colors.reset}`);

    // Dispatch Advisory (Moderate) Alert for elevated crowding
    console.log(`\n${colors.yellow}  📢 Dispatching ADVISORY (Moderate) Alert for Zone C...${colors.reset}`);
    const advisoryAlertRes = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        siteId,
        targetZoneId: zoneC.id,
        severity: 'advisory',
        title: 'Moderate Crowding — Zone C Staircase',
        message: 'Zone C is experiencing elevated foot traffic (64% capacity). Consider using Zone D corridor as an alternate route.',
        channels: ['push', 'dashboard'],
      }),
    });
    const advisoryAlertData = (await advisoryAlertRes.json()) as ApiResponse<{ id: string }>;
    console.log(`${colors.yellow}  ⚠️  ADVISORY ALERT DISPATCHED (ID: ${advisoryAlertData.data?.id || 'ok'})${colors.reset}`);
    console.log(`${colors.dim}  Channels: Push Notification (PWA) + Control Room Dashboard Banner${colors.reset}`);
    console.log(`${colors.dim}  ↳ Yellow marching-border banner now visible on /dashboard/alerts in real-time${colors.reset}`);

    await pause('Advance to Phase 3 (Bottleneck Warning)');

    // ----------------------------------------------------
    // PHASE 3: Congestion / Warning (Orange)
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.yellow}  PHASE 3: Staircase Chokepoint (00:20)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "The narrow staircase bottlenecks. Density reaches orange warning levels."${colors.reset}`);

    await fetch(`${API_BASE_URL}/zones/${zoneC.id}/density`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        headcount: 440,
        flowRate: 20.0,
        flowVelocity: 0.4,
        source: 'simulation',
      }),
    });
    console.log(`${colors.yellow}  🟠 Zone C Density: 440 / 500 (88% capacity) — STATUS: ORANGE${colors.reset}`);
    console.log(`${colors.dim}  Flow Velocity: 0.4 m/s (dropping) | Pre-alert recommended${colors.reset}`);

    await pause('Advance to Phase 4 (CRUSH PRECURSOR BREACH)');

    // ----------------------------------------------------
    // PHASE 4: Crush Precursor Breach (Red)
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.bgRed}${colors.white}  PHASE 4: Crush Precursor Flagged (00:30)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "AI anomaly engine recognizes high density + near-zero velocity. Incident flagged!"${colors.reset}`);

    await fetch(`${API_BASE_URL}/zones/${zoneC.id}/density`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        headcount: 485,
        flowRate: 8.0,
        flowVelocity: 0.18,
        source: 'simulation',
      }),
    });
    console.log(`${colors.red}  🔴 Zone C Density: 485 / 500 (97% capacity) — STATUS: RED${colors.reset}`);
    console.log(`${colors.dim}  Flow Velocity: 0.18 m/s | Severe bottlenecking detected${colors.reset}`);

    // Auto-create flagged incident
    const incidentRes = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        siteId,
        zoneId: zoneC.id,
        incidentType: 'crush_precursor',
        severity: 'critical',
        title: 'Crush precursor detected at Zone C Staircase',
        description: 'Density at 97% capacity (485/500) with flow velocity falling to 0.18 m/s. High stampede risk.',
        location: { latitude: 25.4358, longitude: 81.8525 },
        confidenceScore: 0.96,
        detectionSource: 'ai',
      }),
    });

    const incidentData = (await incidentRes.json()) as ApiResponse<{ id: string }>;
    const incidentId = incidentData.data?.id;
    console.log(`${colors.magenta}  🚨 AI INCIDENT FLAGGED: ID ${incidentId || 'created'}${colors.reset}`);
    console.log(`${colors.dim}  WebSocket event 'incident:new' pushed to Manager Dashboard${colors.reset}`);

    await pause('Advance to Phase 5 (Manager 1-Tap Verification & Broadcast)');

    // ----------------------------------------------------
    // PHASE 5: 1-Tap Manager Verification & Broadcast
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.cyan}  PHASE 5: 1-Tap Manager Verification & Alert Broadcast (00:40)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "Site Manager taps 'Verify'. An emergency push alert is dispatched to nearby visitors."${colors.reset}`);

    if (incidentId) {
      await fetch(`${API_BASE_URL}/incidents/${incidentId}/verify`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ action: 'verify' }),
      });
      console.log(`${colors.green}  ✓ Incident Verified by Rajesh Sharma (Site Manager)${colors.reset}`);
    }

    const alertRes = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        incidentId,
        siteId,
        targetZoneId: zoneC.id,
        severity: 'critical',
        title: 'Crush Hazard Warning — Zone C',
        message: 'Hold position. Do not enter Zone C staircase. Please use Zone D north exit corridor.',
        channels: ['push', 'sms', 'dashboard'],
      }),
    });

    const alertData = (await alertRes.json()) as ApiResponse<{ id: string }>;
    console.log(`${colors.green}  📢 EMERGENCY ALERT DISPATCHED (ID: ${alertData.data?.id || 'ok'})${colors.reset}`);
    console.log(`${colors.dim}  Channels: Push Notifications (PWA) + SMS Broadcast + Control Room Banner${colors.reset}`);

    await pause('Advance to Phase 6 (Responder Dispatch)');

    // ----------------------------------------------------
    // PHASE 6: Responder Dispatch & Resolution
    // ----------------------------------------------------
    console.log(`\n${colors.bold}${colors.blue}  PHASE 6: 108 Emergency Responder Unit En Route (00:45)  ${colors.reset}`);
    console.log(`${colors.dim}Narrator Cue: "108 Medical & NDRF teams receive GPS pin navigation and confirm en route status."${colors.reset}`);

    if (incidentId) {
      await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'responding' }),
      });
      console.log(`${colors.blue}  🚑 Status Updated: 108 Emergency Lead (Vikram Singh) RESPONDING${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}======================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.green}  🎉 SCENARIO B DEMO COMPLETE!  ${colors.reset}`);
    console.log(`${colors.dim}  To reset zones back to normal for another run:${colors.reset}`);
    console.log(`  ${colors.cyan}npm run simulate:reset${colors.reset}`);
    console.log(`${colors.bold}${colors.green}======================================================${colors.reset}\n`);

  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bold}❌ Simulation Error:${colors.reset} ${error.message}\n`);
    console.log(`${colors.yellow}Tip: Make sure the NestJS backend is running on port 3001 (npm run start:dev).${colors.reset}\n`);
    process.exit(1);
  }
}

main();
