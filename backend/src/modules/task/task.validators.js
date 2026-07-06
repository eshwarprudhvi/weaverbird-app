const { z } = require('zod');

const listTasksSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    projectId: z.string().optional(),
  })
});

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    text: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    completed: z.boolean().optional(),
    projectId: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    text: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    completed: z.boolean().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

module.exports = {
  listTasksSchema,
  createTaskSchema,
  updateTaskSchema,
};
