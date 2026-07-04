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
    description: z.string().optional(),
    status: z.string().optional(),
    clientId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    clientId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
});

module.exports = {
  listProjectsSchema,
  createProjectSchema,
  updateProjectSchema,
};
