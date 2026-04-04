import { PrismaClient, Platform, PolicyTier, PolicyStatus, DisruptionType, DisruptionSeverity, ClaimStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AegisShield database...');

  // ── Admin / Insurer users ─────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const insurerHash = await bcrypt.hash('Insurer@123456', 12);
  const workerHash = await bcrypt.hash('Worker@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aegisshield.in' },
    update: {},
    create: { email: 'admin@aegisshield.in', passwordHash: adminHash, role: Role.ADMIN },
  });

  const insurer = await prisma.user.upsert({
    where: { email: 'insurer@aegisshield.in' },
    update: {},
    create: { email: 'insurer@aegisshield.in', passwordHash: insurerHash, role: Role.INSURER },
  });

  console.log(`✅ Admin: admin@aegisshield.in / Admin@123456`);
  console.log(`✅ Insurer: insurer@aegisshield.in / Insurer@123456`);

  // ── Demo workers ──────────────────────────────────────────────────────────
  const workerEmails = [
    { email: 'rahul.kumar@demo.in', name: 'Rahul Kumar', city: 'Mumbai', platform: Platform.ZOMATO, earnings: 5200 },
    { email: 'priya.sharma@demo.in', name: 'Priya Sharma', city: 'Bangalore', platform: Platform.SWIGGY, earnings: 4800 },
    { email: 'amit.singh@demo.in', name: 'Amit Singh', city: 'Delhi', platform: Platform.AMAZON, earnings: 4200 },
    { email: 'meera.patel@demo.in', name: 'Meera Patel', city: 'Chennai', platform: Platform.SWIGGY, earnings: 3800 },
  ];

  for (const w of workerEmails) {
    const user = await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: { email: w.email, passwordHash: workerHash, role: Role.WORKER },
    });

    await prisma.worker.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: w.name,
        phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
        city: w.city,
        zones: [w.city.toLowerCase()],
        platform: w.platform,
        weeklyBaseEarning: w.earnings,
        avgHoursPerDay: 8,
        workingDaysPerWeek: 6,
        riskScore: 45 + Math.random() * 30,
      },
    });
    console.log(`✅ Worker: ${w.email} / Worker@123456`);
  }

  // ── Demo disruption event ─────────────────────────────────────────────────
  await prisma.disruptionEvent.create({
    data: {
      zone: 'Mumbai',
      type: DisruptionType.WEATHER,
      severity: DisruptionSeverity.HIGH,
      title: 'Heavy Monsoon Rainfall – Mumbai',
      description: 'IMD red alert: 150mm rainfall expected over 6 hours. Sion, Kurla, Andheri flooded.',
      source: 'seed',
      startTime: new Date(Date.now() - 3_600_000),
      verified: true,
    },
  });

  console.log('✅ Demo disruption event created');
  console.log('\n🛡️  Database seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:   admin@aegisshield.in      / Admin@123456');
  console.log('  Insurer: insurer@aegisshield.in    / Insurer@123456');
  console.log('  Worker:  rahul.kumar@demo.in       / Worker@123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect());
