import {renderToString} from 'react-dom/server';
import {SitePagePreview} from '../site/render';
import type {SiteDefinition} from '../site/model';
export function renderPage(site:SiteDefinition,pageId:string,contactEndpoint:string){return renderToString(<SitePagePreview site={site} pageId={pageId} embedded={false} contactEndpoint={contactEndpoint}/>);}
