import { defineSiteIntegration } from '../catalogTypes';
import { vgmdbSubject } from './subject';
import { vgmdbTools } from './tools';

export const vgmdbIntegration = defineSiteIntegration({
  site: vgmdbSubject,
  tools: vgmdbTools,
});

