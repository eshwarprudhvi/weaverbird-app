const { z } = require('zod');

const listMeetingsSchema = z.object({
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

const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150),
    agenda: z.string().optional(),
    status: z.string().optional(),
    projectId: z.string().optional(),
    scheduledDate: z.string().optional(),
    durationMinutes: z.number().optional(),
    date: z.string().optional(),
    completed: z.boolean().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

const updateMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    agenda: z.string().optional(),
    status: z.string().optional(),
    scheduledDate: z.string().optional(),
    durationMinutes: z.number().optional(),
    date: z.string().optional(),
    completed: z.boolean().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

module.exports = {
  listMeetingsSchema,
  createMeetingSchema,
  updateMeetingSchema,
};
