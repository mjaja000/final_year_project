const { z } = require('zod');

const INCIDENT_CATEGORIES = [
  'Speeding',
  'Reckless',
  'Overcharging',
  'Harassment',
  'Loud Music',
  'Poor Condition',
  'Unsafe Driving',
  'Other',
];

// Discriminated union schema for reports
const generalReportSchema = z.object({
  reportType: z.literal('GENERAL'),
  userId: z.string().uuid().optional().nullable(),
  matatuId: z.string().uuid('Invalid matatu ID format'),
  type: z.literal('GENERAL'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  category: z.undefined().optional(),
  comment: z.string().optional(),
});

const incidentReportSchema = z.object({
  reportType: z.literal('INCIDENT'),
  userId: z.string().uuid().optional().nullable(),
  matatuId: z.string().uuid('Invalid matatu ID format'),
  type: z.literal('INCIDENT'),
  category: z.enum(INCIDENT_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${INCIDENT_CATEGORIES.join(', ')}` }),
  }),
  rating: z.number().optional(),
  comment: z.string().optional(),
});

// Discriminated union
const reportSchema = z.discriminatedUnion('reportType', [
  generalReportSchema,
  incidentReportSchema,
]);

/**
 * Validate report data
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data or throws ZodError
 */
function validateReport(data) {
  // Map frontend reportType to schema type if needed
  const mappedData = {
    ...data,
    type: data.reportType === 'GENERAL' ? 'GENERAL' : 'INCIDENT',
  };

  return reportSchema.parse(mappedData);
}

module.exports = {
  reportSchema,
  generalReportSchema,
  incidentReportSchema,
  validateReport,
  INCIDENT_CATEGORIES,
};
