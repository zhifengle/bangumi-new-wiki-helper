import { defineSiteIntegration } from '../catalogTypes';
import { steamdbSubject } from './subject';
import { steamdbTools } from './tools';

export const steamdbIntegration = defineSiteIntegration({
  site: steamdbSubject,
  tools: steamdbTools,
});

