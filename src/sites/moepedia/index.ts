import { defineSiteIntegration } from '../catalogTypes';
import { moepediaSubject } from './subject';
import { moepediaTools } from './tools';

export const moepediaIntegration = defineSiteIntegration({
  site: moepediaSubject,
  tools: moepediaTools,
});

