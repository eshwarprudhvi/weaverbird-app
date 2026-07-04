const { z } = require('zod');

const updateWorkspaceSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(100).optional(),
    studioName: z.string().min(2).max(100).optional(),
    businessCategory: z.string().optional(),
    businessEmail: z.string().email().optional(),
    businessPhone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    logoUrl: z.string().url().optional(),
  })
});

const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['Admin', 'Manager', 'Editor', 'Viewer']),
  })
});

module.exports = {
  updateWorkspaceSchema,
  inviteMemberSchema,
};
