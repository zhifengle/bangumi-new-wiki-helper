import { definePersonIntegration, defineSiteIntegration } from '../catalogTypes';
import { vgmdbArtist } from './artist';
import { vgmdbOrg } from './org';
import { vgmdbSubject } from './subject';
import { vgmdbTools } from './tools';

export const vgmdbIntegration = defineSiteIntegration({
  site: vgmdbSubject,
  tools: vgmdbTools,
});

export const vgmdbArtistIntegration = definePersonIntegration({
  model: vgmdbArtist,
});

export const vgmdbOrgIntegration = definePersonIntegration({
  model: vgmdbOrg,
});

