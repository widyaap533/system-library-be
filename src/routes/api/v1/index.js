import express from 'express';

// Katalog
import books from './bookRoutes.js';
import authors from './authorRoutes.js';
import subjects from './subjekRoutes.js';
import digitalContents from './digitalContentRoutes.js';

// Eksemplar
import exemplars from './exemplarRoutes.js';
import categories from './categoryRoutes.js';
import accessTypes from './accessTypeRoutes.js';
import physicalFormats from './physicalFormatRoutes.js';
import resourceTypes from './resourceTypeRoutes.js';
import copyStatuses from './copyStatusRoutes.js';
import libraries from './libraryRoutes.js';
import rooms from './roomRoutes.js';

// Sirkulasi
import lendings from './lendingRoutes.js';
import loanStatuses from './loanStatusRoutes.js';

// Pengguna
import users from './userRoutes.js';
import roles from './roleRoutes.js';
import genders from './genderRoutes.js';
import religions from './religionRoutes.js';
import educations from './educationRoutes.js';
import occupations from './occupationRoutes.js';
import maritalStatuses from './maritalStatusRoutes.js';

const router = express.Router();

// Katalog
router.use(books);
router.use(authors);
router.use(subjects);
router.use(digitalContents);

// Eksemplar
router.use(exemplars);
router.use(categories);
router.use(accessTypes);
router.use(physicalFormats);
router.use(resourceTypes);
router.use(copyStatuses);
router.use(libraries);
router.use(rooms);

// Sirkulasi
router.use(lendings);
router.use(loanStatuses);

// Pengguna
router.use(users);
router.use(roles);
router.use(genders);
router.use(religions);
router.use(educations);
router.use(occupations);
router.use(maritalStatuses);

export default router;
