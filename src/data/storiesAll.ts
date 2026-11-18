import type { StoryBookItem } from './curriculum';
import { BANGLA_STORIES_PART_1 } from './storiesBn1';
import { BANGLA_STORIES_PART_2 } from './storiesBn2';
import { BANGLA_STORIES_PART_3 } from './storiesBn3';
import { BANGLA_STORIES_PART_4 } from './storiesBn4';
import { BANGLA_STORIES_PART_5 } from './storiesBn5';
import { ENGLISH_STORIES_PART_1 } from './storiesEn1';
import { ENGLISH_STORIES_PART_2 } from './storiesEn2';
import { ENGLISH_STORIES_PART_3 } from './storiesEn3';
import { ENGLISH_STORIES_PART_4 } from './storiesEn4';

export const CHILDREN_STORIES: StoryBookItem[] = [
  ...BANGLA_STORIES_PART_1,
  ...BANGLA_STORIES_PART_2,
  ...BANGLA_STORIES_PART_3,
  ...BANGLA_STORIES_PART_4,
  ...BANGLA_STORIES_PART_5,
  ...ENGLISH_STORIES_PART_1,
  ...ENGLISH_STORIES_PART_2,
  ...ENGLISH_STORIES_PART_3,
  ...ENGLISH_STORIES_PART_4,
];
