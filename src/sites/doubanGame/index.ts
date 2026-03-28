import { defineSiteIntegration } from '../catalogTypes';
import { doubanGameSubject } from './subject';
import { doubanGameTools } from './tools';

export const doubanGameIntegration = defineSiteIntegration({
  site: doubanGameSubject,
  tools: doubanGameTools,
});

