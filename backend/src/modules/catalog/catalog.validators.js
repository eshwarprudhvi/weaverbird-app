const { z } = require('zod');

const listCatalogSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    status: z.string().optional(),
  })
});

const createCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    price: z.string().min(1),
    status: z.string().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

const updateCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    price: z.string().min(1).optional(),
    status: z.string().optional(),
    tempId: z.string().optional(),
    visibility: z.string().optional(),
    ownerUid: z.string().optional(),
  })
});

module.exports = {
  listCatalogSchema,
  createCatalogSchema,
  updateCatalogSchema,
};
