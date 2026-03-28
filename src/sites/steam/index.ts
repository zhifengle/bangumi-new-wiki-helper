import { defineSiteIntegration } from '../catalogTypes';
import { steamSubject } from './subject';
import { steamTools } from './tools';

export const steamIntegration = defineSiteIntegration({
  site: steamSubject,
  tools: steamTools,
});

