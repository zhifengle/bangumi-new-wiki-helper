import { defineSiteIntegration } from '../catalogTypes';
import { amazonJpBookSubject } from './subject';
import { amazonJpBookTools } from './tools';

export const amazonJpBookIntegration = defineSiteIntegration({
  site: amazonJpBookSubject,
  tools: amazonJpBookTools,
});

