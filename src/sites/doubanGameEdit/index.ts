import { defineSiteIntegration } from '../catalogTypes';
import { doubanGameEditSubject } from './subject';
import { doubanGameEditTools } from './tools';

export const doubanGameEditIntegration = defineSiteIntegration({
  site: doubanGameEditSubject,
  tools: doubanGameEditTools,
});

