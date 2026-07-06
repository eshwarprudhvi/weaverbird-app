const { z } = require('zod');

const listProjectsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.string().optional(),
  })
});

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    clientId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    tempId: z.string().optional(),
    rooms: z.array(z.any()).optional(),
    materials: z.array(z.any()).optional(),
    tasks: z.array(z.any()).optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    clientId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    tempId: z.string().optional(),
    isTrashed: z.boolean().optional(),
    trashedAt: z.string().nullable().optional(),
    rooms: z.array(z.any()).optional(),
    materials: z.array(z.any()).optional(),
    tasks: z.array(z.any()).optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

module.exports = {
  listProjectsSchema,
  createProjectSchema,
  updateProjectSchema,
};
