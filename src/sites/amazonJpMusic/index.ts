import { defineSiteIntegration } from '../catalogTypes';
import { amazonJpMusicSubject } from './subject';
import { amazonJpMusicTools } from './tools';

export const amazonJpMusicIntegration = defineSiteIntegration({
  site: amazonJpMusicSubject,
  tools: amazonJpMusicTools,
});

