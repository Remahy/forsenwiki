import { expect, test } from 'vitest';

import { ActivityType } from '../../generated/prisma/enums';
import { AVAILABLE_ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from './activity';

test('the activity types are the ones the database knows', () => {
	expect(AVAILABLE_ACTIVITY_TYPES).toEqual(Object.values(ActivityType));
	expect(Object.keys(ACTIVITY_TYPE_LABELS)).toEqual(AVAILABLE_ACTIVITY_TYPES);
});
