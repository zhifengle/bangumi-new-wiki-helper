import { defineSiteIntegration } from '../catalogTypes';
import { adultComicSubject } from './subject';
import { adultComicTools } from './tools';

export const adultcomicIntegration = defineSiteIntegration({
  site: adultComicSubject,
  tools: adultComicTools,
});

