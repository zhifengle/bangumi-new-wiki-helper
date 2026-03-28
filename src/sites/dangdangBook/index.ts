import { defineSiteIntegration } from '../catalogTypes';
import { dangdangBookSubject } from './subject';
import { dangdangBookTools } from './tools';

export const dangdangBookIntegration = defineSiteIntegration({
  site: dangdangBookSubject,
  tools: dangdangBookTools,
});

