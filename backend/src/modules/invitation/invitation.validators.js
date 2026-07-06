const { z } = require('zod');

const validRoles = ['owner', 'admin', 'manager', 'editor', 'member', 'viewer'];

const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    role: z.string().transform(val => val.toLowerCase()).refine(
      val => validRoles.includes(val),
      { message: `Role must be one of: ${validRoles.join(', ')}` }
    ),
    message: z.string().max(500, 'Message cannot exceed 500 characters').optional().nullable(),
    expiresInDays: z.union([z.number().min(1).max(30), z.string().regex(/^\d+$/).transform(Number)]).optional().default(7)
  })
});

const tokenParamSchema = z.object({
  params: z.object({
    token: z.string().min(10, 'Invalid token format')
  })
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invitation ID is required')
  })
});

const acceptOrDeclineSchema = z.object({
  body: z.object({
    token: z.string().optional()
  }).optional()
});

module.exports = {
  createInvitationSchema,
  tokenParamSchema,
  idParamSchema,
  acceptOrDeclineSchema
};
