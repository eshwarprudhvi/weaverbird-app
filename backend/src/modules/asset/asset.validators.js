const { z } = require('zod');

// Since multipart/form-data fields come as strings, we validate them as strings here.
// Tags will be parsed from a JSON string in the service.
const uploadAssetSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(), // Expected to be JSON stringified array '["tag1", "tag2"]'
    type: z.enum(['image', 'document', 'cad', 'video', 'contract', 'boq', 'drawing', 'voice']).optional(),
    projectId: z.string().optional(),
    assetId: z.string().optional(), // Providing this triggers a new version upload
  })
});

const listAssetsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.enum(['active', 'deleted']).optional(),
    type: z.enum(['image', 'document', 'cad', 'video', 'contract', 'boq', 'drawing', 'voice']).optional(),
    projectId: z.string().optional(),
  }),
});

module.exports = {
  uploadAssetSchema,
  listAssetsSchema,
};
