import { defineSiteIntegration } from '../catalogTypes';
import { dlsiteChara } from './chara';
import { dlsiteSubject } from './subject';
import { dlsiteCharaTools, dlsiteTools } from './tools';

export const dlsiteIntegration = defineSiteIntegration({
  site: dlsiteSubject,
  tools: dlsiteTools,
  charas: [
    {
      model: dlsiteChara,
      tools: dlsiteCharaTools,
    },
  ],
});

