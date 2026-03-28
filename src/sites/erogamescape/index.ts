import { defineSiteIntegration } from '../catalogTypes';
import { erogamescapeSubject } from './subject';
import { erogamescapeTools } from './tools';

export const erogamescapeIntegration = defineSiteIntegration({
  site: erogamescapeSubject,
  tools: erogamescapeTools,
});

