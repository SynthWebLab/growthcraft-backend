import fs from 'fs';
import path from 'path';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

import { Bootcamp } from '../src/database/models/Bootcamp.model';
import { Course } from '../src/database/models/Course.model';
import { TrainingProgram } from '../src/database/models/TrainingProgram.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

type CatalogueRow = Record<string, unknown> & {
  slug?: string;
  title?: string;
};

interface CatalogueSeed {
  courses: CatalogueRow[];
  trainingPrograms: CatalogueRow[];
  bootcamps: CatalogueRow[];
}

const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: unknown) => console.error(`[ERROR] ${message}`, error || ''),
};

function resolveCataloguePath(): string {
  const candidates = [
    process.env.CATALOGUE_SEED_PATH,
    path.resolve(__dirname, '../../content/seed/catalogue.json'),
    path.resolve(__dirname, '../content/seed/catalogue.json'),
  ].filter(Boolean) as string[];

  const cataloguePath = candidates.find(candidate => fs.existsSync(candidate));

  if (!cataloguePath) {
    throw new Error(
      `Catalogue seed file not found. Checked: ${candidates.join(', ')}. ` +
        'Set CATALOGUE_SEED_PATH to override.'
    );
  }

  return cataloguePath;
}

function resolveMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.CI) {
    throw new Error('MONGODB_URI is required when running catalogue seed in CI.');
  }

  logger.warn('MONGODB_URI is not set. Falling back to mongodb://localhost:27017/growthcraft');
  return 'mongodb://localhost:27017/growthcraft';
}

function parseCatalogue(filePath: string): CatalogueSeed {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<CatalogueSeed>;

  return {
    courses: ensureArray(parsed.courses, 'courses'),
    trainingPrograms: ensureArray(parsed.trainingPrograms, 'trainingPrograms'),
    bootcamps: ensureArray(parsed.bootcamps, 'bootcamps'),
  };
}

function ensureArray(value: unknown, fieldName: string): CatalogueRow[] {
  if (!Array.isArray(value)) {
    throw new Error(`catalogue.json must contain a "${fieldName}" array.`);
  }

  return value as CatalogueRow[];
}

function normalizeSlug(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is missing a valid slug.`);
  }

  return value.trim().toLowerCase();
}

function parseDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }

  return date;
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function cleanUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cleanUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, cleanUndefined(entryValue)])
    ) as T;
  }

  return value;
}

function normalizeCourse(row: CatalogueRow): Record<string, unknown> {
  const slug = normalizeSlug(row.slug, `Course "${row.title || 'untitled'}"`);
  const isPublished = typeof row.isPublished === 'boolean' ? row.isPublished : true;
  const duration = numberOrDefault(row.duration, numberOrDefault(row.totalHours, 1));
  const level = typeof row.level === 'string' ? row.level : row.difficultyLevel || 'Beginner';

  return cleanUndefined({
    ...row,
    slug,
    level,
    difficultyLevel: row.difficultyLevel || level,
    totalHours: numberOrDefault(row.totalHours, duration),
    duration,
    lessonsCount: numberOrDefault(row.lessonsCount, 1),
    price: numberOrDefault(row.price, 0),
    rating: numberOrDefault(row.rating, 0),
    instructor: row.instructor || { name: 'GrowthCraft Faculty' },
    tags: stringArray(row.tags),
    enrollmentCount: numberOrDefault(row.enrollmentCount, 0),
    isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
    isPublished,
    isDraft: typeof row.isDraft === 'boolean' ? row.isDraft : !isPublished,
    type: row.type || 'Course',
    publishedAt: parseDate(row.publishedAt),
    deletedAt: parseDate(row.deletedAt) || null,
  });
}

function normalizeTrainingProgram(row: CatalogueRow): Record<string, unknown> {
  return cleanUndefined({
    ...row,
    slug: normalizeSlug(row.slug, `Training program "${row.title || 'untitled'}"`),
    durationDays: numberOrDefault(row.durationDays, 1),
    focusAreas: stringArray(row.focusAreas),
    toolsTech: stringArray(row.toolsTech),
    isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : true,
    deletedAt: parseDate(row.deletedAt) || null,
  });
}

function normalizeBootcamp(row: CatalogueRow): Record<string, unknown> {
  const maxSeats = numberOrDefault(row.maxSeats, 1);
  const enrolledCount = numberOrDefault(row.enrolledCount, 0);
  const startDate = parseDate(row.startDate);
  const endDate = parseDate(row.endDate);
  const calculatedDuration =
    startDate && endDate
      ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  return cleanUndefined({
    ...row,
    slug: normalizeSlug(row.slug, `Bootcamp "${row.title || 'untitled'}"`),
    type: row.type || 'Bootcamp',
    durationDays: numberOrDefault(row.durationDays, calculatedDuration),
    keyTopics: stringArray(row.keyTopics),
    startDate,
    endDate,
    registrationDeadline: parseDate(row.registrationDeadline),
    maxSeats,
    enrolledCount,
    availableSeats: Math.max(0, maxSeats - enrolledCount),
    price: numberOrDefault(row.price, 0),
    mode: row.mode || 'Online',
    skillsCovered: stringArray(row.skillsCovered),
    mentorNames: stringArray(row.mentorNames),
    status: row.status || 'Open',
    rating: numberOrDefault(row.rating, 0),
    tags: stringArray(row.tags),
    isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
    isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : true,
    publishedAt: parseDate(row.publishedAt),
    duration: numberOrDefault(row.duration, calculatedDuration),
    deletedAt: parseDate(row.deletedAt) || null,
  });
}

async function upsertRows<T>(
  model: Model<T>,
  rows: CatalogueRow[],
  label: string,
  normalize: (row: CatalogueRow) => Record<string, unknown>
): Promise<number> {
  const seenSlugs = new Set<string>();

  for (const row of rows) {
    const normalized = normalize(row);
    const slug = normalized.slug as string;

    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate ${label} slug in catalogue.json: ${slug}`);
    }

    seenSlugs.add(slug);

    await model
      .findOneAndUpdate(
        { slug },
        { $set: normalized },
        {
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          upsert: true,
        }
      )
      .exec();
  }

  return seenSlugs.size;
}

async function seedCatalogue(): Promise<void> {
  const mongoUri = resolveMongoUri();
  const cataloguePath = resolveCataloguePath();
  const catalogue = parseCatalogue(cataloguePath);

  logger.info(`Using catalogue seed file: ${cataloguePath}`);
  logger.info(
    `Rows found: ${catalogue.courses.length} courses, ` +
      `${catalogue.trainingPrograms.length} training programs, ${catalogue.bootcamps.length} bootcamps`
  );

  await mongoose.connect(mongoUri);
  logger.info('Connected to MongoDB');

  const courseCount = await upsertRows(Course, catalogue.courses, 'course', normalizeCourse);
  const trainingProgramCount = await upsertRows(
    TrainingProgram,
    catalogue.trainingPrograms,
    'training program',
    normalizeTrainingProgram
  );
  const bootcampCount = await upsertRows(Bootcamp, catalogue.bootcamps, 'bootcamp', normalizeBootcamp);

  logger.info('Catalogue seed completed');
  console.log('\n=== Catalogue Seed Summary ===');
  console.log(`Courses upserted: ${courseCount}`);
  console.log(`Training programs upserted: ${trainingProgramCount}`);
  console.log(`Bootcamps upserted: ${bootcampCount}`);
  console.log('==============================\n');
}

seedCatalogue()
  .catch(error => {
    logger.error('Catalogue seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
