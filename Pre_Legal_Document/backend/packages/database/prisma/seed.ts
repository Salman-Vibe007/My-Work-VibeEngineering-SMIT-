import { PrismaClient, TemplateCategory, PlanInterval, UserRole, TemplateStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free',
      slug: 'free',
      description: 'Limited generations and basic templates',
      priceMonthly: 0,
      priceYearly: 0,
      interval: PlanInterval.MONTH,
      features: {
        templates: 'basic',
        generationsPerMonth: 5,
        exportsPerMonth: 3,
        versionHistory: false,
        premiumTemplates: false,
        aiAssistance: false,
        workspaces: false,
      },
      limits: {
        generationsPerMonth: 5,
        exportsPerMonth: 3,
        documents: 10,
        storageMB: 100,
      },
      isActive: true,
      sortOrder: 0,
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      description: 'Higher limits, premium templates, PDF/DOCX exports, version history',
      priceMonthly: 1900,
      priceYearly: 19000,
      interval: PlanInterval.MONTH,
      features: {
        templates: 'all',
        generationsPerMonth: 100,
        exportsPerMonth: 100,
        versionHistory: true,
        premiumTemplates: true,
        aiAssistance: true,
        workspaces: false,
      },
      limits: {
        generationsPerMonth: 100,
        exportsPerMonth: 100,
        documents: 500,
        storageMB: 1000,
      },
      isActive: true,
      sortOrder: 1,
    },
  })

  const businessPlan = await prisma.plan.upsert({
    where: { slug: 'business' },
    update: {},
    create: {
      name: 'Business',
      slug: 'business',
      description: 'Team workspace, shared templates, member roles, centralized billing',
      priceMonthly: 4900,
      priceYearly: 49000,
      interval: PlanInterval.MONTH,
      features: {
        templates: 'all',
        generationsPerMonth: 500,
        exportsPerMonth: 500,
        versionHistory: true,
        premiumTemplates: true,
        aiAssistance: true,
        workspaces: true,
        memberRoles: true,
        centralizedBilling: true,
      },
      limits: {
        generationsPerMonth: 500,
        exportsPerMonth: 500,
        documents: 5000,
        storageMB: 10000,
        members: 10,
      },
      isActive: true,
      sortOrder: 2,
    },
  })

  console.log('✅ Plans created')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMINISTRATOR,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created')

  // Create demo user
  const demoPassword = await hash('demo123', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: demoPassword,
      role: UserRole.USER,
      emailVerified: new Date(),
      preferredJurisdiction: 'US',
    },
  })

  // Create subscription for demo user
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Demo user created with Pro subscription')

  // Create templates
  const templates = [
    {
      slug: 'service-agreement',
      title: 'Service Agreement',
      description: 'A general service agreement between a client and service provider.',
      category: TemplateCategory.BUSINESS,
      jurisdictionCountry: 'US',
      isPremium: false,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'client_name', label: 'Client Name', type: 'text', required: true },
          { name: 'provider_name', label: 'Service Provider Name', type: 'text', required: true },
          { name: 'service_description', label: 'Service Description', type: 'textarea', required: true },
          { name: 'start_date', label: 'Start Date', type: 'date', required: true },
          { name: 'end_date', label: 'End Date', type: 'date', required: false },
          { name: 'payment_amount', label: 'Payment Amount', type: 'currency', required: true },
          { name: 'payment_schedule', label: 'Payment Schedule', type: 'select', required: true, options: ['Monthly', 'Quarterly', 'Upon Completion', 'Milestone-based'] },
        ],
        sections: [
          {
            id: 'parties',
            title: 'Parties',
            content: 'This Service Agreement ("Agreement") is entered into on {{start_date}} between {{client_name}} ("Client") and {{provider_name}} ("Provider").',
          },
          {
            id: 'services',
            title: 'Services',
            content: 'Provider agrees to perform the following services: {{service_description}}',
          },
          {
            id: 'compensation',
            title: 'Compensation',
            content: 'Client shall pay Provider {{payment_amount}} on a {{payment_schedule}} basis.',
          },
          {
            id: 'term',
            title: 'Term',
            content: 'This Agreement begins on {{start_date}} and {{#if end_date}}ends on {{end_date}}{{else}}continues until terminated by either party{{/if}}.',
          },
        ],
      },
    },
    {
      slug: 'nda',
      title: 'Non-Disclosure Agreement (NDA)',
      description: 'A mutual non-disclosure agreement for protecting confidential information.',
      category: TemplateCategory.BUSINESS,
      jurisdictionCountry: 'US',
      isPremium: false,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'party_a', label: 'Party A Name', type: 'text', required: true },
          { name: 'party_b', label: 'Party B Name', type: 'text', required: true },
          { name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true },
          { name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
          { name: 'term_years', label: 'Confidentiality Term (years)', type: 'number', required: true, default: 2 },
        ],
        sections: [
          {
            id: 'parties',
            title: 'Parties',
            content: 'This Non-Disclosure Agreement is entered into on {{effective_date}} between {{party_a}} ("Disclosing Party") and {{party_b}} ("Receiving Party").',
          },
          {
            id: 'purpose',
            title: 'Purpose',
            content: 'The parties wish to explore a potential business relationship for the purpose of: {{purpose}}',
          },
          {
            id: 'confidentiality',
            title: 'Confidentiality Obligations',
            content: 'The Receiving Party agrees to hold all confidential information in strict confidence for a period of {{term_years}} years from the date of disclosure.',
          },
        ],
      },
    },
    {
      slug: 'employment-agreement',
      title: 'Employment Agreement',
      description: 'Standard employment agreement for full-time employees.',
      category: TemplateCategory.EMPLOYMENT,
      jurisdictionCountry: 'US',
      isPremium: true,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'employer_name', label: 'Employer Name', type: 'text', required: true },
          { name: 'employee_name', label: 'Employee Name', type: 'text', required: true },
          { name: 'job_title', label: 'Job Title', type: 'text', required: true },
          { name: 'start_date', label: 'Start Date', type: 'date', required: true },
          { name: 'salary', label: 'Annual Salary', type: 'currency', required: true },
          { name: 'pay_frequency', label: 'Pay Frequency', type: 'select', required: true, options: ['Weekly', 'Bi-weekly', 'Monthly'] },
          { name: 'benefits', label: 'Benefits Description', type: 'textarea', required: false },
        ],
        sections: [
          {
            id: 'employment',
            title: 'Employment',
            content: '{{employer_name}} hereby employs {{employee_name}} as {{job_title}} effective {{start_date}}.',
          },
          {
            id: 'compensation',
            title: 'Compensation',
            content: 'Employee shall receive an annual salary of {{salary}}, paid on a {{pay_frequency}} basis.',
          },
          {
            id: 'benefits',
            title: 'Benefits',
            content: '{{#if benefits}}Employee shall be entitled to the following benefits: {{benefits}}{{else}}Standard company benefits apply.{{/if}}',
          },
        ],
      },
    },
    {
      slug: 'freelance-contract',
      title: 'Freelance Contract',
      description: 'Contract for freelance/project-based work.',
      category: TemplateCategory.FREELANCING,
      jurisdictionCountry: 'US',
      isPremium: false,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'client_name', label: 'Client Name', type: 'text', required: true },
          { name: 'freelancer_name', label: 'Freelancer Name', type: 'text', required: true },
          { name: 'project_description', label: 'Project Description', type: 'textarea', required: true },
          { name: 'deliverables', label: 'Deliverables', type: 'textarea', required: true },
          { name: 'total_fee', label: 'Total Fee', type: 'currency', required: true },
          { name: 'deposit_percent', label: 'Deposit Percentage', type: 'number', required: true, default: 50 },
          { name: 'timeline_weeks', label: 'Timeline (weeks)', type: 'number', required: true },
        ],
        sections: [
          {
            id: 'parties',
            title: 'Parties',
            content: 'This Freelance Contract is between {{client_name}} ("Client") and {{freelancer_name}} ("Freelancer").',
          },
          {
            id: 'scope',
            title: 'Scope of Work',
            content: 'Freelancer shall perform: {{project_description}}\n\nDeliverables:\n{{deliverables}}',
          },
          {
            id: 'payment',
            title: 'Payment Terms',
            content: 'Total project fee: {{total_fee}}. A {{deposit_percent}}% deposit is due upon signing. Remaining balance due upon completion.',
          },
          {
            id: 'timeline',
            title: 'Timeline',
            content: 'Project to be completed within {{timeline_weeks}} weeks from start date.',
          },
        ],
      },
    },
    {
      slug: 'rental-agreement',
      title: 'Residential Rental Agreement',
      description: 'Standard residential lease agreement.',
      category: TemplateCategory.PROPERTY,
      jurisdictionCountry: 'US',
      isPremium: true,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
          { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true },
          { name: 'property_address', label: 'Property Address', type: 'text', required: true },
          { name: 'monthly_rent', label: 'Monthly Rent', type: 'currency', required: true },
          { name: 'security_deposit', label: 'Security Deposit', type: 'currency', required: true },
          { name: 'lease_start', label: 'Lease Start Date', type: 'date', required: true },
          { name: 'lease_end', label: 'Lease End Date', type: 'date', required: true },
          { name: 'utilities_included', label: 'Utilities Included', type: 'multiselect', required: false, options: ['Electricity', 'Water', 'Gas', 'Internet', 'Trash'] },
        ],
        sections: [
          {
            id: 'parties',
            title: 'Parties',
            content: 'This Residential Lease Agreement is made between {{landlord_name}} ("Landlord") and {{tenant_name}} ("Tenant") for the property at {{property_address}}.',
          },
          {
            id: 'term',
            title: 'Lease Term',
            content: 'The lease term begins on {{lease_start}} and ends on {{lease_end}}.',
          },
          {
            id: 'rent',
            title: 'Rent',
            content: 'Monthly rent is {{monthly_rent}}, due on the 1st of each month. Security deposit: {{security_deposit}}.',
          },
          {
            id: 'utilities',
            title: 'Utilities',
            content: '{{#if utilities_included}}The following utilities are included in rent: {{utilities_included}}{{else}}Tenant is responsible for all utilities.{{/if}}',
          },
        ],
      },
    },
    {
      slug: 'demand-letter',
      title: 'Demand Letter',
      description: 'Formal demand letter for payment or performance.',
      category: TemplateCategory.DISPUTES,
      jurisdictionCountry: 'US',
      isPremium: false,
      status: TemplateStatus.PUBLISHED,
      version: 1,
      schema: {
        fields: [
          { name: 'sender_name', label: 'Your Name', type: 'text', required: true },
          { name: 'sender_address', label: 'Your Address', type: 'textarea', required: true },
          { name: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
          { name: 'recipient_address', label: 'Recipient Address', type: 'textarea', required: true },
          { name: 'amount_owed', label: 'Amount Owed', type: 'currency', required: true },
          { name: 'description', label: 'Description of Debt/Obligation', type: 'textarea', required: true },
          { name: 'due_date', label: 'Payment Due Date', type: 'date', required: true },
        ],
        sections: [
          {
            id: 'header',
            title: 'Header',
            content: '{{sender_name}}\n{{sender_address}}\n\nDate: {{due_date}}\n\n{{recipient_name}}\n{{recipient_address}}',
          },
          {
            id: 'demand',
            title: 'Demand',
            content: 'This letter serves as formal demand for payment of {{amount_owed}} owed for: {{description}}',
          },
          {
            id: 'deadline',
            title: 'Deadline',
            content: 'Payment must be received by {{due_date}}. Failure to pay may result in legal action.',
          },
        ],
      },
    },
  ]

  for (const template of templates) {
    const existing = await prisma.template.findUnique({ where: { slug: template.slug } })
    if (!existing) {
      await prisma.template.create({
        data: {
          ...template,
          publishedAt: new Date(),
          reviewedAt: new Date(),
          reviewedById: admin.id,
          versions: {
            create: {
              version: 1,
              schema: template.schema,
              content: template.schema,
              jurisdictionCountry: template.jurisdictionCountry,
              jurisdictionRegion: template.jurisdictionRegion,
              reviewStatus: 'approved',
              reviewerId: admin.id,
              reviewedAt: new Date(),
            },
          },
        },
      })
    }
  }

  console.log('✅ Templates created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })