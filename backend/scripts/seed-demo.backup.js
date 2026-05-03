/**
 * seed-demo.js — CloudAspire Hackathon Demo Seeder
 *
 * Run: node --env-file=.env scripts/seed-demo.js
 *
 * Creates:
 *  • 1 Org  (CloudAspire Demo Org)
 *  • 1 Team (Platform Engineering)
 *  • 1 Admin user  (admin@cloudaspire.io / Demo@12345)
 *  • 3 CloudAccounts: AWS Production, GCP Analytics, Azure Primary
 *  • 90 days of cost records for all 3 providers  (source: 'live')
 *  • 3 open budget alerts
 *  • 4 cost-saving recommendations
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// ─── Schemas (inline — no circular dep issues) ────────────────────────────────

const OrgSchema = new mongoose.Schema({ name: String, plan: String, currency: String }, { timestamps: true });
const TeamSchema = new mongoose.Schema({ name: String, description: String, orgId: mongoose.Schema.Types.ObjectId, members: [mongoose.Schema.Types.ObjectId], createdBy: mongoose.Schema.Types.ObjectId }, { timestamps: true });
const UserSchema = new mongoose.Schema({ name: String, email: { type: String, lowercase: true, unique: true }, password: String, role: String, orgId: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, onboardingCompleted: Boolean }, { timestamps: true });
const CloudAccountSchema = new mongoose.Schema({ orgId: mongoose.Schema.Types.ObjectId, team: mongoose.Schema.Types.ObjectId, addedBy: mongoose.Schema.Types.ObjectId, provider: String, name: String, credentials: Object, isActive: Boolean }, { timestamps: true });
const CostRecordSchema = new mongoose.Schema({ orgId: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, cloudAccountId: mongoose.Schema.Types.ObjectId, provider: String, date: Date, service: String, region: String, cost: Number, currency: { type: String, default: 'USD' }, resourceId: String, source: { type: String, default: 'live' } }, { timestamps: true });
const AlertSchema = new mongoose.Schema({ orgId: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, title: String, message: String, severity: String, status: String, category: String }, { timestamps: true });
const OptimizationSchema = new mongoose.Schema({ orgId: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, title: String, description: String, provider: String, service: String, potentialSavings: Number, status: String, effort: String }, { timestamps: true });

const Org          = mongoose.model('Org', OrgSchema);
const Team         = mongoose.model('Team', TeamSchema);
const User         = mongoose.model('User', UserSchema);
const CloudAccount = mongoose.model('CloudAccount', CloudAccountSchema);
const CostRecord   = mongoose.model('CostRecord', CostRecordSchema);
const Alert        = mongoose.model('Alert', AlertSchema);
const Optimization = mongoose.model('Optimization', OptimizationSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const jitter = (base, pct = 0.15) => +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(4);

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ─── Provider data definitions ────────────────────────────────────────────────

const AWS_SERVICES = [
    { service: 'Amazon EC2',           region: 'us-east-1',      baseCost: 1420 },
    { service: 'Amazon RDS',           region: 'us-east-1',      baseCost:  680 },
    { service: 'Amazon S3',            region: 'us-east-1',      baseCost:  210 },
    { service: 'AWS Lambda',           region: 'us-west-2',      baseCost:   85 },
    { service: 'Amazon CloudFront',    region: 'us-east-1',      baseCost:  130 },
    { service: 'Amazon ElastiCache',   region: 'us-east-1',      baseCost:  195 },
    { service: 'Amazon EKS',           region: 'us-east-1',      baseCost:  375 },
    { service: 'AWS Data Transfer',    region: 'us-east-1',      baseCost:   55 },
];

const GCP_SERVICES = [
    { service: 'Compute Engine',       region: 'us-central1',    baseCost:  820 },
    { service: 'Cloud SQL',            region: 'us-central1',    baseCost:  310 },
    { service: 'Google Kubernetes Engine', region: 'us-central1', baseCost: 280 },
    { service: 'Cloud Storage',        region: 'us-central1',    baseCost:   95 },
    { service: 'BigQuery',             region: 'us-central1',    baseCost:  175 },
    { service: 'Cloud Run',            region: 'us-central1',    baseCost:   60 },
];

const AZURE_SERVICES = [
    { service: 'Virtual Machines',     region: 'eastus',         baseCost:  960 },
    { service: 'Azure SQL Database',   region: 'eastus',         baseCost:  390 },
    { service: 'Azure Kubernetes Service', region: 'eastus',     baseCost:  320 },
    { service: 'Azure Blob Storage',   region: 'eastus',         baseCost:  115 },
    { service: 'Azure Functions',      region: 'eastus',         baseCost:   45 },
    { service: 'Azure CDN',            region: 'eastus',         baseCost:   75 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🔌 Connecting to MongoDB Atlas…');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to:', mongoose.connection.host);

    // ── 1. Org ────────────────────────────────────────────────────────────────
    let org = await Org.findOne({ name: 'CloudAspire Demo Org' });
    if (!org) {
        org = await Org.create({ name: 'CloudAspire Demo Org', plan: 'enterprise', currency: 'USD' });
        console.log('✅ Org created:', org._id.toString());
    } else {
        console.log('ℹ️  Org already exists:', org._id.toString());
    }
    const orgId = org._id;

    // ── 2. Team ───────────────────────────────────────────────────────────────
    let team = await Team.findOne({ orgId });
    if (!team) {
        team = await Team.create({ name: 'Platform Engineering', description: 'Owns all cloud infra', orgId, members: [], createdBy: orgId });
        console.log('✅ Team created:', team._id.toString());
    } else {
        console.log('ℹ️  Team exists:', team._id.toString());
    }
    const teamId = team._id;

    // ── 3. Admin user ─────────────────────────────────────────────────────────
    let user = await User.findOne({ email: 'admin@cloudaspire.io' });
    if (!user) {
        const hashed = await bcrypt.hash('Demo@12345', 12);
        user = await User.create({ name: 'CloudAspire Admin', email: 'admin@cloudaspire.io', password: hashed, role: 'admin', orgId, teamId, onboardingCompleted: true });
        console.log('✅ Admin user created — login: admin@cloudaspire.io / Demo@12345');
    } else {
        // Update orgId if not set
        if (!user.orgId) { user.orgId = orgId; user.teamId = teamId; await user.save(); }
        console.log('ℹ️  Admin user exists');
    }

    // Update team members
    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: user._id } });

    // ── 4. Cloud Accounts ─────────────────────────────────────────────────────
    const accountDefs = [
        { provider: 'aws',   name: 'AWS Production',          region: 'us-east-1' },
        { provider: 'gcp',   name: 'GCP Analytics Platform',  region: 'us-central1' },
        { provider: 'azure', name: 'Azure Primary Subscription', region: 'eastus' },
    ];

    const accounts = {};
    for (const def of accountDefs) {
        let acc = await CloudAccount.findOne({ orgId, provider: def.provider });
        if (!acc) {
            acc = await CloudAccount.create({ orgId, team: teamId, addedBy: user._id, provider: def.provider, name: def.name, credentials: { note: 'demo-credentials' }, isActive: true });
            console.log(`✅ CloudAccount created: ${def.name} → ${acc._id}`);
        } else {
            console.log(`ℹ️  CloudAccount exists: ${def.name}`);
        }
        accounts[def.provider] = acc._id;
    }

    // ── 5. Cost Records (90 days, all 3 providers) ───────────────────────────
    const existingCount = await CostRecord.countDocuments({ orgId, source: 'live' });
    if (existingCount > 0) {
        console.log(`ℹ️  ${existingCount} live CostRecords already exist — skipping seed`);
        console.log('   (Delete them manually and re-run to re-seed)');
    } else {
        console.log('🌱 Seeding 90 days of cost records…');
        const ops = [];

        const allDefs = [
            { provider: 'aws',   services: AWS_SERVICES },
            { provider: 'gcp',   services: GCP_SERVICES },
            { provider: 'azure', services: AZURE_SERVICES },
        ];

        // Apply a gentle upward cost trend over 90 days (simulates organic growth)
        for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
            const date = daysAgo(dayOffset);
            const growthFactor = 1 + (89 - dayOffset) * 0.001; // 0→9% growth over 90 days

            for (const { provider, services } of allDefs) {
                const dailyCostPerService = Math.floor(30 / services.length * 100) / 100; // spread monthly target over services
                for (const svc of services) {
                    const cost = jitter(svc.baseCost * growthFactor / 30); // monthly → daily
                    ops.push({
                        orgId,
                        teamId,
                        cloudAccountId: accounts[provider],
                        provider,
                        date,
                        service: svc.service,
                        region: svc.region,
                        cost,
                        currency: 'USD',
                        resourceId: `arn:${provider}:${svc.service.toLowerCase().replace(/\s+/g, '-')}:${svc.region}::demo-resource`,
                        source: 'live',
                    });
                }
            }
        }

        await CostRecord.insertMany(ops, { ordered: false });
        console.log(`✅ Inserted ${ops.length} cost records (${Math.floor(ops.length / 90)} services × 90 days)`);
    }

    // ── 6. Alerts ─────────────────────────────────────────────────────────────
    const alertCount = await Alert.countDocuments({ orgId });
    if (alertCount === 0) {
        await Alert.insertMany([
            { orgId, teamId, title: 'AWS EC2 Spend Spike', message: 'EC2 spend increased 38% vs last week — review auto-scaling policies.', severity: 'high', status: 'open', category: 'anomaly' },
            { orgId, teamId, title: 'GCP BigQuery Budget at 85%', message: 'BigQuery budget threshold reached. Current spend: $149 / $175 budget.', severity: 'medium', status: 'open', category: 'budget' },
            { orgId, teamId, title: 'Azure VM Idle Resources', message: '3 Azure VMs have < 5% CPU utilisation for 7 days. Consider rightsizing.', severity: 'low', status: 'open', category: 'optimization' },
            { orgId, teamId, title: 'Monthly Forecast Exceeds Budget', message: 'Projected end-of-month spend ($11,240) exceeds budget ($10,000) by 12.4%.', severity: 'critical', status: 'open', category: 'budget' },
        ]);
        console.log('✅ Alerts seeded (4)');
    } else {
        console.log(`ℹ️  ${alertCount} alerts already exist`);
    }

    // ── 7. Optimizations / Recommendations ───────────────────────────────────
    const optCount = await Optimization.countDocuments({ orgId });
    if (optCount === 0) {
        await Optimization.insertMany([
            { orgId, teamId, title: 'Rightsize EC2 t3.xlarge → t3.large', description: '4 instances running at < 25% average CPU. Downsizing saves 50% on those instances.', provider: 'aws', service: 'Amazon EC2', potentialSavings: 284, status: 'pending', effort: 'low' },
            { orgId, teamId, title: 'Purchase EC2 Reserved Instances', description: 'Convert 8 on-demand EC2 instances to 1-year reserved. Saves ~35% vs on-demand.', provider: 'aws', service: 'Amazon EC2', potentialSavings: 498, status: 'pending', effort: 'medium' },
            { orgId, teamId, title: 'Enable GCP Committed Use Discounts', description: 'Commit to 1-year usage on Compute Engine to receive 37% discount.', provider: 'gcp', service: 'Compute Engine', potentialSavings: 302, status: 'pending', effort: 'low' },
            { orgId, teamId, title: 'Delete unattached Azure Managed Disks', description: '7 managed disks (1.2 TB total) are unattached and accruing storage costs.', provider: 'azure', service: 'Azure Blob Storage', potentialSavings: 95, status: 'pending', effort: 'low' },
        ]);
        console.log('✅ Optimizations seeded (4)');
    } else {
        console.log(`ℹ️  ${optCount} optimizations already exist`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────');
    console.log('🎉  Demo seed complete!');
    console.log(`    Org ID:  ${orgId}`);
    console.log(`    Team ID: ${teamId}`);
    console.log('');
    console.log('    Login credentials:');
    console.log('      Email:    admin@cloudaspire.io');
    console.log('      Password: Demo@12345');
    console.log('');
    console.log('    Cloud accounts seeded:');
    console.log('      AWS   → AWS Production');
    console.log('      GCP   → GCP Analytics Platform');
    console.log('      Azure → Azure Primary Subscription');
    console.log('────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Seed failed:', err.message);
    mongoose.disconnect().finally(() => process.exit(1));
});
