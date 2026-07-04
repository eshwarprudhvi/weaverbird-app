const { z } = require('zod');

const generateBackupSchema = z.object({
  body: z.object({
    targetEmail: z.string().email(),
  })
});

module.exports = {
  generateBackupSchema,
};
