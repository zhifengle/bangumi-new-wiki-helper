import { defineSiteIntegration } from '../catalogTypes';
import { doubanMusicSubject } from './subject';
import { doubanMusicTools } from './tools';

export const doubanMusicIntegration = defineSiteIntegration({
  site: doubanMusicSubject,
  tools: doubanMusicTools,
});

