import { defineSiteIntegration } from '../catalogTypes';
import { jdBookSubject } from './subject';
import { jdBookTools } from './tools';

export const jdBookIntegration = defineSiteIntegration({
  site: jdBookSubject,
  tools: jdBookTools,
});

