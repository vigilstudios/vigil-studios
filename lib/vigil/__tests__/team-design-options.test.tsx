import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeTeamSection } from '@/design-engine/preview/team-fixture';
import { Team } from '@/design-engine/sections/creators/Team';
import { teamSection } from '@/design-engine/registry/team-section';
import { validateDesignRegistry } from '@/design-engine/registry/validation';
import { MotionPolicyProvider } from '@/design-engine/motion/MotionPolicy';
import { PresentationProvider } from '@/design-engine/presentation/PresentationContext';
import { entranceEffects } from '@/design-engine/presentation/schema';
import { parseSection } from '@/design-engine/composition/schemas';
describe('customizable Content Hub Team design', () => {
 it('registers complete presets with declared controls', () => { expect(validateDesignRegistry([teamSection])).toEqual([]); });
 it.each(teamSection.composition.variants.flatMap(structure => ['grid','horizontal'].map(flow => ({structure,flow}))))('renders $structure in $flow flow with all profiles', ({structure,flow}) => {
  const section=makeTeamSection('team',structure,{flow}); if(section.component!=='about.team')throw Error('fixture');
  const html=renderToStaticMarkup(<MotionPolicyProvider mode="none"><Team {...section}/></MotionPolicyProvider>);
  expect(html).toContain(`data-layout="${structure}"`);expect(html).toContain('Alex Morgan');expect(html).toContain('Jordan Lee');expect(html).toContain('<ul');expect(html).toContain('<li');
  if(flow==='horizontal'){expect(html).toContain('tabindex="0"');expect(html).toContain('Scroll The team right');}
 });
 it.each(teamSection.composition.motion)('supports %s and reduced motion without concealed profiles', motion => {
  const section=makeTeamSection('team','cards',{motion}); if(section.component!=='about.team')throw Error('fixture');
  const html=renderToStaticMarkup(<MotionPolicyProvider mode="none"><Team {...section}/></MotionPolicyProvider>);
  expect(html).toContain('Alex Morgan');expect(html).not.toContain('opacity:0');expect(html).not.toContain('inset(0 100%');
 });
 it.each(entranceEffects)('accepts shared %s presentation on a horizontal directory', entrance => {
  const section=parseSection({...makeTeamSection('team','editorial',{flow:'horizontal'}),presentation:{motionMode:'override',motion:{entrance,exit:entrance,stagger:80,sequence:'media-first'}}});
  expect(section.presentation?.motion?.entrance).toBe(entrance);
 });
 it('keeps hidden biographies in Content Hub data and consumes independent visual options',()=>{
  const section=makeTeamSection('team','cards',{portrait:'circle',columns:'four',density:'compact',surface:'framed',alignment:'center',biography:'hidden'});if(section.component!=='about.team')throw Error('fixture');
  const html=renderToStaticMarkup(<Team {...section}/>);
  for(const value of ['data-portrait="circle"','data-columns="four"','data-density="compact"','data-surface="framed"','data-align="center"'])expect(html).toContain(value);
  expect(html).not.toContain(section.content.members[0].bio);expect(section.content.members[0].bio).toBeTruthy();
 });
});

it('respects static-image and shared motion overrides without duplicate native reveals',()=>{
 const section=makeTeamSection('team','cards',{motion:'fade'});if(section.component!=='about.team')throw Error('fixture');
 const html=renderToStaticMarkup(<PresentationProvider value={{imageMotion:'static'}}><Team {...section}/></PresentationProvider>);
 expect(html.match(/data-de-native-reveal=/g)).toHaveLength(3);
 const override=renderToStaticMarkup(<PresentationProvider value={{motionMode:'override',motion:{entrance:'zoom'}}}><Team {...section}/></PresentationProvider>);
 expect(override).not.toContain('data-de-native-reveal');expect(override).toContain('Alex Morgan');
});
