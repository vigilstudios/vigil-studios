import Link from 'next/link';
import {Crown, Image as ImageIcon, Plus, Search} from 'lucide-react';
import './premium.css';
export type PremiumPreviewKind = 'content' | 'requests' | 'insights' | 'virtue';

/** The preview is illustration-only. Locked pages never fetch customer records to populate it. */
export function PremiumPreview({kind}:{kind:PremiumPreviewKind}) {
 const content=kind==='content',requests=kind==='requests';
 return <div className="premium-preview-layout">
  <div className="premium-preview-heading"><div><p className="premium-preview-kicker">Workspace preview</p><h2>{content?'Your content, in one place':requests?'Website updates':kind==='insights'?'Website insights':'Your business assistant'}</h2></div><span className="premium-preview-primary"><Plus size={14}/>{content?'Add entry':requests?'New request':'Get started'}</span></div>
  <div className="premium-preview-tabs">{(content?['Gallery','Blog','Portfolio','Testimonials']:requests?['All requests','In progress','Delivered']:['Overview','Activity','Settings']).map((tab,i)=><span key={tab} data-active={i===0}>{tab}</span>)}</div>
  <div className="premium-preview-search"><Search size={15}/><span>{content?'Find your stories, photos and work':requests?'Find a request':'Explore your workspace'}</span></div>
  {content?<div className="premium-preview-grid">{['Your latest story','A moment worth saving','A recent project','Behind the scenes','A brand collaboration','Everyday details'].map((title,i)=><article key={title}><div className={`premium-preview-art premium-preview-art-${i%3}`}><ImageIcon size={28}/></div><h3>{title}</h3><div className="premium-preview-lines"><i/><i/></div><span className="premium-preview-manage">Manage entry</span></article>)}</div>:requests?<div className="premium-preview-requests"><section><h3>New request</h3><span>What would you like to change?</span><div className="premium-preview-field"/><span>Tell us a little more</span><div className="premium-preview-field premium-preview-field-tall"/><div className="premium-preview-primary">Send request</div></section><section><h3>Your requests</h3>{['A content update','A new page detail','A design adjustment'].map(title=><div className="premium-preview-request-row" key={title}><strong>{title}</strong><div className="premium-preview-lines"><i/><i/></div></div>)}</section></div>:<div className="premium-preview-grid">{['An overview of your business','Your recent activity','Your next steps'].map(title=><article key={title}><h3>{title}</h3><div className="premium-preview-lines"><i/><i/><i/></div></article>)}</div>}
 </div>;
}

export function PremiumWall({feature,title,description,planHint,note,previewKind='content'}:{feature:string;title?:string;description:string;planHint:string;note?:string;previewKind?:PremiumPreviewKind}) {
 const id=`premium-${previewKind}`;
 return <div className="premium-stage">
  <div className="premium-backdrop-preview" aria-hidden="true" inert><PremiumPreview kind={previewKind}/></div>
  <div className="premium-veil" aria-hidden="true"/>
  <div className="premium-overlay"><section className="premium-dialog" role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
   <span className="premium-crown" aria-hidden="true"><Crown size={28}/></span>
   <p className="premium-eyebrow">{planHint}</p>
   <h2 id={`${id}-title`}>{title??`Unlock ${feature}`}</h2>
   <p id={`${id}-description`} className="premium-description">{description}</p>
   <Link href="/dashboard/billing" className="btn-primary premium-upgrade">View upgrade options</Link>
   {note?<p className="premium-note">{note}</p>:null}
  </section></div>
 </div>;
}
